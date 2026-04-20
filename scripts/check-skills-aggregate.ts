#!/usr/bin/env tsx

// Cross-skill (aggregate) checks that can't be done per-skill:
//   1. Duplicate `name:` frontmatter values across skills.
//   2. Per-skill validation for skills WITHOUT a package.json (which can't
//      participate in the per-package `check:skill` turbo task).
//
// The per-skill validator lives in scripts/check-skill.ts and is the source
// of truth for "is this individual skill valid".

import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "node:url";
import { checkSkill, parseFrontmatter } from "./check-skill.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

interface SkillFailure {
  skill: string;
  errors: string[];
}

async function main() {
  const skillFolders = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const failures: SkillFailure[] = [];

  for (const folder of skillFolders) {
    const hasPackage = existsSync(join(SKILLS_DIR, folder, "package.json"));
    if (hasPackage) continue;
    const errors = await checkSkill({
      folderName: folder,
      repoRoot: REPO_ROOT,
    });
    if (errors.length > 0) {
      failures.push({ skill: folder, errors });
    }
  }

  const namesSeen = new Map<string, string>();
  for (const folder of skillFolders) {
    const skillMdPath = join(SKILLS_DIR, folder, "SKILL.md");
    let content: string;
    try {
      content = readFileSync(skillMdPath, "utf-8");
    } catch {
      continue;
    }

    const fm = parseFrontmatter(content);
    if (!fm?.name) continue;

    const existing = namesSeen.get(fm.name);
    if (existing) {
      failures.push({
        skill: folder,
        errors: [
          `Duplicate skill name "${fm.name}" (also used by "${existing}")`,
        ],
      });
    } else {
      namesSeen.set(fm.name, folder);
    }
  }

  if (failures.length === 0) {
    console.log(`Aggregate checks passed (${skillFolders.length} skills)`);
    return;
  }

  for (const { skill, errors } of failures) {
    console.log(`❌ ${skill}`);
    for (const error of errors) {
      console.log(`   • ${error}`);
    }
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exit(1);
});
