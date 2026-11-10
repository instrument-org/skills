#!/usr/bin/env node
// node tools/page-lab/serve.mjs [port]   (pnpm page-lab)
// Serves the repo root on 127.0.0.1 so the lab reads foundation.css live from
// skills/instrument-page, and tells the browser never to cache, so a reload
// always shows the stylesheet as it is on disk.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const port = Number(process.argv[2]) || 4711;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") {
    res.writeHead(302, { Location: "/tools/page-lab/" }).end();
    return;
  }
  let file = normalize(join(root, path));
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) {
      // A folder without its slash would resolve the page's relative links one level up.
      if (!path.endsWith("/")) {
        res.writeHead(301, { Location: `${path}/` }).end();
        return;
      }
      file = join(file, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Page lab: http://localhost:${port}/tools/page-lab/`);
});
