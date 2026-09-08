// Validates every idea: the skills that carry an idea.json and are rendered as
// Discover pages on the website. Run by `pnpm check:ideas` and in CI.
//
// An idea passes when its sidecar is complete, its description is short enough
// for the agent's index, it has three or more examples with design notes, every
// example's capture matches the HTML it was made from, its starter carries the
// shared skin verbatim, and no file depends on anything outside itself.

import { existsSync, readFileSync } from "node:fs";
import { parseFrontmatter } from "./check-skill.ts";
import {
  type Idea,
  listIdeas,
  normalizedSkin,
  sha256,
  skinBlockOf,
} from "./ideas.ts";

// Ideas share the agent's skill index with every other skill, so their
// descriptions are budgeted tighter than the 1024 characters the spec allows.
const IDEA_DESCRIPTION_MAX_LENGTH = 220;
const MIN_EXAMPLES = 3;
// A page travels as one file, so its size is its shareability. Inline images
// are where it goes wrong: a handful at a few megabytes each and the file no
// longer opens in a mail client or a chat.
const EXAMPLE_MAX_BYTES = 1_500_000;
const INLINE_IMAGE_MAX_BYTES = 200_000;
const IDEA_KEYS = [
  "title",
  "tagline",
  "when",
  "tags",
  "order",
  "needs",
  "cover",
];
const EXAMPLE_KEYS = ["title", "prompt", "model", "note"];

// Hosts a page may load from. Everything else has to be inlined.
const ALLOWED_HOSTS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@",
  "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@",
];

function checkSize(file: string, html: string, errors: string[]) {
  const bytes = Buffer.byteLength(html);
  if (bytes > EXAMPLE_MAX_BYTES) {
    errors.push(
      `${file}: ${Math.round(bytes / 1000)} KB, over the ${EXAMPLE_MAX_BYTES / 1000} KB a page may weigh; shrink its images`,
    );
  }
  for (const match of html.matchAll(
    /src="data:image\/[^;]+;base64,([^"]+)"/g,
  )) {
    const encoded = match[1] ?? "";
    const decoded = Math.floor((encoded.length * 3) / 4);
    if (decoded > INLINE_IMAGE_MAX_BYTES) {
      errors.push(
        `${file}: an inline image is ${Math.round(decoded / 1000)} KB, over ${INLINE_IMAGE_MAX_BYTES / 1000} KB; resize it to about 720 pixels wide at JPEG quality 78`,
      );
    }
  }
}

function checkSelfContained(file: string, html: string, errors: string[]) {
  for (const match of html.matchAll(
    /<(?:link|script)\b[^>]*?(?:href|src)="([^"]+)"/g,
  )) {
    const url = match[1] ?? "";
    if (url.startsWith("data:")) continue;
    if (!ALLOWED_HOSTS.some((host) => url.startsWith(host))) {
      errors.push(`${file}: loads ${url}, which is not an allowed host`);
    }
  }
  for (const match of html.matchAll(
    /<(?:img|video|audio|iframe|source)\b[^>]*?src="([^"]+)"/g,
  )) {
    const url = match[1] ?? "";
    if (!url.startsWith("data:")) {
      errors.push(
        `${file}: embeds ${url.slice(0, 80)}; media must be inline data so the file opens anywhere`,
      );
    }
  }
}

function checkIdea(idea: Idea): string[] {
  const errors: string[] = [];
  const skillMd = readFileSync(`${idea.dir}/SKILL.md`, "utf-8");
  const fm = parseFrontmatter(skillMd);
  if (fm?.description && fm.description.length > IDEA_DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `description is ${fm.description.length} characters (max ${IDEA_DESCRIPTION_MAX_LENGTH} for an idea)`,
    );
  }

  if (!idea.meta) {
    errors.push("idea.json is missing or not valid JSON");
    return errors;
  }
  for (const key of IDEA_KEYS) {
    if (!(key in idea.meta)) errors.push(`idea.json is missing "${key}"`);
  }
  if (!Array.isArray(idea.meta.tags) || idea.meta.tags.length === 0) {
    errors.push("idea.json needs at least one tag");
  }

  if (!existsSync(idea.starterPath)) {
    errors.push("starter.html is missing");
  } else {
    const starter = readFileSync(idea.starterPath, "utf-8");
    const block = skinBlockOf(starter);
    if (block === null) {
      errors.push(
        "starter.html has no /* skin:start */ … /* skin:end */ block",
      );
    } else if (block !== normalizedSkin()) {
      errors.push("starter.html's skin block differs from skin/theme.css");
    }
    checkSelfContained("starter.html", starter, errors);
  }

  if (idea.examples.length < MIN_EXAMPLES) {
    errors.push(
      `${idea.examples.length} example(s) in examples/ (an idea needs ${MIN_EXAMPLES})`,
    );
  }
  const names = new Set(idea.examples.map((e) => e.name));
  if (idea.meta.cover && !names.has(idea.meta.cover)) {
    errors.push(`idea.json cover "${idea.meta.cover}" is not an example`);
  }

  for (const example of idea.examples) {
    const label = `examples/${example.name}`;
    const html = readFileSync(example.htmlPath, "utf-8");
    checkSelfContained(`${label}.html`, html, errors);
    checkSize(`${label}.html`, html, errors);
    if (skinBlockOf(html) !== normalizedSkin()) {
      errors.push(
        `${label}.html: skin block missing or differs from skin/theme.css`,
      );
    }
    if (!example.meta) {
      errors.push(`${label}.json is missing or not valid JSON`);
      continue;
    }
    for (const key of EXAMPLE_KEYS) {
      if (!(key in example.meta))
        errors.push(`${label}.json is missing "${key}"`);
    }
    if (!existsSync(example.capturePath)) {
      errors.push(`${label}: no capture; run \`pnpm capture ${idea.name}\``);
    } else if (example.meta.html_sha256 !== sha256(html)) {
      errors.push(
        `${label}: capture is older than the HTML; run \`pnpm capture ${idea.name}\``,
      );
    }
  }

  return errors;
}

function main() {
  const ideas = listIdeas();
  let failed = false;
  for (const idea of ideas) {
    const errors = checkIdea(idea);
    if (errors.length === 0) {
      console.log(`✅ ${idea.name}`);
      continue;
    }
    failed = true;
    console.log(`❌ ${idea.name}`);
    for (const error of errors) console.log(`   • ${error}`);
  }
  console.log(`${ideas.length} idea(s) checked`);
  if (failed) process.exit(1);
}

main();
