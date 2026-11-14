// Names the git repository a wireframe is drawn for, so a folder of pages from
// several products can be told apart: `instrument:repo` beside the page's
// `instrument:idea`. Reads .git from disk rather than running git, which an
// installed skill cannot count on.
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

/**
 * The repository `dir` is in: the last segment of its `origin` remote, which
 * reads the same in every clone and worktree, or else the main checkout's
 * folder name. Undefined outside a repository.
 * @param {string} dir
 * @returns {string | undefined}
 */
export function repoName(dir) {
  for (let top = resolve(dir); ; top = dirname(top)) {
    const dotGit = join(top, ".git");
    if (existsSync(dotGit)) return nameFrom(top, dotGit);
    if (dirname(top) === top) return undefined;
  }
}

/** @param {string} top @param {string} dotGit */
function nameFrom(top, dotGit) {
  // A worktree or submodule has a .git file pointing at its git dir, and a
  // worktree's git dir points on to the repository's own in `commondir`.
  let gitDir = dotGit;
  if (statSync(dotGit).isFile()) {
    const pointer = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, "utf8"));
    if (!pointer?.[1]) return basename(top);
    gitDir = resolve(top, pointer[1].trim());
  }
  const commondir = join(gitDir, "commondir");
  const common = existsSync(commondir)
    ? resolve(gitDir, readFileSync(commondir, "utf8").trim())
    : gitDir;
  const config = join(common, "config");
  const url = existsSync(config)
    ? /\[remote "origin"\][^[]*?^\s*url\s*=\s*(.+)$/m.exec(
        readFileSync(config, "utf8"),
      )?.[1]
    : undefined;
  if (url) {
    const name = url
      .trim()
      .replace(/\/+$/, "")
      .split(/[/:\\]/)
      .pop()
      ?.replace(/\.git$/, "");
    if (name) return name;
  }
  return basename(common) === ".git"
    ? basename(dirname(common))
    : basename(top);
}

/**
 * Puts `<meta name="instrument:repo">` on the line after the page's
 * `instrument:idea` meta. Leaves the page as it is when there is no name or
 * the page already says.
 * @param {string} html
 * @param {string | undefined} name
 */
export function tagRepo(html, name) {
  if (!name || html.includes('name="instrument:repo"')) return html;
  const value = name
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  return html.replace(
    /^([ \t]*)(<meta name="instrument:idea"[^>]*>)/m,
    (_, indent, idea) =>
      `${indent}${idea}\n${indent}<meta name="instrument:repo" content="${value}" />`,
  );
}
