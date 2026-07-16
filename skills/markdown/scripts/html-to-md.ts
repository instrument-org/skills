/**
 * Convert an HTML file or string to Markdown
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createHtmlToMarkdownCli } from "./lib/cli.ts";
import {
  type CodeBlockStyle,
  type HeadingStyle,
  convertHtml,
} from "./lib/converter.ts";

export async function convertHtmlFile({
  inputPath,
  outputPath,
  gfm = true,
  headingStyle = "atx",
  codeBlockStyle = "fenced",
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
  inputPath: string;
  outputPath?: string;
}) {
  const html = await readFile(inputPath, "utf-8");

  const markdown = convertHtml({
    codeBlockStyle,
    gfm,
    headingStyle,
    html,
  });

  if (outputPath) {
    await writeFile(outputPath, markdown, "utf-8");
    return { markdown, outputPath };
  }

  return { markdown };
}

export function convertHtmlString({
  html,
  gfm = true,
  headingStyle = "atx",
  codeBlockStyle = "fenced",
}: {
  codeBlockStyle?: CodeBlockStyle;
  gfm?: boolean;
  headingStyle?: HeadingStyle;
  html: string;
}) {
  return convertHtml({
    codeBlockStyle,
    gfm,
    headingStyle,
    html,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = createHtmlToMarkdownCli();
  const { options } = cli.parse();
  if (options.help) process.exit(0);

  if (!options.htmlFile && !options.html) {
    cli.outputHelp();
    process.exit(1);
  }

  const headingStyle = options.headingStyle as HeadingStyle;
  const codeBlockStyle = options.codeBlockStyle as CodeBlockStyle;

  if (options.html) {
    const markdown = convertHtmlString({
      codeBlockStyle,
      gfm: options.gfm,
      headingStyle,
      html: options.html,
    });
    process.stdout.write(markdown);
  } else {
    const inputPath = resolve(options.htmlFile);
    const outputPath = options.output ? resolve(options.output) : undefined;
    const result = await convertHtmlFile({
      codeBlockStyle,
      gfm: options.gfm,
      headingStyle,
      inputPath,
      outputPath,
    });

    if (result.outputPath) {
      console.log(`Converted → ${result.outputPath}`);
    } else {
      process.stdout.write(result.markdown);
    }
  }
}
