import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createVisualAnswer } from "../scripts/create-visual-answer.ts";
import {
  buildHtml,
  hljsScriptSrc,
  tailwindScriptSrc,
} from "../scripts/lib/template.ts";

const TAILWIND_BUNDLE =
  "node_modules/@tailwindcss/browser/dist/index.global.js";
const HLJS_BUNDLE = "node_modules/@highlightjs/cdn-assets/highlight.min.js";

const SKILL_DIR = path.resolve(import.meta.dirname, "..");

let tmpDir: string;

afterEach(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

async function makeTmpDir() {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "visual-answer-test-"));
  return tmpDir;
}

describe("buildHtml", () => {
  it("produces a full document with placeholders and the theme", () => {
    const html = buildHtml({ outputDir: "/tmp/task/output" });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("TITLE");
    expect(html).toContain("THESIS");
    expect(html).toContain("@theme static");
    expect(html).toContain("--color-brand-500");
  });

  it("escapes the title and keeps the h1-derived tab title script", () => {
    const html = buildHtml({ outputDir: "/tmp/o", title: `<script>"x"` });
    expect(html).toContain("&lt;script&gt;&quot;x&quot;");
    expect(html).toContain("Visual answer");
  });

  it("references both bundles relative to the output directory", () => {
    const outputDir = path.join(SKILL_DIR, "..", "..", "some-task", "output");
    const html = buildHtml({ outputDir });
    for (const src of [
      tailwindScriptSrc(outputDir),
      hljsScriptSrc(outputDir),
    ]) {
      expect(html).toContain(`"${src}"`);
      expect(src.startsWith("..")).toBe(true);
    }
    expect(path.resolve(outputDir, tailwindScriptSrc(outputDir))).toBe(
      path.join(SKILL_DIR, ...TAILWIND_BUNDLE.split("/")),
    );
    expect(path.resolve(outputDir, hljsScriptSrc(outputDir))).toBe(
      path.join(SKILL_DIR, ...HLJS_BUNDLE.split("/")),
    );
  });

  it("substitutes a provided body inside main", () => {
    const html = buildHtml({
      body: `<section id="a"><h2>Only section</h2></section>`,
      outputDir: "/tmp/o",
    });
    expect(html).toContain("Only section");
    expect(html).not.toContain("THESIS");
  });
});

describe("createVisualAnswer", () => {
  it("writes the file, creating directories", async () => {
    const dir = await makeTmpDir();
    const outputPath = path.join(dir, "output", "answer.html");
    await createVisualAnswer({ outputPath, title: "Test answer" });
    const written = await fs.readFile(outputPath, "utf-8");
    expect(written).toContain("Test answer");
  });

  it("reads the body from a file", async () => {
    const dir = await makeTmpDir();
    const bodyFile = path.join(dir, "body.html");
    await fs.writeFile(bodyFile, "<section><h2>From file</h2></section>");
    const outputPath = path.join(dir, "answer.html");
    await createVisualAnswer({ bodyFile, outputPath });
    const written = await fs.readFile(outputPath, "utf-8");
    expect(written).toContain("From file");
  });

  it("rejects body plus bodyFile", async () => {
    const dir = await makeTmpDir();
    await expect(
      createVisualAnswer({
        body: "x",
        bodyFile: "y",
        outputPath: path.join(dir, "a.html"),
      }),
    ).rejects.toThrow("not both");
  });
});
