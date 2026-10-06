import { execFile } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { repoName, tagRepo } from "../skills/wireframe/repo.mjs";

const SKILLS = join(import.meta.dirname, "../skills");

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(join(dir, entry.name))
      : [join(dir, entry.name)],
  );

// A skill runs inside the user's app. Starting a process from there (the
// user's own browser above all) can raise an operating system permission
// prompt in that app's name, and publishing a page is the reader's to do with
// the page's own Share button. So nothing either page skill ships may start a
// process or send anything over the network, in code or in a recipe.
const FORBIDDEN: [RegExp, string][] = [
  [/\bchild_process\b/, "child_process"],
  [
    /(?<![.\w])(spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\s*\(/,
    "a process call",
  ],
  [/\bsubprocess\b/, "subprocess"],
  [/\bos\.(system|popen|exec\w*|spawn\w*)\b/, "a Python process call"],
  [/\bDeno\.Command\b|\bBun\.spawn\b/, "a process call"],
  [/\bmethod\s*[:=]\s*["'`]?(POST|PUT|PATCH|DELETE)\b/i, "a network write"],
  [/\bsendBeacon\b|\bXMLHttpRequest\b|\bnew\s+WebSocket\b/, "a network write"],
  [/\brequests\.(post|put|patch|delete)\b/, "a network write"],
  [/\burlopen\([^)]*\bdata\s*=/, "a network write"],
  [
    /\bcurl\b[^\n]*(\s-X\s*(POST|PUT|PATCH|DELETE)|\s--data|\s-d\s)/,
    "a network write",
  ],
];

describe("create-page and wireframe launch nothing and send nothing", () => {
  const files = ["create-page", "wireframe"].flatMap((skill) =>
    filesUnder(join(SKILLS, skill)),
  );

  it("finds the files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((file) => [relative(SKILLS, file), file]))(
    "%s",
    (_name, file) => {
      const text = readFileSync(file, "utf-8");
      const found = FORBIDDEN.filter(([re]) => re.test(text)).map(
        ([re, what]) => `${what}: ${text.match(re)?.[0]}`,
      );
      expect(found).toEqual([]);
    },
  );
});

describe("page.mjs", () => {
  const PAGE = join(SKILLS, "create-page", "page.mjs");
  const run = promisify(execFile);
  const page = (body: string) => `<!doctype html>
<!-- direction: reader="parents" point="the late bus costs less" shape=read feel=calm hero="two bars" -->
<html lang="en" data-shape="read" data-feel="calm">
<head><title>The late bus costs less</title><meta name="description" content="The 4:10 bus is $12 cheaper per child than the 3:30 bus."></head>
<body>${body}</body></html>`;
  const check = async (
    body: string,
    inputs = "The quote says $48 and $36.",
  ) => {
    const dir = mkdtempSync(join(tmpdir(), "page-mjs-"));
    writeFileSync(join(dir, "page.html"), page(body));
    writeFileSync(join(dir, "request.md"), inputs);
    const result = await run(
      "node",
      [PAGE, "page.html", "--inputs", "request.md"],
      { cwd: dir },
    ).catch((e: { stdout: string; code: number }) => e);
    return {
      code: "code" in result ? result.code : 0,
      stdout: result.stdout.trim(),
      files: readdirSync(dir).sort(),
      built: readFileSync(join(dir, "page.html"), "utf-8"),
    };
  };

  it("builds a page in place and writes nothing beside it", async () => {
    const result = await check(
      `<header><h1>The late bus costs less</h1></header><section class="hero"><svg viewBox="0 0 10 10" width="400" height="200"></svg></section>`,
    );
    expect(result.code).toBe(0);
    expect(result.files).toEqual(["page.html", "request.md"]);
    expect(result.built).toContain("<!-- foundation:start");
    expect(result.built).toContain("__instrumentSnap(document.currentScript)");
    expect(result.stdout).toMatchInlineSnapshot(
      `"page.html: pass, as far as the file shows. Layout is not checked yet: run lib/probe.js on it in a browser (SKILL.md, step 5)."`,
    );
    expect(existsSync(join(SKILLS, "create-page", "lib", "probe.js"))).toBe(
      true,
    );
  });

  it("reads the reading rules from the file", async () => {
    const long = Array.from({ length: 64 }, () => "bus").join(" ");
    const result = await check(
      `<header><p>${long}</p><h1>One two three four five six seven eight nine ten eleven</h1></header>
<section><p>${long}</p><blockquote>&ldquo;We ship on Friday&rdquo; <cite>Maya</cite></blockquote><p>Wed Oct 8, 2026</p></section>`,
    );
    expect(result.code).toBe(1);
    expect(result.stdout).toMatchInlineSnapshot(`
      "FAIL weekday: "Wed Oct 8, 2026": Oct 8, 2026 is a Thursday -> compute weekdays with a script, never by hand, and fix every date on the page
      FAIL long-headline: h1 "One two three four five six seven eight nine ten eleven": 11 words -> say the answer in 10 words or fewer; move the rest into the lede or the hero
      FAIL no-hero: the page: nothing is marked class="hero" -> mark the one thing the page is built around with class="hero"; it must show in the first screen
      FAIL long-paragraph: header > p "bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bu": 64 words -> split it, cut it to 60 words or fewer, or turn it into something seen: a list, a table, a labeled drawing
      FAIL long-paragraph: section > p "bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bu": 64 words -> split it, cut it to 60 words or fewer, or turn it into something seen: a list, a table, a labeled drawing
      FAIL prose-heavy: the first two screens: prose (blocks of 15+ words) is about 81% of what comes first, counting words, with a drawing as 150 -> bring it under 40%: turn sentences into the hero, a chart, a short list, a table or labels, and move explanation below or into one <details>
      FAIL quote: section > blockquote "“We ship on Friday”": these words are not in any input, word for word -> copy the exact words from the input (an ellipsis may join two exact pieces), or say it as your own summary without quote marks; if it is not a quote at all, use <aside> or <p>, not <blockquote>
      page.html: 7 FAIL. Fix each by fixing what it names, then run again."
    `);
  });
});

describe("wireframe's repo meta", () => {
  const tree = (files: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), "repo-meta-"));
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), body);
    }
    return root;
  };
  const origin = (url: string) =>
    `[core]\n\tbare = false\n[remote "origin"]\n\turl = ${url}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`;

  it.each<[string, Record<string, string>, string, string | undefined]>([
    ["no repository", { "a/b.txt": "" }, "a", undefined],
    [
      "an https remote, from a subfolder",
      {
        "app/.git/config": origin("https://github.com/acme/widget.git"),
        "app/src/x": "",
      },
      "app/src",
      "widget",
    ],
    [
      "an ssh remote",
      { "app/.git/config": origin("git@github.com:acme/widget.git") },
      "app",
      "widget",
    ],
    [
      "no remote: the checkout's folder",
      { "my-app/.git/config": "[core]\n" },
      "my-app",
      "my-app",
    ],
    [
      "a worktree reads the main checkout's remote",
      {
        "main/.git/config": origin("https://github.com/acme/widget"),
        "main/.git/worktrees/feature/commondir": "../..",
        "feature-x/.git": "gitdir: ../main/.git/worktrees/feature\n",
      },
      "feature-x",
      "widget",
    ],
    [
      "a worktree with no remote: the main checkout's folder",
      {
        "main/.git/config": "[core]\n",
        "main/.git/worktrees/feature/commondir": "../..",
        "feature-x/.git": "gitdir: ../main/.git/worktrees/feature\n",
      },
      "feature-x",
      "main",
    ],
    [
      "a submodule reads its own remote",
      {
        "app/.git/config": origin("https://github.com/acme/widget.git"),
        "app/.git/modules/lib/config": origin(
          "https://github.com/acme/parts.git",
        ),
        "app/lib/.git": "gitdir: ../.git/modules/lib\n",
      },
      "app/lib",
      "parts",
    ],
  ])("%s", (_, files, from, expected) => {
    expect(repoName(join(tree(files), from))).toBe(expected);
  });

  it("puts the meta after instrument:idea, once", () => {
    const page = `<head>\n    <meta name="instrument:idea" content="wireframe@1" />\n  </head>`;
    const tagged = tagRepo(page, 'a"b');
    expect(tagged).toMatchInlineSnapshot(`
      "<head>
          <meta name="instrument:idea" content="wireframe@1" />
          <meta name="instrument:repo" content="a&quot;b" />
        </head>"
    `);
    expect(tagRepo(tagged, "other")).toBe(tagged);
    expect(tagRepo(page, undefined)).toBe(page);
  });
});
