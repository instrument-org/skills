// Checks what instrument-page and wireframe promise beyond the per-skill rules:
//
//   1. Each description fits the routing budget. Both share the agent's skill
//      index with every other skill, so they are held well under the spec's 1024.
//   2. instrument-page's SKILL.md names every kit README, every reference and every
//      cookbook recipe. The runtime hands an agent at most fifty filenames from a
//      loaded skill, so a file the router does not name is one an agent may never
//      see, and a recipe it does not name is one it will not look for.
//   3. Neither skill passes fifty files, for the same reason.
//   4. Every host page.mjs lets a page load is one allowed-sources.json allows,
//      since the pages worker derives a hosted copy's connect-src from that file.
//   5. Every kit skeleton opens as a page page.mjs will accept.
//
// Run by `pnpm check:page-skill` and in CI.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./check-skill.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE_SKILL = join(REPO_ROOT, "skills", "instrument-page");
const WIREFRAME_SKILL = join(REPO_ROOT, "skills", "wireframe");
const DESCRIPTION_MAX_LENGTH = 400;
const MAX_FILES = 50;

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(join(dir, entry.name))
      : [join(dir, entry.name)],
  );

function checkSkillShape(dir: string, errors: string[]) {
  const name = relative(REPO_ROOT, dir);
  const skillMd = readFileSync(join(dir, "SKILL.md"), "utf-8");
  const description = parseFrontmatter(skillMd)?.description ?? "";
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `${name}: description is ${description.length} characters (max ${DESCRIPTION_MAX_LENGTH})`,
    );
  }
  const count = filesUnder(dir).length;
  if (count > MAX_FILES) {
    errors.push(
      `${name}: ${count} files; an agent is handed at most ${MAX_FILES}`,
    );
  }
  return skillMd;
}

function checkRouter(skillMd: string, errors: string[]) {
  const kits = readdirSync(join(PAGE_SKILL, "kits"));
  for (const kit of kits) {
    if (!existsSync(join(PAGE_SKILL, "kits", kit, "README.md"))) {
      errors.push(`kits/${kit} has no README.md`);
    } else if (!skillMd.includes(`kits/${kit}/README.md`)) {
      errors.push(`SKILL.md never links kits/${kit}/README.md`);
    }
  }
  for (const reference of readdirSync(join(PAGE_SKILL, "references"))) {
    if (!skillMd.includes(`references/${reference}`)) {
      errors.push(`SKILL.md never links references/${reference}`);
    }
  }
  const cookbook = readFileSync(join(PAGE_SKILL, "cookbook.md"), "utf-8");
  const named = skillMd.toLowerCase();
  for (const [, heading = ""] of cookbook.matchAll(/^## (.+)$/gm)) {
    if (!named.includes(heading.toLowerCase())) {
      errors.push(`SKILL.md never names the cookbook recipe "${heading}"`);
    }
  }
}

function checkHosts(errors: string[]) {
  const allowed = JSON.parse(
    readFileSync(join(REPO_ROOT, "allowed-sources.json"), "utf-8"),
  ) as { tags: { origin: string }[] };
  const origins = new Set(allowed.tags.map((tag) => tag.origin));
  const check = readFileSync(join(PAGE_SKILL, "lib", "check.mjs"), "utf-8");
  const list = check.match(/const ALLOWED = \[([\s\S]*?)\];/)?.[1];
  if (!list) {
    errors.push("lib/check.mjs has no ALLOWED list");
    return;
  }
  for (const [, host = ""] of list.matchAll(
    /\^https:\\\/\\\/([\w\\.-]+?)\\\//g,
  )) {
    const origin = `https://${host.replaceAll("\\", "")}`;
    if (!origins.has(origin)) {
      errors.push(
        `lib/check.mjs lets a page load from ${origin}, which allowed-sources.json does not allow`,
      );
    }
  }
}

function checkSkeletons(errors: string[]) {
  for (const file of filesUnder(join(PAGE_SKILL, "kits"))) {
    if (!file.endsWith("skeleton.html")) continue;
    const name = relative(PAGE_SKILL, file);
    const html = readFileSync(file, "utf-8");
    const wants: [RegExp, string][] = [
      [/^<!doctype html>/i, "a doctype on the first line"],
      [/<!--\s*direction:[^>]*\bpoint\s*=/, "a direction comment with a point"],
      [/<html\b[^>]*\bdata-shape="(card|read|sheet|wall)"/, "a data-shape"],
      [/<title>[^<]+<\/title>/, "a title"],
      [/<meta\s+name="description"/, "a meta description"],
      [/class="[^"]*\bhero\b/, 'an element with class="hero"'],
    ];
    for (const [re, what] of wants) {
      if (!re.test(html)) errors.push(`${name} has no ${what}`);
    }
    const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
    if (h1s !== 1) errors.push(`${name} has ${h1s} h1 elements, not one`);
    if (html.includes("—")) errors.push(`${name} has an em dash`);
  }
}

const errors: string[] = [];
checkRouter(checkSkillShape(PAGE_SKILL, errors), errors);
checkSkillShape(WIREFRAME_SKILL, errors);
checkHosts(errors);
checkSkeletons(errors);

if (errors.length > 0) {
  for (const error of errors) console.log(`❌ ${error}`);
  process.exit(1);
}
console.log("instrument-page and wireframe checks passed");
