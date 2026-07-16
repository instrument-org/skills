---
name: markdown
description: "Convert between HTML and Markdown, and convert Markdown to PDF. Use when converting HTML to markdown, markdown to PDF, turndown, html-to-md, md-to-pdf."
---

# Markdown

Use the bundled scripts for ordinary conversions. When the source needs
cleanup, preservation rules, or custom semantics, write a small TypeScript
program against the skill's installed Turndown library and adapt the recipes
below.

## Choose an approach

| Need                                       | Approach                                      |
| ------------------------------------------ | --------------------------------------------- |
| Ordinary HTML file or fragment to Markdown | Use `html-to-md.ts`                           |
| Remove, preserve, or rewrite HTML elements | Write a Turndown conversion recipe            |
| Quick Markdown file to PDF                 | Use `md-to-pdf.ts`                            |
| Designed or precisely laid-out PDF         | Load the PDF skill and use its layout recipes |

## Recipe: customize HTML conversion

`createConverter()` configures Turndown with optional GitHub-Flavored
Markdown support. Dependency-using custom TypeScript must live inside the
loaded skill package so npm imports resolve against that package.

Save `<markdown-skill-path>/scripts/custom-convert.ts`:

```typescript
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { createConverter } from "./lib/converter.ts";

const html = await readFile("attachments/article.html", "utf8");
const converter = createConverter({ gfm: true, headingStyle: "atx" });

converter.remove(["script", "style", "nav"]);
converter.addRule("callout", {
  filter: (node) =>
    node.nodeName === "ASIDE" && node.getAttribute("data-kind") === "note",
  replacement: (content) => `\n\n> **Note:** ${content.trim()}\n\n`,
});

const markdown = converter.turndown(html);
await mkdir("output", { recursive: true });
await writeFile("output/article.md", `${markdown.trim()}\n`, "utf8");
```

From the task root, run it with
`tsx <markdown-skill-path>/scripts/custom-convert.ts`. Use Turndown rules to
encode the source document's actual semantics instead of applying broad text
replacements after conversion.

Useful composition points:

- `remove([...])` discards elements and their contents.
- `keep([...])` preserves matching elements as HTML inside Markdown.
- `addRule(name, { filter, replacement })` maps source-specific elements to
  intentional Markdown.
- Disable GFM only when the destination cannot accept tables,
  strikethrough, or task lists.

## Recipe: verify the result

Read the generated Markdown and compare it with the source. Check headings,
list nesting, links, image paths, tables, code fences, and any custom elements.
Conversion success does not prove that the source hierarchy or meaning was
preserved.

`md-to-pdf.ts` is a quick convenience with limited layout control. After using
it, render and inspect the PDF with the PDF skill. Use the PDF skill directly
when page layout, fonts, tables, headers, or visual polish matter.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

{{GENERATED_SCRIPT_INDEX}}
