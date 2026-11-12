// Publish a finished page to a public link, the same link the page's own Share
// button makes, from wherever the agent is running:
//
//   node <this file> <slug>.html            publish and print the link
//   node <this file> <slug>.html --check    is the link still up, and until when
//   node <this file> <slug>.html --delete   take the newest link down
//   node <this file> <slug>.html --delete <id>
//   node <this file> <slug>.html --allow-secrets
//
// A link is a copy of the file at https://<id>.instrument.page/<token>/,
// readable by anyone who has the address, unlisted, and gone after thirty days.
// The token is random, so the address cannot be guessed from the host. The id is
// a hash of the bytes, so the same file always lands at the same link and an
// edited file gets a new one. Publishing mints a delete token, handed back
// once and never again; this script keeps it in <slug>.share.json beside the
// page, which is the only place it exists, so a later run (or a later agent)
// can take the link down. Publishing stops on any string shaped like a live
// credential (findSecrets, below) and names each by line; --allow-secrets
// publishes anyway, for a page whose keys are samples. Read
// references/sharing.md for when to publish at all.
//
// The same commands, the same sidecar and the same words as share.py beside
// it; take whichever runtime is here. No dependencies. INSTRUMENT_SHARE_ENDPOINT
// overrides the share host, for a local or staging pages worker.

import { realpathSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";

const ENDPOINT =
  process.env.INSTRUMENT_SHARE_ENDPOINT ??
  "https://share.instrument.page/share";

/** Two placeholders a page made from a kit starts with; a page still carrying one is not finished. */
const PLACEHOLDERS = [
  [
    /<title>\s*TITLE\s*<\/title>/i,
    "its <title> is still the placeholder TITLE",
  ],
  [
    /name="instrument:idea"\s+content="TEMPLATE@/i,
    "its instrument:idea meta still reads TEMPLATE",
  ],
];

// Strings shaped like a live credential, from gitleaks' default rules
// (config/gitleaks.toml): its pattern for each, where group 1 (when there is
// one) is the secret, and the Shannon entropy the secret has to exceed. A
// pattern that gitleaks ends with quotes, whitespace or a semicolon also ends
// at < and &, the edges of a value in HTML. page.mjs fails a page on the same
// strings, and share.py holds the same table.
const END = String.raw`(?:[\x60'"\t\n\f\r ;<&]|\\[nr]|$)`;
const SECRETS = [
  [
    "an AWS access key ID",
    String.raw`\b((?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16})\b`,
    "",
    3,
  ],
  ["a GitHub token", String.raw`gh[pousr]_[0-9a-zA-Z]{36}`, "", 3],
  ["a GitHub token", String.raw`github_pat_\w{82}`, "", 3],
  ["a GitLab token", String.raw`glpat-[\w-]{20}`, "", 3],
  [
    "a Slack token",
    String.raw`xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*`,
    "",
    3,
  ],
  [
    "a Slack token",
    String.raw`xox[pe](?:-[0-9]{10,13}){3}-[a-zA-Z0-9-]{28,34}`,
    "",
    2,
  ],
  ["a Slack token", String.raw`xapp-\d-[A-Z0-9]+-\d+-[a-z0-9]+`, "i", 2],
  ["a Slack token", String.raw`xoxe.xox[bp]-\d-[A-Z0-9]{163,166}`, "i", 2],
  ["a Slack token", String.raw`xoxe-\d-[A-Z0-9]{146}`, "i", 2],
  ["a Slack token", String.raw`xoxb-[0-9]{8,14}-[a-zA-Z0-9]{18,26}`, "", 2],
  ["a Slack token", String.raw`xox[os]-\d+-\d+-\d+-[a-fA-F\d]+`, "", 2],
  ["a Slack token", String.raw`xox[ar]-(?:\d-)?[0-9a-zA-Z]{8,48}`, "", 2],
  [
    "a Slack webhook URL",
    String.raw`(?:https?://)?hooks.slack.com/(?:services|workflows|triggers)/[A-Za-z0-9+/]{43,56}`,
    "",
    0,
  ],
  [
    "an OpenAI API key",
    String.raw`\b(sk-(?:proj|svcacct|admin)-(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})\b|sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20})` +
      END,
    "",
    3,
  ],
  [
    "an Anthropic API key",
    String.raw`\b(sk-ant-(?:api03|admin01)-[a-zA-Z0-9_\-]{93}AA)` + END,
    "",
    0,
  ],
  [
    "a Stripe live key",
    String.raw`\b((?:sk|rk)_live_[a-zA-Z0-9]{10,99})` + END,
    "",
    2,
  ],
  ["a Google API key", String.raw`\b(AIza[\w-]{35})` + END, "", 4],
  ["an npm token", String.raw`\b(npm_[a-z0-9]{36})` + END, "i", 2],
  [
    "a private key",
    String.raw`-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----[\s\S-]{64,}?KEY(?: BLOCK)?-----`,
    "i",
    0,
  ],
].map(([kind, source, flags, entropy]) => ({
  kind,
  pattern: new RegExp(source, `g${flags}`),
  entropy,
}));

/** What a masked secret keeps: the prefix that names its kind. */
const HEAD =
  /^(?:(?:https?:\/\/)?hooks\.slack\.com\/\w+\/|sk-ant-(?:api03|admin01)-|sk-(?:proj|svcacct|admin)-|[sr]k_live_|github_pat_|glpat-|xoxe.xox[bp]-|xox.-|xapp-|gh[pousr]_|npm_|sk-|.{4})/i;

const mask = (secret) => {
  const begin = secret.match(/^-----BEGIN[^\n]*?-----/);
  return begin
    ? `${begin[0]}...`
    : `${secret.match(HEAD)?.[0] ?? ""}...${secret.slice(-4)}`;
};

// Bits per character, as gitleaks measures it.
const entropyOf = (text) => {
  const counts = new Map();
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const share = count / text.length;
    bits -= share * Math.log2(share);
  }
  return bits;
};

// A sample from documentation or a masked value, rather than a key: AWS's
// documented keys end in EXAMPLE, gitleaks skips the alphabet run, and a run
// of x or 0 or an ellipsis is a value someone blanked out.
const isSample = (secret) =>
  /example/i.test(secret) ||
  secret.toLowerCase().includes("abcdefghijklmnopqrstuvwxyz") ||
  /x{6}|X{6}|0{6}|\.\.\.|…/.test(secret);

/** Every string in text shaped like a live credential, by line, masked. */
export function findSecrets(text) {
  const found = [];
  for (const { kind, pattern, entropy } of SECRETS) {
    for (const match of text.matchAll(pattern)) {
      const secret = match[1] ?? match[0];
      if (entropy && entropyOf(secret) <= entropy) continue;
      if (isSample(secret)) continue;
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        kind,
        secret,
      });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const hits = [];
  let reached = 0;
  for (const hit of found) {
    if (hit.start < reached) continue;
    reached = hit.end;
    hits.push({
      kind: hit.kind,
      line: text.slice(0, hit.start).split("\n").length,
      masked: mask(hit.secret),
    });
  }
  return hits;
}

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

// The share host names a page's link only to someone who shows its token, the
// path segment after the host. A link published before links had tokens has
// none, and is looked up by its id alone.
const tokenIn = (url) =>
  (url ? new URL(url).pathname.split("/") : []).find((segment) =>
    /^[a-z2-7]{16}$/.test(segment),
  ) ?? "";

async function lookup(id, url) {
  const token = tokenIn(url);
  const response = await fetch(
    `${ENDPOINT}/${id}${token ? `?token=${token}` : ""}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`lookup answered ${response.status}`);
  return response.json();
}

export async function publish(page, { allowSecrets = false } = {}) {
  const bytes = await readFile(page);
  const head = bytes.subarray(0, 8192).toString("utf8");
  if (!/^\s*<!doctype html/i.test(head)) {
    throw new Error(
      `${page} does not open with <!doctype html>, which the share host requires`,
    );
  }
  for (const [pattern, why] of PLACEHOLDERS) {
    if (pattern.test(head)) {
      throw new Error(
        `${page} is not finished: ${why}. Publishing would make it public.`,
      );
    }
  }
  const secrets = allowSecrets ? [] : findSecrets(bytes.toString("utf8"));
  if (secrets.length) {
    throw new Error(
      [
        `${page} was not published: it holds what looks like a secret, and anyone with the link could read it.`,
        ...secrets.map((s) => `  line ${s.line}: ${s.kind}, ${s.masked}`),
        "Replace each with a placeholder or masked text and run again. If none is a working secret, run again with --allow-secrets.",
      ].join("\n"),
    );
  }

  const response = await fetch(ENDPOINT, {
    body: bytes,
    headers: { "content-type": "text/html" },
    method: "POST",
  });
  // Size is left to the host, which counts what it refuses.
  if (response.status === 413)
    throw new Error(
      `the share host refused ${page} as too large: it is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB and the host takes up to 8 MB. Check its images for bytes the box they render in never shows.`,
    );
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
  const found = await lookup(answer.id, answer.url).catch(() => null);
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
  const known = sidecar.links.find((link) => link.id === target);
  const found = await lookup(target, known?.url);
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

// Node resolves symlinks before it names the module, so a skill folder
// linked into an agent's skills directory only matches through realpath.
if (
  process.argv[1] &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
) {
  const [page, flag, id] = process.argv.slice(2);
  if (
    !page ||
    (flag && !["--allow-secrets", "--check", "--delete"].includes(flag))
  ) {
    console.error(
      "usage: node share.mjs <page.html> [--allow-secrets | --check | --delete [id]]",
    );
    process.exit(2);
  }
  try {
    console.log(
      flag === "--check"
        ? await check(page, id)
        : flag === "--delete"
          ? await remove(page, id)
          : await publish(page, { allowSecrets: flag === "--allow-secrets" }),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
