// Validates every idea: the skills that carry an idea.json and are rendered as
// Discover pages on the website. Run by `pnpm check:ideas` and in CI.
//
// An idea passes when its sidecar is complete, its description is short enough
// for the agent's index, it has three or more examples with design notes, every
// example's capture matches the HTML it was made from, its starter carries the
// shared skin verbatim, and no file depends on anything outside itself.

import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "./check-skill.ts";
import {
  type ExampleMeta,
  type Idea,
  listIdeas,
  normalizedSkin,
  sha256,
  skinBlockOf,
  SKILLS_DIR,
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
// The rows a sketch may carry; the website draws them. See AGENTS.md, Ideas.
const SKETCH_ROWS = new Set([
  "k",
  "t",
  "T",
  "p",
  "s",
  "c2",
  "c3",
  "c4",
  "l",
  "m",
  "g",
  "d",
  "b",
  "v",
  "q",
  "x",
  "n",
  "2",
]);
const IDEA_KEYS = [
  "title",
  "tagline",
  "when",
  "tags",
  "order",
  "needs",
  "cover",
];
const EXAMPLE_KEYS = ["title", "variant", "prompt", "model", "note"];
/** A variant line is a card caption, so it has to fit on one. */
const VARIANT_MAX_CHARS = 80;

// What a page may load, as an exact origin and the path that family lives
// under. Matched through `new URL()` rather than by string prefix, so a
// lookalike host like fonts.googleapis.com.example.net does not pass.
// Everything else has to be inlined. Hyperlinks are not loads and are free.
const ALLOWED_SOURCES = [
  { origin: "https://fonts.googleapis.com", path: "/" },
  { origin: "https://fonts.gstatic.com", path: "/" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/@tailwindcss/browser@" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/@phosphor-icons/web@" },
];
// The one remote address a script on these pages may build. A link wears the
// icon of the site it points at, and no CSS can read a host out of an href, so
// the icon's URL is assembled at runtime and is invisible to the scan below.
// It is allowed because it is decoration: offline the icons never arrive and
// every page reads exactly as it does with them. Anything else a script
// reaches for is a load this file cannot see and must not have.
const SCRIPT_BUILT_ORIGIN = "https://t0.gstatic.com";
// Tags that fetch what they name, and the attributes they fetch it through.
const LOADER_TAGS = ["link", "script"];
const MEDIA_TAGS = ["img", "video", "audio", "iframe", "source", "embed"];
const MEDIA_URL_ATTRIBUTES = ["src", "poster", "srcset"];

function isAllowedSource(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return ALLOWED_SOURCES.some(
    (source) =>
      parsed.origin === source.origin &&
      parsed.pathname.startsWith(source.path),
  );
}

/**
 * Values of `attribute` on any of `tags`, in all three of HTML's quoting forms,
 * since generated markup varies and an unquoted or single-quoted src loads just
 * as well as a double-quoted one.
 */
function attributeValues(
  html: string,
  tags: string[],
  attribute: string,
): string[] {
  const pattern = new RegExp(
    `<(?:${tags.join("|")})\\b[^>]*?\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "gi",
  );
  return [...html.matchAll(pattern)].map(
    (match) => match[1] ?? match[2] ?? match[3] ?? "",
  );
}

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

export function checkExampleMeta(
  label: string,
  meta: ExampleMeta,
  errors: string[],
) {
  for (const key of EXAMPLE_KEYS) {
    // Present is not enough: capture writes a blank sidecar when one is
    // missing, and a blank design note is the failure this check exists for.
    const value = meta[key as keyof ExampleMeta];
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${label}.json needs a non-empty "${key}"`);
    }
  }
  if (
    typeof meta.variant === "string" &&
    meta.variant.length > VARIANT_MAX_CHARS
  ) {
    errors.push(
      `${label}.json: "variant" is ${meta.variant.length} characters, over the ${VARIANT_MAX_CHARS} a caption may take`,
    );
  }
}

export function checkSelfContained(
  file: string,
  html: string,
  errors: string[],
) {
  for (const attribute of ["href", "src"]) {
    for (const url of attributeValues(html, LOADER_TAGS, attribute)) {
      if (url.startsWith("data:")) continue;
      if (!isAllowedSource(url)) {
        errors.push(`${file}: loads ${url}, which is not an allowed source`);
      }
    }
  }
  for (const attribute of MEDIA_URL_ATTRIBUTES) {
    for (const value of attributeValues(html, MEDIA_TAGS, attribute)) {
      // A srcset holds several candidates, and a data URI has commas in it, so
      // ask whether a remote scheme appears at all rather than splitting it.
      const remote =
        attribute === "srcset"
          ? /https?:\/\//i.test(value)
          : !value.startsWith("data:");
      if (remote) {
        errors.push(
          `${file}: ${attribute} loads ${value.slice(0, 80)}; media must be inline data so the file opens anywhere`,
        );
      }
    }
  }
  // CSS reaches the network too, from a style attribute or a <style> block.
  for (const match of html.matchAll(/url\(\s*['"]?(https?:[^)'"]+)/gi)) {
    const url = match[1] ?? "";
    if (!isAllowedSource(url)) {
      errors.push(
        `${file}: a stylesheet loads ${url.slice(0, 80)}; it must be inline data`,
      );
    }
  }
  // A script builds its addresses at runtime, where nothing above can see them.
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const match of (script[1] ?? "").matchAll(/https?:\/\/[^\s"'`]+/g)) {
      if (!match[0].startsWith(SCRIPT_BUILT_ORIGIN)) {
        errors.push(
          `${file}: a script reaches ${match[0].slice(0, 80)}; only ${SCRIPT_BUILT_ORIGIN} may be built at runtime`,
        );
      }
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
  if (idea.meta.sketch) {
    for (const row of idea.meta.sketch) {
      if (!SKETCH_ROWS.has(row)) {
        errors.push(
          `idea.json sketch row "${row}" is not one the site can draw`,
        );
      }
    }
    if (idea.meta.sketch.length > 7) {
      errors.push(
        "idea.json sketch has more than seven rows; a tile has room for six",
      );
    }
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
    checkExampleMeta(label, example.meta, errors);
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
  // `node scripts/check-ideas.ts <name>` checks one idea while others are in flight.
  const only = process.argv[2];
  const ideas = listIdeas().filter((idea) => !only || idea.name === only);
  if (only && ideas.length === 0) {
    console.log(`No idea named "${only}"`);
    process.exit(1);
  }
  // Finding nothing is the one result that must not read as success: move the
  // ideas and this passes every check by checking no file, which is worse than
  // failing because nothing says so.
  if (!only && ideas.length === 0) {
    console.log(
      `No ideas found under ${SKILLS_DIR}. Either none carry an idea.json, or they moved and listIdeas() in ideas.ts has not followed.`,
    );
    process.exit(1);
  }
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

// Imported by its tests, so only run as a command.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
