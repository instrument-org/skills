// A grid of every idea's examples as live frames, reloading when a file
// changes. Zero dependencies, so any agent working in this folder can run it:
//
//   pnpm preview            # http://localhost:4173
//   pnpm preview --port 5000
//
// This is the surface to iterate on. Captures are for the website and are
// never consulted here.

import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { listIdeas, SKILLS_DIR } from "./ideas.ts";

const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4173;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Every frame's file and its mtime, so the page can tell what changed. */
function state(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const idea of listIdeas()) {
    out[`/skills/${idea.name}/starter.html`] = mtime(idea.starterPath);
    for (const example of idea.examples) {
      out[`/skills/${idea.name}/examples/${example.name}.html`] = mtime(
        example.htmlPath,
      );
    }
  }
  return out;
}

function mtime(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

function page(): string {
  const ideas = listIdeas();
  const sections = ideas
    .map((idea) => {
      const frames = [
        ...idea.examples.map(
          (example) => `
        <figure>
          <iframe data-src="/skills/${idea.name}/examples/${example.name}.html" src="/skills/${idea.name}/examples/${example.name}.html" title="${escapeHtml(example.meta?.title ?? example.name)}"></iframe>
          <figcaption><strong>${escapeHtml(example.meta?.title ?? example.name)}</strong> <span>${escapeHtml(example.meta?.note ?? "")}</span> <a href="/skills/${idea.name}/examples/${example.name}.html" target="_blank">open</a></figcaption>
        </figure>`,
        ),
        `
        <figure>
          <iframe data-src="/skills/${idea.name}/starter.html" src="/skills/${idea.name}/starter.html" title="starter"></iframe>
          <figcaption><strong>starter.html</strong> <span>the skeleton an agent copies</span> <a href="/skills/${idea.name}/starter.html" target="_blank">open</a></figcaption>
        </figure>`,
      ].join("");
      return `
      <section>
        <h2>${escapeHtml(idea.meta?.title ?? idea.name)} <code>${idea.name}</code></h2>
        <p>${escapeHtml(idea.meta?.tagline ?? "")} · ${idea.examples.length} example${idea.examples.length === 1 ? "" : "s"}</p>
        <div class="grid">${frames}</div>
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Ideas preview</title>
<style>
  body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; background: #f5f5f4; color: #1c1917; }
  header { padding: 14px 24px; border-bottom: 1px solid #e7e5e4; background: #fff; display: flex; gap: 16px; align-items: baseline; }
  header h1 { font-size: 15px; margin: 0; }
  header span { color: #79716b; font-size: 12px; }
  section { padding: 20px 24px 8px; }
  h2 { font-size: 15px; margin: 0; }
  h2 code { font-weight: 400; color: #79716b; margin-left: 8px; font-size: 12px; }
  section > p { margin: 2px 0 12px; color: #79716b; font-size: 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
  figure { margin: 0; background: #fff; border: 1px solid #e7e5e4; border-radius: 10px; padding: 8px; }
  iframe { width: 100%; aspect-ratio: 4 / 5; border: 0; border-radius: 6px; background: #fff; }
  figcaption { font-size: 12px; color: #57534e; padding: 8px 4px 2px; }
  figcaption a { color: #0b6056; margin-left: 6px; }
  .empty { padding: 40px 24px; color: #79716b; }
</style>
</head>
<body>
<header><h1>Ideas preview</h1><span>${ideas.length} idea${ideas.length === 1 ? "" : "s"} · frames reload when their file changes</span></header>
${sections || '<p class="empty">No skill carries an idea.json yet.</p>'}
<script>
  let last = null;
  async function tick() {
    try {
      const next = await (await fetch("/api/state", { cache: "no-store" })).json();
      if (last) {
        const known = Object.keys(last).length, now = Object.keys(next).length;
        if (known !== now) { location.reload(); return; }
        for (const frame of document.querySelectorAll("iframe[data-src]")) {
          const key = frame.dataset.src;
          if (next[key] !== last[key]) frame.src = key + "?t=" + Date.now();
        }
      }
      last = next;
    } catch {}
    setTimeout(tick, 1500);
  }
  tick();
</script>
</body>
</html>`;
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": MIME[".html"] });
    response.end(page());
    return;
  }
  if (url.pathname === "/api/state") {
    response.writeHead(200, {
      "content-type": MIME[".json"],
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(state()));
    return;
  }
  if (url.pathname.startsWith("/skills/")) {
    const relative = normalize(
      decodeURIComponent(url.pathname.slice("/skills/".length)),
    );
    if (relative.split(sep).includes("..")) {
      response.writeHead(400).end();
      return;
    }
    const file = join(SKILLS_DIR, relative);
    try {
      const body = readFileSync(file);
      response.writeHead(200, {
        "content-type": MIME[extname(file)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
    return;
  }
  response.writeHead(404).end("not found");
});

server.listen(port, () => {
  console.log(`Ideas preview at http://localhost:${port}`);
});
