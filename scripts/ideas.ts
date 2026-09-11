// Shared reader for ideas: the templates inside the `create-page` skill that
// carry an `idea.json` sidecar and an `examples/` folder, which the website
// renders as Discover pages. Used by preview.ts, capture.ts, and check-ideas.ts.
//
// "Idea" is the website's word for one of these and stays the website's word,
// because it is baked into its URLs, its components, and its analytics.
// "Template" is what the agent calls the same thing. This file is the seam, so
// it is the one place both names appear.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
/** What a page may load, read here by the checker and by the platform's pages worker. */
export const ALLOWED_SOURCES_PATH = join(REPO_ROOT, "allowed-sources.json");
/** The skill the templates live in. One starter serves all of them. */
export const PAGE_SKILL_DIR = join(SKILLS_DIR, "create-page");
const TEMPLATES_DIR = join(PAGE_SKILL_DIR, "templates");
/** The single shared shell, checked once rather than once per template. */
export const STARTER_PATH = join(PAGE_SKILL_DIR, "starter.html");
const CAPTURES_DIR = join(REPO_ROOT, "captures");
const SKIN_PATH = join(REPO_ROOT, "skin", "theme.css");

export interface IdeaMeta {
  title: string;
  tagline: string;
  when: string;
  tags: string[];
  order: number;
  needs: string[];
  cover: string;
  sections?: string[];
  sketch?: string[];
}

export interface ExampleMeta {
  title: string;
  variant: string;
  prompt: string;
  model: string;
  note: string;
  illustrative?: boolean;
  html_sha256?: string;
}

export interface Example {
  /** File stem, e.g. `standing-desks`. */
  name: string;
  htmlPath: string;
  metaPath: string;
  capturePath: string;
  meta: ExampleMeta | null;
}

export interface Idea {
  name: string;
  dir: string;
  metaPath: string;
  meta: IdeaMeta | null;
  examples: Example[];
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function listIdeas(): Idea[] {
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(TEMPLATES_DIR, name, "idea.json")))
    .sort()
    .map((name) => readIdea(name));
}

export function readIdea(name: string): Idea {
  const dir = join(TEMPLATES_DIR, name);
  const metaPath = join(dir, "idea.json");
  const examplesDir = join(dir, "examples");
  const examples: Example[] = existsSync(examplesDir)
    ? readdirSync(examplesDir)
        .filter((f) => f.endsWith(".html"))
        .sort()
        .map((file) => {
          const stem = file.slice(0, -".html".length);
          const metaPath = join(examplesDir, `${stem}.json`);
          return {
            name: stem,
            htmlPath: join(examplesDir, file),
            metaPath,
            capturePath: join(CAPTURES_DIR, name, `${stem}.png`),
            meta: readJson<ExampleMeta>(metaPath),
          };
        })
    : [];
  return {
    name,
    dir,
    metaPath,
    meta: readJson<IdeaMeta>(metaPath),
    examples,
  };
}

/** The skin as a starter must carry it, with whitespace collapsed so that a
 *  formatter wrapping the CSS file and the inline copy differently is not a
 *  difference. */
export function normalizedSkin(): string {
  return normalize(readFileSync(SKIN_PATH, "utf-8"));
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** The skin block a starter or example carries, between its markers. */
export function skinBlockOf(html: string): string | null {
  const start = html.indexOf("/* skin:start */");
  const end = html.indexOf("/* skin:end */");
  if (start === -1 || end === -1 || end < start) return null;
  return normalize(html.slice(start + "/* skin:start */".length, end));
}

export const SHELL_START = "<!-- shell:start -->";
export const SHELL_END = "<!-- shell:end -->";
/** A note for whoever edits the starter, dropped on the way to a page. */
const SHELL_NOTE = /^[ \t]*<!-- shell:note[\s\S]*?-->[ \t]*\n/gm;

/**
 * The shared regions a page carries, in document order. There are several
 * rather than one because a page may put its own CSS between the framework and
 * the shared behavior, so the shared parts are not contiguous.
 */
export function shellBlocksOf(html: string): string[] {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const start = html.indexOf(SHELL_START, from);
    if (start === -1) return blocks;
    const end = html.indexOf(SHELL_END, start);
    if (end === -1) return blocks;
    blocks.push(html.slice(start + SHELL_START.length, end));
    from = end + SHELL_END.length;
  }
}

/**
 * The starter's shell as a page must carry it, which is to say without the
 * notes. A note records why a line reads the way it does, which is worth having
 * where the shell is edited and is noise in the finished pages copied from it.
 * Comments inside the skin are CSS and survive, being no part of the HTML.
 */
export function pageShell(): string[] {
  const blocks = shellBlocksOf(readFileSync(STARTER_PATH, "utf-8"));
  if (blocks.length === 0) {
    throw new Error(
      `starter.html has no ${SHELL_START} … ${SHELL_END} pair, so there is no shell to copy.`,
    );
  }
  return blocks.map((block) => block.replaceAll(SHELL_NOTE, ""));
}
