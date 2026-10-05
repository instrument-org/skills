import { type PathLike, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findChrome } from "../skills/create-page/lib/chrome.mjs";

const SKILLS = join(import.meta.dirname, "../skills");

describe("findChrome", () => {
  const at =
    (...paths: string[]) =>
    (p: PathLike) =>
      paths.includes(String(p));

  it.each<
    [
      string,
      {
        env: NodeJS.ProcessEnv;
        platform: NodeJS.Platform;
        exists: (p: PathLike) => boolean;
      },
      { bin: string },
    ]
  >([
    [
      "an override that exists wins",
      {
        env: { CHROME: "/opt/x/chrome" },
        platform: "darwin",
        exists: at("/opt/x/chrome"),
      },
      { bin: "/opt/x/chrome" },
    ],
    [
      "macOS finds Chrome in the user's own Applications",
      {
        env: {},
        platform: "darwin",
        exists: at(
          "/Users/a/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ),
      },
      {
        bin: "/Users/a/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
    ],
    [
      "macOS falls back to Edge",
      {
        env: {},
        platform: "darwin",
        exists: at(
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ),
      },
      { bin: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" },
    ],
    [
      "Windows finds a per-user Chrome under LOCALAPPDATA",
      {
        env: {
          LOCALAPPDATA: "C:\\Users\\a\\AppData\\Local",
          PROGRAMFILES: "C:\\Program Files",
        },
        platform: "win32",
        exists: at(
          "C:\\Users\\a\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        ),
      },
      {
        bin: "C:\\Users\\a\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
      },
    ],
    [
      "Windows falls back to Edge",
      {
        env: { "PROGRAMFILES(X86)": "C:\\Program Files (x86)" },
        platform: "win32",
        exists: at(
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ),
      },
      {
        bin: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      },
    ],
    [
      "Linux finds Chromium on the PATH",
      {
        env: { PATH: "/usr/local/bin:/usr/bin" },
        platform: "linux",
        exists: at("/usr/bin/chromium"),
      },
      { bin: "/usr/bin/chromium" },
    ],
  ])("%s", (_name, options, expected) => {
    expect(findChrome({ home: "/Users/a", ...options })).toEqual(expected);
  });

  // A wrong override is the error, rather than a quiet fall back to whatever
  // else is installed, so a pinned browser never silently changes.
  it("fails loudly on an override that does not exist", () => {
    expect(
      findChrome({
        env: { CHROME: "/nope/chrome" },
        platform: "darwin",
        home: "/Users/a",
        exists: at(
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ),
      }),
    ).toEqual({ error: "CHROME is set to /nope/chrome, which does not exist" });
  });

  it("says where it looked when nothing is installed", () => {
    expect(
      findChrome({
        env: { PATH: "/usr/bin" },
        platform: "linux",
        home: "/h",
        exists: () => false,
      }).error,
    ).toMatchInlineSnapshot(
      `"no Chrome, Chromium or Edge found (looked in 8 places, such as /usr/bin/google-chrome and /usr/bin/google-chrome-stable); set CHROME=/path/to/chrome"`,
    );
  });
});

// The wireframe skill installs on its own, so it carries copies of
// create-page's share scripts and Chrome driver rather than a path into
// another skill. A fix has to land in both.
describe("wireframe's copies", () => {
  it.each(["share.mjs", "share.py"])("%s matches create-page's", (file) => {
    expect(readFileSync(join(SKILLS, "wireframe", file), "utf-8")).toBe(
      readFileSync(join(SKILLS, "create-page", file), "utf-8"),
    );
  });

  it("chrome.mjs matches create-page's", () => {
    expect(readFileSync(join(SKILLS, "wireframe", "chrome.mjs"), "utf-8")).toBe(
      readFileSync(join(SKILLS, "create-page", "lib", "chrome.mjs"), "utf-8"),
    );
  });
});
