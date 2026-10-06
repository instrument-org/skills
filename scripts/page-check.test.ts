import { execFile } from "node:child_process";
import { mkdtempSync, type PathLike, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { findChrome } from "../tools/page-check/chrome.mjs";

// A fake disk holding exactly these files, for findChrome's exists and read.
function disk(...files: string[]) {
  const dirs = new Set(
    files.flatMap((f) =>
      f
        .split("/")
        .slice(1, -1)
        .map((_, i, parts) => "/" + parts.slice(0, i + 1).join("/")),
    ),
  );
  const exists = (p: PathLike) =>
    dirs.has(String(p)) || files.includes(String(p));
  const read = (dir: string) => {
    const names = new Set(
      [...dirs, ...files]
        .filter((p) => p.startsWith(dir + "/"))
        .map((p) => p.slice(dir.length + 1).split("/")[0] ?? ""),
    );
    return [...names].map((name) => ({
      name,
      isDirectory: () => dirs.has(`${dir}/${name}`),
    }));
  };
  return { exists, read };
}

describe("findChrome", () => {
  it.each<[string, NodeJS.ProcessEnv, string[], { bin: string }]>([
    [
      "an override that exists wins",
      { PAGE_CHECK_CHROME: "/opt/x/chrome" },
      ["/opt/x/chrome"],
      { bin: "/opt/x/chrome" },
    ],
    [
      "the newest headless shell in Playwright's cache comes first",
      {},
      [
        "/Users/a/Library/Caches/ms-playwright/chromium_headless_shell-1190/chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "/Users/a/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "/Users/a/Library/Caches/ms-playwright/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      ],
      {
        bin: "/Users/a/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell",
      },
    ],
    [
      "agent-browser's download is found",
      {},
      [
        "/Users/a/.agent-browser/browsers/chrome-140/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      ],
      {
        bin: "/Users/a/.agent-browser/browsers/chrome-140/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      },
    ],
  ])("%s", (_name, env, files, expected) => {
    expect(
      findChrome({
        env,
        platform: "darwin",
        home: "/Users/a",
        ...disk(...files),
      }),
    ).toEqual(expected);
  });

  // The user's own browser is never launched, even when it is all there is.
  it("never falls back to an installed browser", () => {
    expect(
      findChrome({
        env: {},
        platform: "darwin",
        home: "/Users/a",
        ...disk(
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Users/a/Applications/Chromium.app/Contents/MacOS/Chromium",
        ),
      }).error,
    ).toMatchInlineSnapshot(
      `"no downloaded Chromium found in /Users/a/.agent-browser/browsers, /Users/a/Library/Caches/ms-playwright, /Users/a/.cache/puppeteer. Set PAGE_CHECK_CHROME=/path/to/chromium, or download one with \`npx playwright install chromium-headless-shell\`. A browser installed in Applications is never used."`,
    );
  });

  it("fails loudly on an override that does not exist", () => {
    expect(
      findChrome({
        env: { PAGE_CHECK_CHROME: "/nope/chrome" },
        platform: "linux",
        home: "/h",
        ...disk("/h/.cache/ms-playwright/chromium-1200/chrome-linux/chrome"),
      }),
    ).toEqual({
      error: "PAGE_CHECK_CHROME is set to /nope/chrome, which does not exist",
    });
  });
});

// The skill's in-page probe, run through the dev tool in a downloaded
// Chromium. Skipped where none is downloaded, as on CI.
const browser = findChrome();
describe.skipIf(!browser.bin)("lib/probe.js in Chromium", () => {
  const CHECK = join(import.meta.dirname, "../tools/page-check/check.mjs");
  const page = (extra: string) => `<!doctype html>
<!-- direction: reader="parents" point="the late bus costs less" shape=read feel=calm hero="two bars" -->
<html lang="en" data-shape="read" data-feel="calm">
<head><title>The late bus costs less</title><meta name="description" content="The 4:10 bus is $12 cheaper per child than the 3:30 bus."></head>
<body><header><hgroup><p>For class parents</p><h1>The late bus costs less</h1></hgroup></header>
<section class="hero"><svg viewBox="0 0 400 120" width="400" height="120" role="img" aria-label="Two bars"><rect x="0" y="10" width="300" height="40" data-c="1"></rect><rect x="0" y="70" width="220" height="40" data-c="2"></rect></svg></section>
${extra}
<footer><p>Made from the October quote.</p></footer></body></html>`;
  const probe = async (html: string) => {
    const dir = mkdtempSync(join(tmpdir(), "page-check-"));
    writeFileSync(join(dir, "page.html"), html);
    const result = await promisify(execFile)(
      "node",
      [CHECK, "page.html", "--out", join(dir, "shots")],
      { cwd: dir, timeout: 120000 },
    ).catch((e: { stdout: string }) => e);
    return result.stdout
      .split("\n")
      .filter((l) => /^ {2}(FAIL|NOTE|pass|\d+ FAIL)/.test(l))
      .map((l) => l.trim().replace(/ -> .*/, ""));
  };

  it("passes a clean page", { timeout: 120000 }, async () => {
    expect(await probe(page(""))).toEqual(["pass"]);
  });

  it("reports a planted overlap", { timeout: 120000 }, async () => {
    expect(
      await probe(
        page(
          `<section><div style="position:relative;height:60px"><p style="position:absolute;left:0;top:0;margin:0">Pickup at the north gate</p><p style="position:absolute;left:20px;top:4px;margin:0">Drop off at the library</p></div></section>`,
        ),
      ),
    ).toMatchInlineSnapshot(`
      [
        "FAIL overlap: section > div > p "Pickup at the north gate": overlaps "Drop off at the library" (section > div > p) by 161x10px at 1280 and 390",
        "1 FAIL. Fix each by fixing what it names, rebuild with page.mjs, reopen the page and run this again.",
      ]
    `);
  });
});
