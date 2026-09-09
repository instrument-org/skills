// Shared reader for ideas: the skills that carry an `idea.json` sidecar and an
// `examples/` folder, which the website renders as Discover pages. Used by
// preview.ts, capture.ts, and check-ideas.ts.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SKILLS_DIR = join(REPO_ROOT, "skills");
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
  starterPath: string;
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
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(SKILLS_DIR, name, "idea.json")))
    .sort()
    .map((name) => readIdea(name));
}

export function readIdea(name: string): Idea {
  const dir = join(SKILLS_DIR, name);
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
    starterPath: join(dir, "starter.html"),
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
