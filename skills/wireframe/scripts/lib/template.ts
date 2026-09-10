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
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='520' viewBox='0 0 520 520'%3E%3Crect width='520' height='520' rx='136' fill='%230b6056'/%3E%3Cpath d='M436.675 331.78C408.481 401.395 340.226 450.5 260.5 450.5C180.774 450.5 112.519 401.395 84.3252 331.78H436.675ZM446.977 223.906C449.287 235.748 450.5 247.982 450.5 260.5C450.5 274.88 448.899 288.886 445.872 302.352H314.801C293.139 302.351 275.578 284.791 275.578 263.129C275.578 241.467 293.139 223.906 314.801 223.906H446.977ZM210.199 223.906C231.861 223.906 249.422 241.467 249.422 263.129C249.422 284.791 231.861 302.352 210.199 302.352H75.1279C72.1008 288.886 70.5 274.88 70.5 260.5C70.5 247.982 71.7131 235.748 74.0234 223.906H210.199ZM260.5 70.5C342.227 70.5 411.9 122.101 438.721 194.5H82.2793C109.1 122.101 178.773 70.5 260.5 70.5Z' fill='%23fff'/%3E%3C/svg%3E" />
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
