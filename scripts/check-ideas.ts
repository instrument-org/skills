// Validates the create-page skill and every template inside it. The templates
// are what the website renders as Discover pages, where they are called ideas.
// Run by `pnpm check:ideas` and in CI.
//
// The skill passes when its description fits the agent's index, it links every
// template it ships, and its one starter carries the shared skin verbatim. A
// template passes when it has a spec and a main, its sidecar is complete, it has
// three or more examples with design notes, every example's capture matches the
// HTML it was made from, and no file depends on anything outside itself.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "./check-skill.ts";
import {
  type ExampleMeta,
  type Idea,
  listIdeas,
  normalizedSkin,
  PAGE_SKILL_DIR,
  pageShell,
  sha256,
  shellBlocksOf,
  skinBlockOf,
  STARTER_PATH,
} from "./ideas.ts";

// The one description the whole family routes on. It shares the agent's skill
// index with every other skill, so it is budgeted well under the 1024 the spec
// allows, but it has sixteen templates to name and gets more room than any one
// of them used to have.
const SKILL_DESCRIPTION_MAX_LENGTH = 400;
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
  { origin: "https://tryinstrument.com", path: "/page.js" },
  // What a page may reach for when the material is a dataset rather than an
  // argument. Each is pinned to an exact version in the URL, each is small
  // against what the page already spends on type and icons, and none of them
  // may be the only copy of anything: the offline test in SKILL.md is what
  // keeps this list from becoming a license to build pages that need the
  // network. The path prefix ends in `@` so an unpinned URL cannot match.
  { origin: "https://cdn.jsdelivr.net", path: "/npm/chart.js@" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/leaflet@" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/sql.js@" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/tabulator-tables@" },
  // Observable Plot draws SVG rather than canvas, which is why it is here
  // alongside Chart.js rather than instead of it: a mark can take a theme token
  // straight from CSS, and the result prints and scales. Its UMD bundle does not
  // carry d3, so both files are needed and both are listed.
  { origin: "https://cdn.jsdelivr.net", path: "/npm/@observablehq/plot@" },
  { origin: "https://cdn.jsdelivr.net", path: "/npm/d3@" },
];
// The share widget, carried by every page. Byte identity is the whole rule: the
// widget hashes the page as the browser serialized it and that hash is the
// link's address, so a tag differing by one character publishes the same page to
// a second address, with no error to say so. The site serves nothing here until
// the widget deploys, and a script that 404s leaves the page exactly as it is.
const PAGE_WIDGET_TAG =
  '<script async src="https://tryinstrument.com/page.js"></script>';
// The Instrument mark. Checked by its opening rather than in full because the
// shell comparison already holds every page to the starter byte for byte; what
// this catches is the starter itself losing the icon, which would otherwise
// propagate to all of them as an absence nothing reports.
const PAGE_ICON_OPENING = '<link rel="icon" href="data:image/svg+xml,';
// The addresses a script on these pages may build, which the scan below cannot
// see because they are assembled at runtime. Every one is decoration or a
// pinned asset of something already in ALLOWED_SOURCES, and every one is
// absent-safe: with the network off the page reads exactly as it does with it.
// Anything else a script reaches for is a load this file cannot see and must
// not have.
const SCRIPT_BUILT_PREFIXES = [
  // A link wears the icon of the site it points at, and no CSS can read a host
  // out of an href, so the URL is built from the link.
  "https://t0.gstatic.com",
  // sql.js is handed its own wasm path through `locateFile`, so the engine's
  // second file is named in script rather than in a tag.
  "https://cdn.jsdelivr.net/npm/sql.js@",
  // Map tiles are a URL template a map library fills in per tile. A page whose
  // tiles never arrive still carries its places as a list, which is the rule
  // the map template is built around.
  "https://tile.openstreetmap.org/",
  "https://www.openstreetmap.org/copyright",
];
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

export function checkPageWidget(file: string, html: string, errors: string[]) {
  if (html.includes(PAGE_WIDGET_TAG)) return;
  const near = /<script[^>]*tryinstrument\.com[^>]*>[\s\S]*?<\/script>/.exec(
    html,
  );
  errors.push(
    near
      ? `${file}: the page widget tag is modified; it must be exactly ${PAGE_WIDGET_TAG}, byte for byte, or the page publishes to a different address`
      : `${file}: no page widget tag; every page carries ${PAGE_WIDGET_TAG}`,
  );
}

export function checkPageIcon(file: string, html: string, errors: string[]) {
  if (html.includes(PAGE_ICON_OPENING)) return;
  errors.push(
    `${file}: no inline icon; every page carries \`${PAGE_ICON_OPENING}…">\`, so a tab wears the mark with nothing to fetch`,
  );
}

/**
 * A page against the starter's shared regions. The starter owns them, so this
 * is the check that stops a page-wide line from reaching some pages and not
 * others, which is how the type and the page behavior drifted before.
 */
export function checkShell(
  file: string,
  html: string,
  shell: string[],
  errors: string[],
) {
  const blocks = shellBlocksOf(html);
  if (blocks.length !== shell.length) {
    errors.push(
      `${file}: has ${blocks.length} shared region(s) where the starter has ${shell.length}; run \`pnpm fix:shell\``,
    );
    return;
  }
  const at = blocks.findIndex((block, index) => block !== shell[index]);
  if (at !== -1) {
    errors.push(
      `${file}: shared region ${at + 1} differs from starter.html; run \`pnpm fix:shell\``,
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
      if (!SCRIPT_BUILT_PREFIXES.some((p) => match[0].startsWith(p))) {
        errors.push(
          `${file}: a script reaches ${match[0].slice(0, 80)}, which is not an address a script may build at runtime`,
        );
      }
    }
  }
}

/**
 * The parts that are one skill's rather than one template's: the shared shell
 * every page is copied from, and the single description the whole family routes
 * on. Both used to be checked sixteen times over sixteen copies.
 */
function checkPageSkill(): string[] {
  const errors: string[] = [];

  const skillMd = readFileSync(join(PAGE_SKILL_DIR, "SKILL.md"), "utf-8");
  const fm = parseFrontmatter(skillMd);
  if (!fm?.description) {
    errors.push("SKILL.md has no description");
  } else if (fm.description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `description is ${fm.description.length} characters (max ${SKILL_DESCRIPTION_MAX_LENGTH}); it shares the agent's skill index with every other skill`,
    );
  }
  // Every template has to be reachable by name from the router, because the
  // runtime truncates the file listing an agent is handed and a template it
  // cannot see is a template it cannot open.
  for (const idea of listIdeas()) {
    if (!skillMd.includes(`templates/${idea.name}/template.md`)) {
      errors.push(`SKILL.md never links templates/${idea.name}/template.md`);
    }
  }

  if (!existsSync(STARTER_PATH)) {
    errors.push("starter.html is missing");
    return errors;
  }
  const starter = readFileSync(STARTER_PATH, "utf-8");
  const block = skinBlockOf(starter);
  if (block === null) {
    errors.push("starter.html has no /* skin:start */ … /* skin:end */ block");
  } else if (block !== normalizedSkin()) {
    errors.push("starter.html's skin block differs from skin/theme.css");
  }
  checkSelfContained("starter.html", starter, errors);
  checkPageWidget("starter.html", starter, errors);
  checkPageIcon("starter.html", starter, errors);
  if (shellBlocksOf(starter).length === 0) {
    errors.push(
      "starter.html has no shell:start … shell:end pair; the shared regions are what every page is held to",
    );
  }

  return errors;
}

function checkIdea(idea: Idea, shell: string[]): string[] {
  const errors: string[] = [];
  if (!existsSync(join(idea.dir, "template.md"))) {
    errors.push("template.md is missing");
  }
  if (!existsSync(join(idea.dir, "main.html"))) {
    errors.push("main.html is missing");
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
    checkPageWidget(`${label}.html`, html, errors);
    checkPageIcon(`${label}.html`, html, errors);
    checkShell(`${label}.html`, html, shell, errors);
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
      `No templates found under ${PAGE_SKILL_DIR}. Either none carry an idea.json, or they moved and listIdeas() in ideas.ts has not followed.`,
    );
    process.exit(1);
  }
  let failed = false;
  // Checked once because there is one of each now: the shell every page copies,
  // and the description the whole family routes on.
  const skillErrors = only ? [] : checkPageSkill();
  if (skillErrors.length > 0) {
    failed = true;
    console.log("❌ create-page");
    for (const error of skillErrors) console.log(`   • ${error}`);
  } else if (!only) {
    console.log("✅ create-page");
  }
  // Read once: every page is compared against the same starter.
  const shell = pageShell();
  for (const idea of ideas) {
    const errors = checkIdea(idea, shell);
    if (errors.length === 0) {
      console.log(`✅ ${idea.name}`);
      continue;
    }
    failed = true;
    console.log(`❌ ${idea.name}`);
    for (const error of errors) console.log(`   • ${error}`);
  }
  console.log(`${ideas.length} template(s) checked`);
  if (failed) process.exit(1);
}

// Imported by its tests, so only run as a command.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
