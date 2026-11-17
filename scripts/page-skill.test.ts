import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
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
import { check } from "../skills/wireframe/check.mjs";
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
// prompt in that app's name, so nothing either page skill ships may start a
// process. Nothing may send anything over the network either, except the
// share scripts: some hosts cannot load the page's Share button or reach the
// share endpoint from it, so publishing goes through share.mjs, share.py or the
// curl recipe in references/sharing.md.
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

const SHARE = /(^|\/)(share\.(mjs|py)|references\/sharing\.md)$/;

describe("instrument-page and wireframe launch nothing and send only through share", () => {
  const files = ["instrument-page", "wireframe"].flatMap((skill) =>
    filesUnder(join(SKILLS, skill)),
  );

  it("finds the files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((file) => [relative(SKILLS, file), file]))(
    "%s",
    (_name, file) => {
      const text = readFileSync(file, "utf-8");
      const rules = SHARE.test(file)
        ? FORBIDDEN.filter(([, what]) => what !== "a network write")
        : FORBIDDEN;
      const found = rules
        .filter(([re]) => re.test(text))
        .map(([re, what]) => `${what}: ${text.match(re)?.[0]}`);
      expect(found).toEqual([]);
    },
  );
});

// The wireframe skill installs on its own, so it carries copies of
// instrument-page's share scripts rather than a path into another skill. A fix
// has to land in both.
describe("wireframe's copies", () => {
  it.each(["share.mjs", "share.py"])("%s matches instrument-page's", (file) => {
    expect(readFileSync(join(SKILLS, "wireframe", file), "utf-8")).toBe(
      readFileSync(join(SKILLS, "instrument-page", file), "utf-8"),
    );
  });
});

describe("page.mjs", () => {
  const PAGE = join(SKILLS, "instrument-page", "page.mjs");
  const run = promisify(execFile);
  const page = (
    body: string,
    attrs = 'data-layout="column" data-feel="minimal"',
  ) => `<!doctype html>
<!-- direction: reader="parents" point="the late bus costs less" layout=column feel=minimal hero="two bars" -->
<html lang="en" ${attrs}>
<head><title>The late bus costs less</title><meta name="description" content="The 4:10 bus is $12 cheaper per child than the 3:30 bus."></head>
<body>${body}</body></html>`;
  const check = async (
    body: string,
    inputs = "The quote says $48 and $36.",
    attrs?: string,
  ) => {
    const dir = mkdtempSync(join(tmpdir(), "page-mjs-"));
    writeFileSync(join(dir, "page.html"), page(body, attrs));
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
      `"page.html: pass, as far as the file shows. It is 71 KB. Layout is not checked yet: run lib/probe.js on it in a browser (SKILL.md, step 5)."`,
    );
    expect(existsSync(join(SKILLS, "instrument-page", "lib", "probe.js"))).toBe(
      true,
    );
  });

  it("reads the reading rules from the file", async () => {
    const long = Array.from({ length: 64 }, () => "bus").join(" ");
    const result = await check(
      `<header><p>${long}</p><h1>One two three four five six seven eight nine ten eleven</h1></header>
<section><p>${long}</p><blockquote>&ldquo;We ship on Friday&rdquo; <cite>Maya</cite></blockquote><p>Wed Oct 8, 2026</p></section><footer><p>${long}</p></footer>`,
    );
    expect(result.code).toBe(1);
    expect(result.stdout).toMatchInlineSnapshot(`
      "FAIL weekday: "Wed Oct 8, 2026": Oct 8, 2026 is a Thursday -> compute weekdays with a script, never by hand, and fix every date on the page
      FAIL long-headline: h1 "One two three four five six seven eight nine ten eleven": 11 words -> say the answer in 10 words or fewer; move the rest into the lede or the hero
      FAIL no-hero: the page: nothing is marked class="hero" -> mark the one thing the page is built around with class="hero"; it must show in the first screen
      FAIL long-paragraph: header > p "bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bu": 64 words -> split it, cut it to 60 words or fewer, or turn it into something seen: a list, a table, a labeled drawing
      FAIL long-paragraph: section > p "bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bus bu": 64 words -> split it, cut it to 60 words or fewer, or turn it into something seen: a list, a table, a labeled drawing
      FAIL prose-heavy: the first two screens: prose (blocks of 15+ words) is about 81% of what comes first, counting words, with a drawing as 150 -> bring it under 40%: turn sentences into the hero, a chart, a short list, a table or labels, and move explanation below
      FAIL quote: section > blockquote "“We ship on Friday”": these words are not in any input, word for word -> copy the exact words from the input (an ellipsis may join two exact pieces), or say it as your own summary without quote marks; if it is not a quote at all, use <aside> or <p>, not <blockquote>
      page.html: 7 FAIL. Fix each by fixing what it names, then run again. It is 72 KB."
    `);
  });
  it("fails a key-shaped string at its line in the built file, masked", async () => {
    // Put together at run time, so no key-shaped literal sits in the repo.
    const key =
      "sk" +
      "_live_" +
      createHash("sha256").update("page").digest("hex").slice(0, 32);
    const result = await check(
      `<header><h1>The late bus costs less</h1></header><section class="hero"><svg viewBox="0 0 10 10" width="400" height="200"></svg></section>\n<p>Pay with <code>${key}</code></p>`,
    );
    expect(result.code).toBe(1);
    expect(result.stdout).not.toContain(key);
    const line = result.built.split("\n").findIndex((l) => l.includes(key)) + 1;
    expect(result.stdout.replace(`line ${line} `, "line N "))
      .toMatchInlineSnapshot(`
        "FAIL secret: line N "sk_live_...4797": looks like a Stripe live key, which a shared link would make public -> replace it with a placeholder or masked text such as sk_live_...4797
        page.html: 1 FAIL. Fix each by fixing what it names, then run again. It is 72 KB."
      `);
  });
  it.each([
    ['data-layout="wide" data-feel="dense"', []],
    ['data-shape="sheet" data-feel="warm"', []],
    ['data-shape="card" data-feel="festive"', []],
    ['data-layout="column" data-feel="urgent"', []],
    ['data-feel="minimal"', ["FAIL layout: <html>: no data-layout"]],
    [
      'data-layout="card" data-feel="minimal"',
      ['FAIL layout: <html>: data-layout="card" is not a layout'],
    ],
    [
      'data-layout="column" data-feel="colorful"',
      ['FAIL feel: <html>: data-feel="colorful" is not a feel'],
    ],
  ])("checks the layout and feel on <html>: %s", async (attrs, fails) => {
    const result = await check(
      `<header><h1>The late bus costs less</h1></header><section class="hero"><svg viewBox="0 0 10 10" width="400" height="200"></svg></section>`,
      undefined,
      attrs,
    );
    const lines = result.stdout
      .split("\n")
      .filter((l) => /^FAIL (layout|feel)/.test(l));
    expect(lines.map((l) => l.replace(/ -> .*/, ""))).toEqual(fails);
  });
  it("counts neither the kicker before the hero nor a footer paragraph", async () => {
    const byline = Array.from({ length: 50 }, () => "bus").join(" ");
    const result = await check(
      `<header><hgroup><p>${byline}</p><h1>The late bus costs less</h1></hgroup></header><section class="hero"><svg viewBox="0 0 10 10" width="400" height="200"></svg></section><footer><p>${byline} ${byline}</p></footer>`,
    );
    expect(result.code).toBe(0);
  });
});

describe("page.mjs and code blocks", () => {
  const PAGE = join(SKILLS, "instrument-page", "page.mjs");
  const run = promisify(execFile);
  const build = async (code: string) => {
    const dir = mkdtempSync(join(tmpdir(), "page-code-"));
    writeFileSync(
      join(dir, "page.html"),
      `<!doctype html>
<!-- direction: reader="engineers" point="the client retries once" layout=column feel=minimal hero="the retry" -->
<html lang="en" data-layout="column" data-feel="minimal">
<head><title>The client retries once</title><meta name="description" content="The client retries a request once on a 429, then hands the error to the agent."></head>
<body><header><h1>The client retries once</h1></header><section class="hero">${code}</section></body></html>`,
    );
    writeFileSync(join(dir, "request.md"), "Explain the retry.");
    const result = await run(
      "node",
      [PAGE, "page.html", "--inputs", "request.md"],
      { cwd: dir },
    ).catch((e: { stdout: string; code: number }) => e);
    return {
      stdout: result.stdout.trim().replace(/ It is \d+ KB\..*$/s, ""),
      highlight: readFileSync(join(dir, "page.html"), "utf-8").includes(
        "highlight.min.js",
      ),
    };
  };

  it.each([
    ["<pre>$ pnpm test\n✓ 3 passed</pre>", false],
    ['<pre><code class="language-ts">await retryOnce(run);</code></pre>', true],
  ])("passes %s and loads highlighting: %s", async (code, highlight) => {
    expect(await build(code)).toEqual({
      stdout: "page.html: pass, as far as the file shows.",
      highlight,
    });
  });

  it("fails code that names no language", async () => {
    expect(
      (await build("<pre><code>await retryOnce(run);</code></pre>")).stdout,
    ).toMatchInlineSnapshot(`
      "FAIL code-language: <pre><code> "await retryOnce(run);": code with no language named, so it is not highlighted -> name it: <code class="language-ts"> (ts, js, json, bash, diff, yaml, python, html, css, sql, swift, go, rust, plaintext); for terminal output, drop the <code> and leave a bare <pre>
      page.html: 1 FAIL. Fix each by fixing what it names, then run again."
    `);
  });
});

describe("page.mjs embeds images", () => {
  const PAGE = join(SKILLS, "instrument-page", "page.mjs");
  const run = promisify(execFile);
  // A PNG header is all the check reads: the signature and the IHDR size.
  const png = (width: number, height: number) => {
    const b = Buffer.alloc(33);
    b.write("\x89PNG\r\n\x1a\n", 0, "latin1");
    b.writeUInt32BE(13, 8);
    b.write("IHDR", 12, "latin1");
    b.writeUInt32BE(width, 16);
    b.writeUInt32BE(height, 20);
    return b;
  };
  const build = async (
    body: string,
    beside: Record<string, Buffer | string>,
  ) => {
    const dir = mkdtempSync(join(tmpdir(), "page-embed-"));
    writeFileSync(
      join(dir, "page.html"),
      `<!doctype html>
<!-- direction: reader="parents" point="the red bike fits" layout=column feel=minimal hero="the bike" -->
<html lang="en" data-layout="column" data-feel="minimal">
<head><title>The red bike fits</title><meta name="description" content="The red bike fits a 7 year old."></head>
<body><header><h1>The red bike fits</h1></header><section class="hero">${body}</section></body></html>`,
    );
    writeFileSync(join(dir, "request.md"), "A bike for a 7 year old.");
    for (const [name, bytes] of Object.entries(beside)) {
      mkdirSync(dirname(join(dir, name)), { recursive: true });
      writeFileSync(join(dir, name), bytes);
    }
    const result = await run(
      "node",
      [PAGE, "page.html", "--inputs", "request.md"],
      { cwd: dir },
    ).catch((e: { stdout: string; code: number }) => e);
    return {
      code: "code" in result ? result.code : 0,
      stdout: result.stdout.trim(),
      built: readFileSync(join(dir, "page.html"), "utf-8"),
    };
  };

  it("puts a file named by path, local or served, into the page", async () => {
    const server = createServer((_req, res) => res.end(png(300, 200)));
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const result = await build(
      `<img src="shots/bike.png" width="480" height="320" alt="The red bike"><img src="http://127.0.0.1:${port}/a.png?x=1&amp;y=2" width="300" height="200" alt="The blue bike"><div style="background:url('shots/bike.png')"></div>`,
      { "shots/bike.png": png(480, 320) },
    ).finally(() => server.close());
    expect(result.stdout.replace(/:\d+\//, ":PORT/")).toMatchInlineSnapshot(`
      "embedded shots/bike.png: PNG 480x320, 1 KB in the page
      embedded http://127.0.0.1:PORT/a.png?x=1&amp;y=2: PNG 300x200, 1 KB in the page
      page.html: pass, as far as the file shows. It is 72 KB. Layout is not checked yet: run lib/probe.js on it in a browser (SKILL.md, step 5)."
    `);
    expect(result.built).not.toContain("shots/bike.png");
    expect(result.built).not.toContain("127.0.0.1");
    expect(result.built.match(/data:image\/png;base64,/g)).toHaveLength(3);
  });

  it("leaves what it cannot embed and says why", async () => {
    const result = await build(
      `<img src="big.png" width="480" height="320" alt="a"><img src="gone.png" width="10" height="10" alt="b"><img src="note.png" width="10" height="10" alt="c">`,
      {
        "big.png": Buffer.concat([png(2400, 1600), Buffer.alloc(600 * 1024)]),
        "note.png": "my api key",
      },
    );
    expect(result.code).toBe(1);
    expect(result.built).toContain('src="big.png"');
    expect(result.stdout).toMatchInlineSnapshot(`
      "FAIL image-oversize: <img> "big.png": 600 KB (PNG 2400x1600), over 500 KB -> save it again beside the page as JPEG quality 78 (a screenshot may stay PNG if that is smaller), at most 1600 pixels on the long edge for a screenshot and 720 for a photo, and name that file (references/images.md)
      FAIL image-missing: <img> "gone.png": no file at gone.png -> name a file that exists, relative to the page, or draw a stand-in as inline SVG
      FAIL image-not-image: <img> "note.png": these bytes are not a PNG, JPEG, GIF, WebP, AVIF or SVG -> name the image itself, not a page that shows it
      page.html: 3 FAIL. Fix each by fixing what it names, then run again. It is 72 KB."
    `);
  });

  it("embeds a picture past 1600 pixels and says to resize it", async () => {
    const result = await build(
      `<img src="wide.png" width="800" height="533" alt="A wide screenshot">`,
      { "wide.png": png(2400, 1600) },
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "embedded wide.png: PNG 2400x1600, 1 KB in the page; more than the 1600 pixels on the long edge anyone sees, so resize it to save the reader the bytes (references/images.md)",
    );
  });

  it("puts a font file named in url() into the page and fails a local()-only face", async () => {
    const woff2 = Buffer.concat([Buffer.from("wOF2"), Buffer.alloc(2000)]);
    const result = await build(
      `<style>@font-face{font-family:"Brand";src:local("Brand"),url("fonts/brand.woff2") format("woff2")}@font-face{font-family:"Trial Face";src:local("Trial Face Regular")}@font-face{font-family:"Gone";src:url("fonts/gone.otf")}</style><p style="font-family:Brand">The red bike fits.</p>`,
      { "fonts/brand.woff2": woff2 },
    );
    expect(result.code).toBe(1);
    expect(result.built).toContain('url("data:font/woff2;base64,');
    expect(result.built).not.toContain("fonts/brand.woff2");
    expect(result.stdout).toMatchInlineSnapshot(`
      "embedded fonts/brand.woff2: WOFF2 font, 3 KB in the page
      FAIL font-missing: CSS url() "fonts/gone.otf": no file at fonts/gone.otf -> name the font file itself (an installed font is in the system's font folders, references/loading.md), or use a Google Font
      FAIL font-local: @font-face "Trial Face": names only local() fonts, which readers who lack them never see -> add url() naming the font file beside local() and page.mjs embeds it (references/loading.md, A font of its own), or use a Google Font
      page.html: 2 FAIL. Fix each by fixing what it names, then run again. It is 74 KB."
    `);
  });

  const mp4 = Buffer.concat([
    Buffer.from([0, 0, 0, 0x18]),
    Buffer.from("ftypisom"),
    Buffer.alloc(2000),
  ]);

  it("puts a video named by path into the page, and fails one with no poster or controls", async () => {
    const result = await build(
      `<figure><video controls poster="poster.png" src="walk.mp4"></video><figcaption>The walk.</figcaption></figure><video id="bare" src="walk.mp4"></video><video autoplay muted loop playsinline poster="poster.png" src="walk.mp4"></video><audio controls src="note.txt"></audio>`,
      {
        "walk.mp4": mp4,
        "poster.png": png(960, 600),
        "note.txt": "not a clip",
      },
    );
    expect(result.code).toBe(1);
    expect(result.built).toContain('src="data:video/mp4;base64,');
    expect(result.built).not.toContain('src="walk.mp4"');
    expect(result.stdout).toMatchInlineSnapshot(`
      "embedded poster.png: PNG 960x600, 1 KB in the page
      embedded walk.mp4: MP4, 3 KB in the page
      FAIL media-not-media: <audio> "note.txt": these bytes are not an MP4, WebM, QuickTime, M4A, MP3, Ogg or WAV clip -> name the clip itself, not a page that plays it
      FAIL video-poster: <video> bare: has no poster, so it shows a blank or black first frame until played -> save a frame that shows what the clip is about (ffmpeg -ss 2 -i clip.mp4 -frames:v 1 poster.jpg) and name it in poster=
      FAIL video-controls: <video> bare: has no controls, so the reader cannot play, pause or scrub it -> add controls (a short silent loop may instead be autoplay muted loop playsinline); never build a player of your own
      page.html: 3 FAIL. Fix each by fixing what it names, then run again. It is 80 KB."
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

describe("wireframe's check.mjs", () => {
  const run = promisify(execFile);
  const fresh = async (...args: string[]) => {
    const out = join(mkdtempSync(join(tmpdir(), "wf-check-")), "page.html");
    await run("node", [
      join(SKILLS, "wireframe", "new.mjs"),
      out,
      "Check",
      ...args,
    ]);
    return readFileSync(out, "utf-8");
  };
  // Code put just above the render line, where a page's own frames end.
  const plant = (page: string, code: string) =>
    page.replace(
      "        // ---- render",
      () => `        ${code}\n        // ---- render`,
    );
  const said = (page: string) => {
    const r = check(page);
    return r.fails.length
      ? r.fails.map((f) => f.replace(/\d+/g, "N"))
      : r.skip || `ok ${r.checked}/${r.total}`;
  };

  it.each<[string, string, string | string[]]>([
    ["a fresh page", "", "ok 1/1"],
    [
      "a page declaring its own frame size",
      "const W = 1280, H = 300;",
      "ok 1/1",
    ],
    [
      "a name declared twice",
      "const win = 1;",
      ["SyntaxError: Identifier 'win' has already been declared (line N)"],
    ],
    [
      "a template left open",
      "const x = `<div>;",
      ["SyntaxError: Unexpected identifier 'stage' (line N)"],
    ],
    [
      "a helper nothing defines",
      'states.push({ title: "x", body: button("Go") });',
      [
        "ReferenceError while drawing the frames: button is not defined (line N)",
      ],
    ],
    [
      "a frame that draws a missing value",
      'states.push({ title: "x", body: `<p>${({}).label}</p>` });',
      ['frame N ("x") draws the text "undefined"'],
    ],
    [
      "a frame with no body",
      'states.push({ title: "x" });',
      ['frame N ("x") has no body'],
    ],
    [
      "a callout on an empty box placed over the drawing",
      'states.push({ title: "x", body: `<div class="absolute" style="left:9px;top:9px">${noted(`<div class="h-8"></div>`, "a claim")}</div>` });',
      [
        'frame N ("x") puts the callout "a claim" on an element that draws nothing: mark something the frame draws, or put the words in the frame\'s note',
      ],
    ],
    [
      "a callout on text, an icon or a painted bar",
      'states.push({ title: "x", body: noted("<p>Go</p>", "a") + noted(`<i class="ph ph-x"></i>`, "b") + noted(`<div class="h-2 bg-muted"></div>`, "c") + noted(`<span style="background:#000"></span>`, "d") });',
      "ok 2/2",
    ],
    [
      "frames that reach for the page",
      "const wide = window.innerWidth;",
      "its frames use `window`, which needs a browser",
    ],
  ])("%s", async (_name, code, expected) => {
    expect(said(plant(await fresh(), code))).toEqual(expected);
  });

  it("a fresh prototype", async () => {
    expect(said(await fresh("--prototype"))).toBe("ok 1/1");
  });

  it("names the page's own line", async () => {
    const page = plant(await fresh(), "const win = 1;");
    const line =
      page.split("\n").findIndex((l) => l.includes("const win = 1;")) + 1;
    expect(check(page).fails[0]).toContain(`(line ${line})`);
  });
});
