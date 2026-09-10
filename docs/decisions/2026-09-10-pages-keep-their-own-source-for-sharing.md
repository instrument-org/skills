# Pages keep their own source for sharing

Status: accepted, 2026-09-10

## What

The last script in every page's body, part of the shell, serializes the document as the parser reaches it and leaves the string on `window.__instrumentSource`. The share widget publishes that string. A page's own inline scripts are `<script type="module">` and the Tailwind script is `defer`, so both run after the copy is taken, and `pnpm check:ideas` fails an example whose inline script is not a module.

## Why

The widget used to clone the live DOM at `DOMContentLoaded`. By then every inline script had run: the link-icon script had wrapped the first word of every external link, a tool's script had drawn its output, and Tailwind had dropped a compiled sheet into the head. The published copy carried all of that together with the scripts that produced it, so on opening it the icons nested a second time and each save-and-share hop compounded. Fetching the file's own bytes is not available: `file://` blocks `fetch` in every browser, and `file://` is how nearly every page is opened, in Studio's webview and in a reader's browser after an email.

The one moment a file can be read as written from inside itself is a plain script placed last in the body: the parser has built everything above it and no deferred script has run. Serialization normalizes attributes and entities, so the string is not the file's bytes, but it is the same string on every load and in every browser, and a copy re-serializes to itself. That is what makes the same page publish to the same content address every time, and what lets a published copy's scripts run on markup they have not already run on.

Modules rather than a rule that page scripts be safe to run twice: a script that is safe to run twice still ships its output, and every agent-written script would have to get it right, where a module is one attribute the checker can see.

Tailwind deferred rather than its sheet stripped from the copy: Tailwind creates the sheet the moment it runs and fills it asynchronously, so at capture time it is sometimes empty and sometimes full, and any check on its content is timing-dependent. Deferred, it runs after the capture; compiling was asynchronous already, so a reader sees nothing different.

## Cost

Module scripts run in strict mode and their top-level names are not globals, so a page keeps its logic in one script and attaches listeners there rather than through `onclick` attributes. A page whose agent wrote a plain `<script>` gets the old behavior for that page alone, its output in the copy. The copy also lacks whatever follows the last script in the source, which is one closing shell marker that nothing reads from a published copy.
