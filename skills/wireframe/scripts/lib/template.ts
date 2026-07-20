import { relative } from "node:path";
import { fileURLToPath } from "node:url";

/** The Tailwind bundle this skill installs alongside its scripts. */
const TAILWIND_BUNDLE = fileURLToPath(
  new URL(
    "../../node_modules/@tailwindcss/browser/dist/index.global.js",
    import.meta.url,
  ),
);

/**
 * Reference the bundle relative to the wireframe rather than by an absolute
 * path, so the page styles itself wherever it is opened from -- a static
 * origin, a plain file, or another host -- instead of only where a server maps
 * the task root to `/`.
 */
export function tailwindScriptSrc(outputDir: string) {
  return relative(outputDir, TAILWIND_BUNDLE).replaceAll("\\", "/");
}

const DEFAULT_BODY = `\
  <main class="max-w-5xl mx-auto px-6 py-12">
    <p>Replace this content with your wireframe.</p>
  </main>`;

export function buildHtml({
  body,
  outputDir,
  theme,
  title = "Wireframe",
}: {
  body?: string;
  outputDir: string;
  theme?: string;
  title?: string;
}) {
  const bodyContent = body ?? DEFAULT_BODY;
  const themeContent = theme ? `\n${theme}` : "";
  const scriptSrc = tailwindScriptSrc(outputDir);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style type="text/tailwindcss">
@import "tailwindcss";

@theme {${themeContent}
}
  </style>
  <script src="${escapeHtml(scriptSrc)}"></script>
</head>
<body>
${bodyContent}
</body>
</html>
`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
