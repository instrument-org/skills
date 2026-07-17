import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertHtmlFile, convertHtmlString } from "../scripts/html-to-md.ts";
import { createHtmlToMarkdownCli } from "../scripts/lib/cli.ts";
import { createConverter } from "../scripts/lib/converter.ts";

describe("convertHtmlString", () => {
  it("converts basic HTML to markdown", () => {
    const result = convertHtmlString({ html: "<h1>Hello</h1><p>World</p>" });
    expect(result).toMatchInlineSnapshot(`
      "# Hello

      World"
    `);
  });

  it("converts nested elements", () => {
    const result = convertHtmlString({
      html: "<ul><li>One</li><li>Two</li><li>Three</li></ul>",
    });
    expect(result).toMatchInlineSnapshot(`
      "*   One
      *   Two
      *   Three"
    `);
  });

  it("converts links and emphasis", () => {
    const result = convertHtmlString({
      html: '<p>Visit <a href="https://example.com">Example</a> for <strong>important</strong> info.</p>',
    });
    expect(result).toMatchInlineSnapshot(
      `"Visit [Example](https://example.com) for **important** info."`,
    );
  });

  it("uses setext heading style when configured", () => {
    const result = convertHtmlString({
      headingStyle: "setext",
      html: "<h1>Title</h1><h2>Subtitle</h2>",
    });
    expect(result).toMatchInlineSnapshot(`
      "Title
      =====

      Subtitle
      --------"
    `);
  });

  it("uses indented code block style when configured", () => {
    const result = convertHtmlString({
      codeBlockStyle: "indented",
      html: "<pre><code>const x = 1;</code></pre>",
    });
    expect(result).toMatchInlineSnapshot(`"    const x = 1;"`);
  });

  it("converts strikethrough with GFM enabled", () => {
    const result = convertHtmlString({
      gfm: true,
      html: "<p>This is <del>deleted</del> text</p>",
    });
    expect(result).toMatchInlineSnapshot(`"This is ~deleted~ text"`);
  });

  it("converts tables with GFM enabled", () => {
    const result = convertHtmlString({
      gfm: true,
      html: "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr></tbody></table>",
    });
    expect(result).toMatchInlineSnapshot(`
      "| Name | Age |
      | --- | --- |
      | Alice | 30 |"
    `);
  });

  it("does not convert strikethrough with GFM disabled", () => {
    const result = convertHtmlString({
      gfm: false,
      html: "<p>This is <del>deleted</del> text</p>",
    });
    expect(result).not.toContain("~~");
  });

  it("converts fenced code blocks by default", () => {
    const result = convertHtmlString({
      html: "<pre><code>console.log('hi');</code></pre>",
    });
    expect(result).toMatchInlineSnapshot(`
      "\`\`\`
      console.log('hi');
      \`\`\`"
    `);
  });

  it("converts ATX headings by default", () => {
    const result = convertHtmlString({
      html: "<h1>One</h1><h2>Two</h2><h3>Three</h3>",
    });
    expect(result).toMatchInlineSnapshot(`
      "# One

      ## Two

      ### Three"
    `);
  });
});

describe("createConverter", () => {
  it("supports source-specific rules and removals", () => {
    const converter = createConverter();
    converter.remove(["nav", "script"]);
    converter.addRule("callout", {
      filter: (node) =>
        node.nodeName === "ASIDE" && node.getAttribute("data-kind") === "note",
      replacement: (content) => `\n\n> **Note:** ${content.trim()}\n\n`,
    });

    const result = converter.turndown(
      '<nav>Discard me</nav><h1>Keep me</h1><aside data-kind="note">Check this</aside><script>alert(1)</script>',
    );

    expect(result).toMatchInlineSnapshot(`
      "# Keep me

      > **Note:** Check this"
    `);
  });

  it("can preserve selected elements as HTML", () => {
    const converter = createConverter({ gfm: false });
    converter.keep(["details"]);

    expect(
      converter.turndown(
        "<details><summary>More</summary><p>Hidden copy</p></details>",
      ),
    ).toMatchInlineSnapshot(
      `"<details><summary>More</summary><p>Hidden copy</p></details>"`,
    );
  });
});

describe("convertHtmlFile", () => {
  it("reads an HTML file and returns markdown", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-input.html");
    await fs.writeFile(tmpInput, "<h1>File Test</h1><p>Content here.</p>");

    const result = await convertHtmlFile({ inputPath: tmpInput });

    expect(result.markdown).toMatchInlineSnapshot(`
      "# File Test

      Content here."
    `);
    expect(result.outputPath).toBeUndefined();
  });

  it("writes markdown to output file when specified", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-write-input.html");
    const tmpOutput = path.join(os.tmpdir(), "test-convert-write-output.md");
    await fs.writeFile(tmpInput, "<h2>Output Test</h2><p>Written.</p>");

    const result = await convertHtmlFile({
      inputPath: tmpInput,
      outputPath: tmpOutput,
    });

    expect(result.outputPath).toBe(tmpOutput);
    const written = await fs.readFile(tmpOutput, "utf-8");
    expect(written).toBe(result.markdown);
  });

  it("respects GFM option for file conversion", async () => {
    const tmpInput = path.join(os.tmpdir(), "test-convert-gfm.html");
    await fs.writeFile(
      tmpInput,
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>",
    );

    const withGfm = await convertHtmlFile({ gfm: true, inputPath: tmpInput });
    const withoutGfm = await convertHtmlFile({
      gfm: false,
      inputPath: tmpInput,
    });

    expect(withGfm.markdown).toContain("|");
    expect(withoutGfm.markdown).not.toContain("|");
  });
});

describe("html-to-md CLI", () => {
  const html =
    "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>";

  it.each([
    ["uses GFM by default", [], true],
    ["disables GFM with --no-gfm", ["--no-gfm"], false],
  ])("%s", (_label, flags, includesTable) => {
    const { options } = createHtmlToMarkdownCli().parse([
      "node",
      "html-to-md.ts",
      "--html",
      html,
      ...flags,
    ]);
    const markdown = convertHtmlString({ gfm: options.gfm, html });

    expect(markdown.includes("|")).toBe(includesTable);
  });
});
