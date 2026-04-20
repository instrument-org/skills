#!/usr/bin/env tsx

// Validates a single skill. Designed to be invoked from a skill's package.json
// via `node ../../scripts/check-skill.ts` so turbo can cache the task per-skill
// based on that skill's inputs.
//
// Cross-skill checks (e.g. duplicate names) live in check-skills-aggregate.ts.

import { existsSync, readFileSync, readdirSync } from "fs";
import { spawn } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateTokenCount } from "tokenx";

const NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 1024;
const COMPATIBILITY_MAX_LENGTH = 500;
const SKILL_MD_MAX_LINES = 500;
const SKILL_MD_MAX_TOKENS = 5000;
const KEBAB_CASE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface Frontmatter {
  name?: string;
  description?: string;
  compatibility?: string;
}

export function parseFrontmatter(content: string): Frontmatter | null {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;
  const yaml = content.slice(4, end);
  const result: Frontmatter = {};

  for (const line of yaml.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!match) continue;
    const [, key, value] = match;
    if (
      value !== undefined &&
      (key === "name" || key === "description" || key === "compatibility")
    ) {
      result[key] = value.replace(/^["']|["']$/g, "").trim();
    }
  }

  return result;
}

function validatePackageJson(folderName: string, skillPath: string): string[] {
  const errors: string[] = [];
  const pkgPath = join(skillPath, "package.json");

  if (!existsSync(pkgPath)) return errors;

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    errors.push("package.json is not valid JSON");
    return errors;
  }

  const expectedName = `@instrument-org/skill-${folderName}`;
  if (pkg.name !== expectedName) {
    errors.push(
      `package.json "name" is "${pkg.name}", expected "${expectedName}"`,
    );
  }

  if (pkg.version !== "0.0.0") {
    errors.push(`package.json "version" is "${pkg.version}", expected "0.0.0"`);
  }

  if (pkg.private !== true) {
    errors.push(`package.json "private" must be true`);
  }

  if (pkg.type !== "module") {
    errors.push(`package.json "type" is "${pkg.type}", expected "module"`);
  }

  const scripts = pkg.scripts as Record<string, string> | undefined;
  if (!scripts?.["check:types"]) {
    errors.push(`package.json missing "check:types" script`);
  } else if (scripts["check:types"] !== "tsc --noEmit") {
    errors.push(
      `package.json "check:types" script is "${scripts["check:types"]}", expected "tsc --noEmit"`,
    );
  }

  return errors;
}

const CANONICAL_TSCONFIG_COMPILER_OPTIONS = {
  allowImportingTsExtensions: true,
  esModuleInterop: true,
  isolatedModules: true,
  lib: ["ES2023"],
  module: "ESNext",
  moduleResolution: "Bundler",
  noEmit: true,
  noUncheckedSideEffectImports: true,
  skipLibCheck: true,
  strict: true,
  target: "ES2022",
};

const REQUIRED_INCLUDE_ENTRIES = ["scripts/**/*.ts", "tests/**/*.ts"];

function validateTsconfig(skillPath: string): string[] {
  const tsconfigPath = join(skillPath, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    return ["Missing tsconfig.json"];
  }

  let tsconfig: {
    compilerOptions?: Record<string, unknown>;
    include?: string[];
  };
  try {
    tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
  } catch {
    return ["tsconfig.json is not valid JSON"];
  }

  const errors: string[] = [];

  if (
    JSON.stringify(tsconfig.compilerOptions) !==
    JSON.stringify(CANONICAL_TSCONFIG_COMPILER_OPTIONS)
  ) {
    errors.push("tsconfig.json compilerOptions do not match canonical config");
  }

  for (const entry of REQUIRED_INCLUDE_ENTRIES) {
    if (!tsconfig.include?.includes(entry)) {
      errors.push(`tsconfig.json include missing "${entry}"`);
    }
  }

  return errors;
}

function validateNoAbsoluteSkillPaths(
  folderName: string,
  skillPath: string,
): string[] {
  const errors: string[] = [];
  const escaped = folderName.replace(/[-]/g, "\\-");
  const re = new RegExp(`skills/${escaped}/`);

  const dirsToCheck = ["scripts"];
  const filesToCheck: string[] = [join(skillPath, "SKILL.md")];

  for (const dir of dirsToCheck) {
    const dirPath = join(skillPath, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath, { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => join(dirPath, f.name));
    filesToCheck.push(...files);
  }

  for (const filePath of filesToCheck) {
    if (!existsSync(filePath)) continue;
    const source = readFileSync(filePath, "utf-8");
    if (re.test(source)) {
      const relative = filePath.slice(skillPath.length + 1);
      errors.push(
        `${relative}: references "skills/${folderName}/" (use skill-relative paths instead)`,
      );
    }
  }

  return errors;
}

const CLI_USAGE_RE = /cli\.usage\s*\(/;
const CAC_RE = /\bcac\s*\(/;

function validateScriptCliUsage(skillPath: string): string[] {
  const scriptsDir = join(skillPath, "scripts");
  if (!existsSync(scriptsDir)) return [];

  const errors: string[] = [];
  const files = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith(".ts"))
    .map((f) => join(scriptsDir, f.name));

  for (const filePath of files) {
    const source = readFileSync(filePath, "utf-8");
    if (CAC_RE.test(source) && !CLI_USAGE_RE.test(source)) {
      const relative = filePath.slice(skillPath.length + 1);
      errors.push(`${relative}: missing cli.usage(...) call`);
    }
  }

  return errors;
}

// Spawns generate-skill-md.ts for the given skill (or all skills if undefined).
// `repoRoot` is the directory that contains both `scripts/` and `skills/`.
// Errors are bucketed back to the originating skill so callers can attribute
// them correctly.
function runGeneratedSkillMdCheck({
  repoRoot,
  skillName,
}: {
  repoRoot: string;
  skillName?: string;
}): Promise<Map<string, string>> {
  return new Promise((resolve) => {
    const errorsBySkill = new Map<string, string>();
    const args = ["scripts/generate-skill-md.ts", "--check"];
    if (skillName) {
      args.push("--skill", skillName);
    }
    const child = spawn(process.execPath, args, { cwd: repoRoot });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(errorsBySkill);
        return;
      }

      const errorOutput = [stdout.trim(), stderr.trim()]
        .filter(Boolean)
        .join("\n");

      // generate-skill-md.ts errors are formatted as `${skillName}: <message>`.
      for (const line of errorOutput.split("\n")) {
        const match = line.match(/^([^:\s]+):\s*(.*)$/);
        if (!match) continue;
        const skill = match[1]!;
        const message = match[2]!;
        errorsBySkill.set(
          skill,
          `Generated SKILL.md check failed: ${skill}: ${message}`,
        );
      }

      if (errorsBySkill.size === 0 && errorOutput) {
        errorsBySkill.set(
          "*",
          `Generated SKILL.md check failed: ${errorOutput}`,
        );
      }

      resolve(errorsBySkill);
    });
  });
}

// Runs all single-skill validations EXCEPT cross-skill checks (e.g. duplicate
// names). Cross-skill checks live in check-skills-aggregate.ts.
// `repoRoot` contains `scripts/` and `skills/`.
export async function checkSkill({
  folderName,
  repoRoot,
}: {
  folderName: string;
  repoRoot: string;
}): Promise<string[]> {
  const errors: string[] = [];
  const skillPath = join(repoRoot, "skills", folderName);
  const skillMdPath = join(skillPath, "SKILL.md");

  let content: string;
  try {
    content = readFileSync(skillMdPath, "utf-8");
  } catch {
    errors.push("Missing SKILL.md");
    return errors;
  }

  const lines = content.split("\n");
  if (lines.length > SKILL_MD_MAX_LINES) {
    errors.push(
      `SKILL.md has ${lines.length} lines (max ${SKILL_MD_MAX_LINES})`,
    );
  }

  const tokens = estimateTokenCount(content);
  if (tokens > SKILL_MD_MAX_TOKENS) {
    errors.push(`SKILL.md is ~${tokens} tokens (max ${SKILL_MD_MAX_TOKENS})`);
  }

  if (!KEBAB_CASE_RE.test(folderName)) {
    errors.push(`Folder name "${folderName}" is not kebab-case`);
  }

  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push("Missing or invalid YAML frontmatter");
    return errors;
  }

  if (!fm.name) {
    errors.push('Missing required "name" field');
  } else {
    if (fm.name !== folderName) {
      errors.push(
        `"name" field "${fm.name}" does not match folder name "${folderName}"`,
      );
    }
    if (!KEBAB_CASE_RE.test(fm.name)) {
      errors.push(
        `"name" field "${fm.name}" is not kebab-case (lowercase letters, numbers, hyphens only; no leading/trailing/consecutive hyphens)`,
      );
    }
    if (fm.name.length > NAME_MAX_LENGTH) {
      errors.push(
        `"name" is ${fm.name.length} characters (max ${NAME_MAX_LENGTH})`,
      );
    }
  }

  if (!fm.description) {
    errors.push('Missing required "description" field');
  } else if (fm.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `"description" is ${fm.description.length} characters (max ${DESCRIPTION_MAX_LENGTH})`,
    );
  }

  if (
    fm.compatibility !== undefined &&
    fm.compatibility.length > COMPATIBILITY_MAX_LENGTH
  ) {
    errors.push(
      `"compatibility" is ${fm.compatibility.length} characters (max ${COMPATIBILITY_MAX_LENGTH})`,
    );
  }

  const hasScripts = existsSync(join(skillPath, "scripts"));
  const hasPackageJson = existsSync(join(skillPath, "package.json"));

  if (hasScripts && !hasPackageJson) {
    errors.push(
      "Missing package.json (required when scripts/ directory exists)",
    );
  }

  errors.push(...validatePackageJson(folderName, skillPath));

  if (hasPackageJson) {
    errors.push(...validateTsconfig(skillPath));
  }
  errors.push(...validateNoAbsoluteSkillPaths(folderName, skillPath));
  errors.push(...validateScriptCliUsage(skillPath));

  const templatePath = join(skillPath, "SKILL.template.md");
  if (existsSync(templatePath)) {
    const generated = await runGeneratedSkillMdCheck({
      repoRoot,
      skillName: folderName,
    });
    const err = generated.get(folderName) ?? generated.get("*");
    if (err) {
      errors.push(err);
    }
  }

  return errors;
}

function parseSkillName(): string {
  const argv = process.argv.slice(2);
  const flagIdx = argv.indexOf("--skill");
  if (flagIdx >= 0 && flagIdx + 1 < argv.length) {
    return argv[flagIdx + 1]!;
  }
  return basename(process.cwd());
}

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const folderName = parseSkillName();

  const errors = await checkSkill({ folderName, repoRoot });

  if (errors.length === 0) {
    console.log(`✅ ${folderName}`);
    return;
  }

  console.log(`❌ ${folderName}`);
  for (const error of errors) {
    console.log(`   • ${error}`);
  }
  process.exit(1);
}

// Only run as CLI when executed directly (not when imported by the aggregate
// script for the agent-browser fallback).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exit(1);
  });
}
