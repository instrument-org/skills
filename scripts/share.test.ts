import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const SKILL = join(import.meta.dirname, "../skills/instrument-page");

// The two files promise the same commands, the same sidecar and the same
// words, so every case below runs against both, and one crosses over.
const RUNTIMES = [
  ["node", join(SKILL, "share.mjs")],
  ["python3", join(SKILL, "share.py")],
] as const;

// The pages worker's upload half, as far as the script can tell it apart from
// the real one: content addresses, a delete token minted once, 200 without one
// for bytes already here, a link token in the link's path that a lookup has to
// show (a page from before link tokens has none), and the refusals the script
// is expected to translate.
// It lives in this process, so every spawn below is asynchronous: a blocking
// spawn would hold the event loop the server answers on, and the child would
// wait forever for a reply.
const pages = new Map<string, { deleteToken: string; linkToken: string }>();
let server: Server;
let origin: string;
const endpoint = () => `${origin}/share`;

const idOf = (body: Buffer) =>
  createHash("sha256").update(body).digest("hex").slice(0, 12);
// Sixteen base32 letters, the shape of a real one, made from the id so a test
// can name it.
const linkTokenOf = (id: string) =>
  [...createHash("sha256").update(`link:${id}`).digest("hex").slice(0, 16)]
    .map((c) => "abcdefghijklmnop"[Number.parseInt(c, 16)])
    .join("");
const linkOf = (id: string) => {
  const token = pages.get(id)?.linkToken ?? linkTokenOf(id);
  return `${origin}/${id}/${token ? `${token}/` : ""}`;
};

beforeAll(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const body = Buffer.concat(chunks);
      const json = (status: number, payload: unknown) => {
        response.writeHead(status, { "content-type": "application/json" });
        response.end(JSON.stringify(payload));
      };
      const asked = new URL(request.url ?? "/", "http://localhost");
      const id = asked.pathname.replace(/^\/share\/?/, "");
      if (request.method === "POST") {
        if (!/^\s*<!doctype html/i.test(body.subarray(0, 200).toString())) {
          return json(415, { error: "html only" });
        }
        const found = idOf(body);
        if (pages.has(found)) {
          return json(200, {
            bytes: body.length,
            id: found,
            url: linkOf(found),
          });
        }
        pages.set(found, {
          deleteToken: `tok-${found}`,
          linkToken: linkTokenOf(found),
        });
        return json(201, {
          bytes: body.length,
          deleteToken: `tok-${found}`,
          id: found,
          url: linkOf(found),
        });
      }
      const held = pages.get(id);
      if (!held) return json(404, { error: "no such page" });
      if (request.method === "GET") {
        // The id alone is public, so without the link's token a page with one
        // is not here.
        if (
          held.linkToken &&
          asked.searchParams.get("token") !== held.linkToken
        ) {
          return json(404, { error: "no such page" });
        }
        return json(200, {
          expires: "2026-10-13T12:00:00.000Z",
          id,
          url: linkOf(id),
        });
      }
      if (request.method === "DELETE") {
        if (request.headers["x-delete-token"] !== held.deleteToken) {
          return json(403, { error: "bad token" });
        }
        pages.delete(id);
        response.writeHead(204);
        return response.end();
      }
      json(405, { error: "method" });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

let dir: string;
let page: string;
const PAGE = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Heat pumps</title><meta name="instrument:idea" content="explainer@1" /></head><body><p>Hello</p></body></html>\n`;

beforeEach(() => {
  pages.clear();
  dir = mkdtempSync(join(tmpdir(), "share-"));
  page = join(dir, "heat-pumps.html");
  writeFileSync(page, PAGE);
});

function run(
  command: string,
  args: string[],
): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        encoding: "utf-8",
        env: { ...process.env, INSTRUMENT_SHARE_ENDPOINT: endpoint() },
      },
      (error, stdout, stderr) => {
        const code =
          error && typeof error.code === "number" ? error.code : error ? 1 : 0;
        resolve({ code, out: (code === 0 ? stdout : stderr).trim() });
      },
    );
  });
}

const firstLine = (out: string) => out.split("\n")[0];

const sidecarPath = () => join(dir, "heat-pumps.share.json");
const sidecar = () => JSON.parse(readFileSync(sidecarPath(), "utf-8"));

describe.each(RUNTIMES)("share via %s", (runtime, script) => {
  const share = (...args: string[]) => run(runtime, [script, page, ...args]);

  it("publishes, prints the link first, and keeps the token beside the page", async () => {
    const id = idOf(Buffer.from(PAGE));
    const { code, out } = await share();
    expect(code).toBe(0);
    expect(firstLine(out)).toBe(`${origin}/${id}/${linkTokenOf(id)}/`);
    expect(out).toContain("expires 2026-10-13");
    expect(sidecar().links).toEqual([
      expect.objectContaining({
        deleteToken: `tok-${id}`,
        expires: "2026-10-13T12:00:00.000Z",
        id,
      }),
    ]);
  });

  it("publishing the same bytes again keeps the token it already holds", async () => {
    await share();
    const before = sidecar();
    const { out } = await share();
    expect(out).toContain("Already published, unchanged");
    expect(sidecar()).toEqual(before);
  });

  it("says when a link exists that this file never minted a token for", async () => {
    // Somebody else, or the page's own Share button in a browser, got there first.
    await run("curl", [
      "-sS",
      "-H",
      "content-type: text/html",
      "--data-binary",
      `@${page}`,
      endpoint(),
    ]);
    const { out } = await share();
    expect(out).toContain("no delete token was issued here");
    expect(sidecar().links[0]).not.toHaveProperty("deleteToken");
    expect((await share("--delete")).out).toContain(
      "only the publisher can take it down",
    );
  });

  it("an edited page is a new link, and the old one is reported until deleted", async () => {
    const first = firstLine((await share()).out);
    writeFileSync(page, PAGE.replace("Hello", "Hello again"));
    const { out } = await share();
    expect(firstLine(out)).not.toBe(first);
    expect(out).toContain(`An earlier version is still up at ${first}`);
    expect(sidecar().links).toHaveLength(2);
    const oldId = sidecar().links[1].id;
    expect((await share("--delete", oldId)).out).toContain(`Deleted ${first}`);
    expect(sidecar().links).toHaveLength(1);
  });

  it("checks a link from before link tokens by its id alone", async () => {
    await share();
    const id = idOf(Buffer.from(PAGE));
    pages.set(id, { deleteToken: `tok-${id}`, linkToken: "" });
    const before = sidecar();
    before.links[0].url = `${origin}/${id}/`;
    writeFileSync(sidecarPath(), JSON.stringify(before));
    expect((await share("--check")).out).toBe(
      `${origin}/${id}/\nUp until 2026-10-13.`,
    );
  });

  it("checks the newest link and forgets one that has gone", async () => {
    await share();
    expect((await share("--check")).out).toContain("Up until 2026-10-13");
    pages.clear();
    expect((await share("--check")).out).toContain("gone");
    expect(existsSync(sidecarPath())).toBe(false);
  });

  it("deletes the newest link and drops the sidecar with the last one", async () => {
    const link = firstLine((await share()).out);
    expect((await share("--delete")).out).toBe(
      `Deleted ${link}. The link now answers 404.`,
    );
    expect(existsSync(sidecarPath())).toBe(false);
    expect(pages.size).toBe(0);
  });

  it.each([
    ["<title>TITLE</title>", "<title>Heat pumps</title>", "placeholder TITLE"],
    ['content="TEMPLATE@1"', 'content="explainer@1"', "still reads TEMPLATE"],
  ])(
    "refuses a page still carrying the placeholder %s",
    async (placeholder, finished, message) => {
      writeFileSync(page, PAGE.replace(finished, placeholder));
      const { code, out } = await share();
      expect(code).toBe(1);
      expect(out).toContain(message);
      expect(pages.size).toBe(0);
    },
  );

  it("refuses a file that is not a document before sending it", async () => {
    writeFileSync(page, "<p>not a page</p>");
    const { code, out } = await share();
    expect(code).toBe(1);
    expect(out).toContain("does not open with <!doctype html>");
    expect(pages.size).toBe(0);
  });
});

// A sidecar one runtime wrote is the other's to read: an agent that published
// from Node and comes back with only Python still holds the token.
it("a link published from one runtime is deleted from the other", async () => {
  const [[node, mjs], [python, py]] = RUNTIMES;
  const link = firstLine((await run(node, [mjs, page])).out);
  expect((await run(python, [py, page, "--check"])).out).toContain(link);
  expect((await run(python, [py, page, "--delete"])).out).toBe(
    `Deleted ${link}. The link now answers 404.`,
  );
  expect(existsSync(sidecarPath())).toBe(false);
  expect(pages.size).toBe(0);
});
