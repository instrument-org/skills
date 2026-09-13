// Publish a finished page to a public link, the same link the page's own Share
// button makes, from wherever the agent is running:
//
//   node <this file> output/<slug>.html            publish and print the link
//   node <this file> output/<slug>.html --check    is the link still up, and until when
//   node <this file> output/<slug>.html --delete   take the newest link down
//   node <this file> output/<slug>.html --delete <id>
//
// A link is a copy of the file at https://<id>.instrument.page/, readable by
// anyone who has the address, unlisted, and gone after thirty days. The id is
// a hash of the bytes, so the same file always lands at the same link and an
// edited file gets a new one. Publishing mints a delete token, handed back
// once and never again; this script keeps it in <slug>.share.json beside the
// page, which is the only place it exists, so a later run (or a later agent)
// can take the link down. Read references/sharing.md for when to publish at
// all.
//
// The same commands, the same sidecar and the same words as share.py beside
// it; take whichever runtime is here. No dependencies. INSTRUMENT_SHARE_ENDPOINT
// overrides the share host, for a local or staging pages worker.

import { readFile, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";

const ENDPOINT =
  process.env.INSTRUMENT_SHARE_ENDPOINT ??
  "https://share.instrument.page/share";

/** What the share host refuses over, so the refusal is read here first. */
const MAX_BYTES = 8 * 1024 * 1024;

/** Two placeholders every page starts with; a page still carrying one is not finished. */
const PLACEHOLDERS = [
  [/<title>\s*TITLE\s*<\/title>/i, "its <title> is still the starter's TITLE"],
  [
    /name="instrument:idea"\s+content="TEMPLATE@/i,
    "its instrument:idea meta still reads TEMPLATE",
  ],
];

const sidecarPath = (page) =>
  join(dirname(page), basename(page, extname(page)) + ".share.json");

async function readSidecar(page) {
  try {
    const parsed = JSON.parse(await readFile(sidecarPath(page), "utf8"));
    return { page: basename(page), links: [], ...parsed };
  } catch {
    return { page: basename(page), links: [] };
  }
}

async function writeSidecar(page, sidecar) {
  const path = sidecarPath(page);
  if (sidecar.links.length === 0) {
    await unlink(path).catch(() => {});
    return;
  }
  await writeFile(path, JSON.stringify(sidecar, null, 2) + "\n");
}

const day = (iso) => (iso ? iso.slice(0, 10) : "an unknown day");

async function lookup(id) {
  const response = await fetch(`${ENDPOINT}/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`lookup answered ${response.status}`);
  return response.json();
}

export async function publish(page) {
  const bytes = await readFile(page);
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error(
      `${page} is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB; the share host takes up to 8 MB, and a page should be under about 1.5`,
    );
  }
  const head = bytes.subarray(0, 8192).toString("utf8");
  if (!/^\s*<!doctype html/i.test(head)) {
    throw new Error(
      `${page} does not open with <!doctype html>, which the share host requires and every page from starter.html has`,
    );
  }
  for (const [pattern, why] of PLACEHOLDERS) {
    if (pattern.test(head)) {
      throw new Error(
        `${page} is not finished: ${why}. Publishing would make it public.`,
      );
    }
  }

  const response = await fetch(ENDPOINT, {
    body: bytes,
    headers: { "content-type": "text/html" },
    method: "POST",
  });
  if (response.status === 413)
    throw new Error("the share host refused the page as too large");
  if (response.status === 415)
    throw new Error("the share host refused the page as not HTML");
  if (response.status === 429) {
    throw new Error(
      "the share host is rate limiting this address; wait a minute and try again",
    );
  }
  if (!response.ok) {
    throw new Error(
      `the share host answered ${response.status}: ${await response.text()}`,
    );
  }
  const answer = await response.json();
  const isNew = response.status === 201;

  const sidecar = await readSidecar(page);
  const known = sidecar.links.find((link) => link.id === answer.id);
  const found = await lookup(answer.id).catch(() => null);
  const entry = {
    id: answer.id,
    url: answer.url,
    published: known?.published ?? new Date().toISOString(),
    expires: found?.expires ?? known?.expires,
    bytes: answer.bytes,
    ...(known?.deleteToken || answer.deleteToken
      ? { deleteToken: known?.deleteToken ?? answer.deleteToken }
      : {}),
  };
  const others = sidecar.links.filter((link) => link.id !== answer.id);
  sidecar.links = [entry, ...others];
  await writeSidecar(page, sidecar);

  const lines = [answer.url];
  if (isNew) {
    lines.push(
      `Published. Anyone with the link can read it; it expires ${day(entry.expires)}. The delete token is in ${sidecarPath(page)}.`,
    );
  } else if (entry.deleteToken) {
    lines.push(
      `Already published, unchanged; it expires ${day(entry.expires)}.`,
    );
  } else {
    lines.push(
      `Already published, by someone else or from the page's own Share button, so no delete token was issued here; it expires ${day(entry.expires)}.`,
    );
  }
  for (const old of others) {
    lines.push(
      `An earlier version is still up at ${old.url} until ${day(old.expires)}; --delete ${old.id} takes it down.`,
    );
  }
  return lines.join("\n");
}

export async function check(page, id) {
  const sidecar = await readSidecar(page);
  const target = id ?? sidecar.links[0]?.id;
  if (!target) return `${page} has never been published from here.`;
  const found = await lookup(target);
  if (!found) {
    sidecar.links = sidecar.links.filter((link) => link.id !== target);
    await writeSidecar(page, sidecar);
    return `The link for ${target} is gone: expired or deleted.`;
  }
  return `${found.url}\nUp until ${day(found.expires)}.`;
}

export async function remove(page, id) {
  const sidecar = await readSidecar(page);
  const target = id
    ? sidecar.links.find((link) => link.id === id)
    : sidecar.links[0];
  if (!target) {
    throw new Error(
      id
        ? `${sidecarPath(page)} holds no link with id ${id}`
        : `${page} has never been published from here, so there is nothing to delete`,
    );
  }
  if (!target.deleteToken) {
    throw new Error(
      `no delete token for ${target.url}: it was published from somewhere else, and only the publisher can take it down. It expires ${day(target.expires)}.`,
    );
  }
  const response = await fetch(`${ENDPOINT}/${target.id}`, {
    headers: { "x-delete-token": target.deleteToken },
    method: "DELETE",
  });
  if (response.status === 403)
    throw new Error("the share host refused the delete token");
  if (!response.ok && response.status !== 404) {
    throw new Error(`the share host answered ${response.status}`);
  }
  sidecar.links = sidecar.links.filter((link) => link.id !== target.id);
  await writeSidecar(page, sidecar);
  return response.status === 404
    ? `${target.url} was already gone.`
    : `Deleted ${target.url}. The link now answers 404.`;
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const [page, flag, id] = process.argv.slice(2);
  if (!page || (flag && !["--check", "--delete"].includes(flag))) {
    console.error(
      "usage: node share.mjs <page.html> [--check | --delete [id]]",
    );
    process.exit(2);
  }
  try {
    const run =
      flag === "--check" ? check : flag === "--delete" ? remove : publish;
    console.log(await run(page, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
