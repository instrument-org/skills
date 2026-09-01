/**
 * Generate a visual answer page shell with the Studio theme and local bundles
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { buildHtml } from "./lib/template.ts";

export async function createVisualAnswer({
  body,
  bodyFile,
  outputPath,
  title,
}: {
  body?: string;
  bodyFile?: string;
  outputPath: string;
  title?: string;
}) {
  if (body !== undefined && bodyFile !== undefined) {
    throw new Error("Use either body or bodyFile, not both");
  }
  const bodyContent =
    bodyFile === undefined ? body : await readFile(bodyFile, "utf-8");
  const html = buildHtml({
    body: bodyContent,
    outputDir: dirname(outputPath),
    title,
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-visual-answer");
  cli.usage("--output output/answer.html [--body-file work/body.html]");
  cli.option("--output <path>", "Output HTML file path");
  cli.option("--body <html>", "Inline HTML content for <main>");
  cli.option("--body-file <path>", "Read <main> content from a file");
  cli.option("--title <text>", "Document title placeholder", {
    default: "Visual answer",
  });
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.output) {
    console.error("--output <path> is required");
    process.exit(1);
  }

  await createVisualAnswer({
    body: options.body,
    bodyFile: options.bodyFile,
    outputPath: options.output,
    title: options.title,
  });
  console.log(`Wrote ${options.output}`);
}
