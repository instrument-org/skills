---
name: markdown
description: "Convert HTML pages and fragments to Markdown."
---

# Markdown

Use the bundled scripts for ordinary conversions. When the source needs cleanup, preservation rules, or custom semantics, write a small TypeScript program against the Turndown library and adapt the recipes below.

## Choose an approach

| Need                                       | Approach                           |
| ------------------------------------------ | ---------------------------------- |
| Ordinary HTML file or fragment to Markdown | Use `html-to-md.ts`                |
| Remove, preserve, or rewrite HTML elements | Write a Turndown conversion recipe |

## Recipe: customize HTML conversion

This skill's folder is read-only, and its Turndown packages resolve only for its own scripts. Put custom TypeScript in your work folder and add the packages there with `pnpm add turndown turndown-plugin-gfm`. The recipe sets Turndown up as `html-to-md.ts` does, with GitHub-Flavored Markdown support.

Save `<job>/convert.ts` in your work folder:

```typescript
import { mkdir, readFile, writeFile } from "node:fs/promises";

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const html = await readFile(
  `${process.env.INSTRUMENT_ATTACHMENTS}/article.html`,
  "utf8",
);
const converter = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});
converter.use(gfm);

converter.remove(["script", "style", "nav"]);
converter.addRule("callout", {
  filter: (node) =>
    node.nodeName === "ASIDE" && node.getAttribute("data-kind") === "note",
  replacement: (content) => `\n\n> **Note:** ${content.trim()}\n\n`,
});

const markdown = converter.turndown(html);
await mkdir("output", { recursive: true });
await writeFile("article.md", `${markdown.trim()}\n`, "utf8");
```

From the work folder, run it with `node <job>/convert.ts`. Use Turndown rules to encode the source document's actual semantics instead of applying broad text replacements after conversion.

Useful composition points:

- `remove([...])` discards elements and their contents.
- `keep([...])` preserves matching elements as HTML inside Markdown.
- `addRule(name, { filter, replacement })` maps source-specific elements to intentional Markdown.
- Disable GFM only when the destination cannot accept tables, strikethrough, or task lists.

## Recipe: verify the result

Read the generated Markdown and compare it with the source. Check headings, list nesting, links, image paths, tables, code fences, and any custom elements. Conversion success does not prove that the source hierarchy or meaning was preserved.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

{{GENERATED_SCRIPT_INDEX}}
