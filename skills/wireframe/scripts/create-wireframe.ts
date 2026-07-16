/**
 * Generate an HTML wireframe scaffold with Tailwind CSS styling
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cac } from "cac";
import { buildHtml } from "./lib/template.ts";

const require = createRequire(import.meta.url);

function checkTailwindDep() {
  try {
    require.resolve("@tailwindcss/browser");
  } catch {
    console.warn(
      `Warning: @tailwindcss/browser not found. ` +
        `Make sure dependencies are installed.`,
    );
  }
}

export async function createWireframe({
  body,
  bodyFile,
  outputPath,
  themeFile,
  theme,
  title,
}: {
  body?: string;
  bodyFile?: string;
  outputPath: string;
  themeFile?: string;
  theme?: string;
  title?: string;
}) {
  checkTailwindDep();
  if (body !== undefined && bodyFile !== undefined) {
    throw new Error("Use either body or bodyFile, not both");
  }
  if (theme !== undefined && themeFile !== undefined) {
    throw new Error("Use either theme or themeFile, not both");
  }

  const [bodyContent, themeContent] = await Promise.all([
    bodyFile === undefined ? body : readFile(bodyFile, "utf-8"),
    themeFile === undefined ? theme : readFile(themeFile, "utf-8"),
  ]);
  const html = buildHtml({ body: bodyContent, theme: themeContent, title });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf-8");
  return { outputPath };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("create-wireframe");
  cli.usage("--output wireframe.html [--body-file body.html]");
  cli.option("--output <path>", "Output HTML file path");
  cli.option("--body <html>", "Inline HTML body content");
  cli.option("--body-file <path>", "Read HTML body content from a file");
  cli.option("--theme <css>", "Inline declarations for the @theme block");
  cli.option(
    "--theme-file <path>",
    "Read @theme block declarations from a file",
  );
  cli.option("--title <text>", "Document title", { default: "Wireframe" });
  cli.help();
  const parsed = cli.parse();
  const { options } = parsed;

  if (!options.output) {
    console.error("--output <path> is required");
    process.exit(1);
  }

  const result = await createWireframe({
    body: options.body,
    bodyFile: options.bodyFile ? resolve(options.bodyFile) : undefined,
    outputPath: resolve(options.output),
    theme: options.theme,
    themeFile: options.themeFile ? resolve(options.themeFile) : undefined,
    title: options.title,
  });

  const relOutput = result.outputPath;
  console.log(`Created ${relOutput}`);
}
