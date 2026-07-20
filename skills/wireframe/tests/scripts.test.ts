import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createWireframe } from "../scripts/create-wireframe.ts";
import { buildHtml } from "../scripts/lib/template.ts";

// cspell:ignore Résumé

const BUNDLE = "node_modules/@tailwindcss/browser/dist/index.global.js";

/** The `src` the scaffold wrote, resolved against the wireframe's own folder. */
function resolvedScriptTarget(html: string, outputDir: string) {
  const src = html.match(/src="([^"]+)"/)?.[1] ?? "";
  return { resolved: path.resolve(outputDir, src), src };
}

let tmpDir: string;

afterEach(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

async function makeTmpDir() {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wireframe-test-"));
  return tmpDir;
}

describe("buildHtml", () => {
  it("produces valid HTML structure", () => {
    const html = buildHtml({ outputDir: "/task/output" });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>Wireframe</title>");
    expect(html).toContain('<style type="text/tailwindcss">');
    expect(html).toContain('@import "tailwindcss"');
    expect(html).toContain(BUNDLE);
    expect(html).toContain("<main");
    expect(html).toContain("</html>");
  });

  it("contains a bare tailwindcss import and empty @theme block", () => {
    const html = buildHtml({ outputDir: "/task/output" });

    expect(html).toContain('@import "tailwindcss"');
    expect(html).toContain("@theme {");
  });

  it("does not inline the tailwind script", () => {
    const html = buildHtml({ outputDir: "/task/output" });

    expect(html.length).toBeLessThan(5_000);
    expect(html).not.toContain("function tailwind");
  });

  it("includes custom body, theme declarations, and an escaped title", () => {
    const html = buildHtml({
      body: '<main class="bg-brand-500">Résumé costs $40</main>',
      outputDir: "/task/output",
      theme: "--color-brand-500: oklch(0.62 0.17 255);",
      title: "Plans & pricing",
    });

    expect(html).toContain("Résumé costs $40");
    expect(html).toContain("--color-brand-500: oklch(0.62 0.17 255);");
    expect(html).toContain("<title>Plans &amp; pricing</title>");
  });
});

describe("createWireframe", () => {
  it("points the script at the installed bundle", async () => {
    const dir = await makeTmpDir();
    const outputPath = path.join(dir, "out.html");

    const result = await createWireframe({ outputPath });

    expect(result.outputPath).toBe(outputPath);

    const content = await fs.readFile(outputPath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("<title>Wireframe</title>");
    expect(content).toContain('@import "tailwindcss"');
    expect(content.length).toBeLessThan(5_000);

    // The reference must reach a file that is actually there; asserting a
    // literal URL is what let a dead path ship unnoticed.
    const { resolved } = resolvedScriptTarget(content, dir);
    expect(resolved.endsWith(path.normalize(BUNDLE))).toBe(true);
    await expect(fs.stat(resolved)).resolves.toBeTruthy();
  });

  it("adapts the relative script path to the output depth", async () => {
    const dir = await makeTmpDir();
    const shallowOutput = path.join(dir, "out.html");
    const deepOutput = path.join(dir, "nested", "deep", "out.html");

    await createWireframe({ outputPath: shallowOutput });
    await createWireframe({ outputPath: deepOutput });

    const shallow = resolvedScriptTarget(
      await fs.readFile(shallowOutput, "utf-8"),
      path.dirname(shallowOutput),
    );
    const deep = resolvedScriptTarget(
      await fs.readFile(deepOutput, "utf-8"),
      path.dirname(deepOutput),
    );

    // Relative, so the deeper page needs a longer prefix...
    expect(shallow.src.startsWith("/")).toBe(false);
    expect(deep.src).not.toBe(shallow.src);
    // ...and both still land on the same real file.
    expect(deep.resolved).toBe(shallow.resolved);
    await expect(fs.stat(shallow.resolved)).resolves.toBeTruthy();
  });

  it("creates intermediate directories", async () => {
    const dir = await makeTmpDir();
    const outputPath = path.join(dir, "nested", "deep", "wireframe.html");

    await createWireframe({ outputPath });

    const stat = await fs.stat(outputPath);
    expect(stat.isFile()).toBe(true);
  });

  it("reads multiline body and theme content from files", async () => {
    const dir = await makeTmpDir();
    const bodyFile = path.join(dir, "body.html");
    const themeFile = path.join(dir, "theme.css");
    const outputPath = path.join(dir, "out.html");
    await fs.writeFile(
      bodyFile,
      '<main>\n  <p>Résumé costs $40</p>\n  <p data-copy="quoted">Done</p>\n</main>',
    );
    await fs.writeFile(themeFile, "--color-brand-500: oklch(0.62 0.17 255);\n");

    await createWireframe({
      bodyFile,
      outputPath,
      themeFile,
      title: "Account & billing",
    });

    const content = await fs.readFile(outputPath, "utf-8");
    expect(content).toContain("Résumé costs $40");
    expect(content).toContain('data-copy="quoted"');
    expect(content).toContain("--color-brand-500: oklch(0.62 0.17 255);");
    expect(content).toContain("<title>Account &amp; billing</title>");
  });

  it.each([
    { body: "<main />", bodyFile: "body.html" },
    { theme: "--color-a: red;", themeFile: "theme.css" },
  ])("rejects conflicting inline and file inputs", async (options) => {
    const dir = await makeTmpDir();

    await expect(
      createWireframe({
        ...options,
        outputPath: path.join(dir, "out.html"),
      }),
    ).rejects.toThrow(/either/);
  });
});
