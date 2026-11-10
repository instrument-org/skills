import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { findChrome } from "../tools/page-check/chrome.mjs";

// The wireframe viewer's promises, driven in Chromium over fixture pages
// that new.mjs writes. Skipped where no Chromium is downloaded, as on CI.
describe.skipIf(!findChrome().bin)("wireframe viewer in Chromium", () => {
  it(
    "keeps every promise on every fixture page",
    { timeout: 240000 },
    async () => {
      const CHECK = join(
        import.meta.dirname,
        "../tools/wireframe-check/check.mjs",
      );
      const result = await promisify(execFile)("node", [CHECK], {
        timeout: 240000,
      }).catch((e: { stdout: string }) => e);
      expect(
        result.stdout.split("\n").filter((l) => l.startsWith("FAIL")),
      ).toEqual([]);
    },
  );
});
