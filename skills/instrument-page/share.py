"""Publish a finished page to a public link, the same link the page's own Share
button makes, from wherever the agent is running:

    python <this file> <slug>.html            publish and print the link
    python <this file> <slug>.html --check    is the link still up, and until when
    python <this file> <slug>.html --delete   take the newest link down
    python <this file> <slug>.html --delete <id>
    python <this file> <slug>.html --allow-secrets

A link is a copy of the file at https://<id>.instrument.page/<token>/, readable
by anyone who has the address, unlisted, and gone after thirty days. The token
is random, so the address cannot be guessed from the host. The id is a hash of
the bytes, so the same file always lands at the same link and an edited
file gets a new one. Publishing mints a delete token, handed back once and never
again; this script keeps it in <slug>.share.json beside the page, which is the
only place it exists, so a later run (or a later agent) can take the link down.
Publishing stops on any string shaped like a live credential (find_secrets,
below) and names each by line; --allow-secrets publishes anyway, for a page
whose keys are samples. Read references/sharing.md for when to publish at all.

The same commands, the same sidecar and the same words as share.mjs beside it;
take whichever runtime is here. Standard library only. INSTRUMENT_SHARE_ENDPOINT
overrides the share host, for a local or staging pages worker.
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ENDPOINT = os.environ.get(
    "INSTRUMENT_SHARE_ENDPOINT", "https://share.instrument.page/share"
)

# Two placeholders a page made from a kit starts with; a page still carrying one is not finished.
PLACEHOLDERS = [
    (re.compile(r"<title>\s*TITLE\s*</title>", re.I), "its <title> is still the placeholder TITLE"),
    (
        re.compile(r'name="instrument:idea"\s+content="TEMPLATE@', re.I),
        "its instrument:idea meta still reads TEMPLATE",
    ),
]

# Strings shaped like a live credential, from gitleaks' default rules
# (config/gitleaks.toml): its pattern for each, where group 1 (when there is
# one) is the secret, and the Shannon entropy the secret has to exceed. A
# pattern that gitleaks ends with quotes, whitespace or a semicolon also ends
# at < and &, the edges of a value in HTML. share.mjs holds the same table.
END = r"""(?:[\x60'"\t\n\f\r ;<&]|\\[nr]|$)"""
SECRETS = [
    (kind, re.compile(pattern, re.ASCII | flags), entropy)
    for kind, pattern, flags, entropy in [
        ("an AWS access key ID", r"\b((?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16})\b", 0, 3),
        ("a GitHub token", r"gh[pousr]_[0-9a-zA-Z]{36}", 0, 3),
        ("a GitHub token", r"github_pat_\w{82}", 0, 3),
        ("a GitLab token", r"glpat-[\w-]{20}", 0, 3),
        ("a Slack token", r"xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*", 0, 3),
        ("a Slack token", r"xox[pe](?:-[0-9]{10,13}){3}-[a-zA-Z0-9-]{28,34}", 0, 2),
        ("a Slack token", r"xapp-\d-[A-Z0-9]+-\d+-[a-z0-9]+", re.I, 2),
        ("a Slack token", r"xoxe.xox[bp]-\d-[A-Z0-9]{163,166}", re.I, 2),
        ("a Slack token", r"xoxe-\d-[A-Z0-9]{146}", re.I, 2),
        ("a Slack token", r"xoxb-[0-9]{8,14}-[a-zA-Z0-9]{18,26}", 0, 2),
        ("a Slack token", r"xox[os]-\d+-\d+-\d+-[a-fA-F\d]+", 0, 2),
        ("a Slack token", r"xox[ar]-(?:\d-)?[0-9a-zA-Z]{8,48}", 0, 2),
        (
            "a Slack webhook URL",
            r"(?:https?://)?hooks.slack.com/(?:services|workflows|triggers)/[A-Za-z0-9+/]{43,56}",
            0,
            0,
        ),
        (
            "an OpenAI API key",
            r"\b(sk-(?:proj|svcacct|admin)-(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})\b|sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20})"
            + END,
            0,
            3,
        ),
        ("an Anthropic API key", r"\b(sk-ant-(?:api03|admin01)-[a-zA-Z0-9_\-]{93}AA)" + END, 0, 0),
        ("a Stripe live key", r"\b((?:sk|rk)_live_[a-zA-Z0-9]{10,99})" + END, 0, 2),
        ("a Google API key", r"\b(AIza[\w-]{35})" + END, 0, 4),
        ("an npm token", r"\b(npm_[a-z0-9]{36})" + END, re.I, 2),
        (
            "a private key",
            r"-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----[\s\S-]{64,}?KEY(?: BLOCK)?-----",
            re.I,
            0,
        ),
    ]
]

# What a masked secret keeps: the prefix that names its kind.
HEAD = re.compile(
    r"(?:(?:https?://)?hooks\.slack\.com/\w+/|sk-ant-(?:api03|admin01)-|sk-(?:proj|svcacct|admin)-|[sr]k_live_|github_pat_|glpat-|xoxe.xox[bp]-|xox.-|xapp-|gh[pousr]_|npm_|sk-|.{4})",
    re.ASCII | re.I,
)


def mask(secret: str) -> str:
    begin = re.match(r"-----BEGIN[^\n]*?-----", secret)
    if begin:
        return f"{begin[0]}..."
    head = HEAD.match(secret)
    return f"{head[0] if head else ''}...{secret[-4:]}"


def entropy_of(text: str) -> float:
    """Bits per character, as gitleaks measures it."""
    counts: dict[str, int] = {}
    for char in text:
        counts[char] = counts.get(char, 0) + 1
    bits = 0.0
    for count in counts.values():
        share = count / len(text)
        bits -= share * math.log2(share)
    return bits


def is_sample(secret: str) -> bool:
    """A sample from documentation or a masked value, rather than a key: AWS's
    documented keys end in EXAMPLE, gitleaks skips the alphabet run, and a run
    of x or 0 or an ellipsis is a value someone blanked out."""
    return bool(
        re.search("example", secret, re.I)
        or "abcdefghijklmnopqrstuvwxyz" in secret.lower()
        or re.search(r"x{6}|X{6}|0{6}|\.\.\.|…", secret)
    )


def find_secrets(text: str) -> list[dict]:
    """Every string in text shaped like a live credential, by line, masked."""
    found = []
    for kind, pattern, entropy in SECRETS:
        for match in pattern.finditer(text):
            secret = match[1] if pattern.groups else match[0]
            if entropy and entropy_of(secret) <= entropy:
                continue
            if is_sample(secret):
                continue
            found.append((match.start(), match.end(), kind, secret))
    found.sort(key=lambda hit: (hit[0], -hit[1]))
    hits = []
    reached = 0
    for start, end, kind, secret in found:
        if start < reached:
            continue
        reached = end
        hits.append({"kind": kind, "line": text.count("\n", 0, start) + 1, "masked": mask(secret)})
    return hits


class ShareError(Exception):
    pass


def sidecar_path(page: Path) -> Path:
    return page.with_name(page.stem + ".share.json")


def read_sidecar(page: Path) -> dict:
    try:
        parsed = json.loads(sidecar_path(page).read_text("utf-8"))
    except (OSError, ValueError):
        parsed = {}
    return {"page": page.name, "links": [], **parsed}


def write_sidecar(page: Path, sidecar: dict) -> None:
    path = sidecar_path(page)
    if not sidecar["links"]:
        try:
            path.unlink()
        except OSError:
            pass
        return
    path.write_text(json.dumps(sidecar, indent=2) + "\n", "utf-8")


def day(iso) -> str:
    return iso[:10] if iso else "an unknown day"


def request(method: str, url: str, body: bytes | None = None, headers: dict | None = None):
    """Status and decoded JSON body (None when there is none), 4xx included."""
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as response:
            raw = response.read()
            return response.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            return error.code, json.loads(raw) if raw else None
        except ValueError:
            return error.code, {"error": raw.decode("utf-8", "replace")}


def token_in(url: str | None) -> str:
    """The link token in a page's address: the share host names a page's link
    only to someone who shows it. A link published before links had tokens has
    none, and is looked up by its id alone."""
    if not url:
        return ""
    segments = urllib.parse.urlsplit(url).path.split("/")
    return next((s for s in segments if re.fullmatch(r"[a-z2-7]{16}", s)), "")


def lookup(page_id: str, url: str | None = None):
    token = token_in(url)
    query = f"?token={token}" if token else ""
    status, answer = request("GET", f"{ENDPOINT}/{page_id}{query}")
    if status == 404:
        return None
    if status >= 400:
        raise ShareError(f"lookup answered {status}")
    return answer


def publish(page: Path, allow_secrets: bool = False) -> str:
    data = page.read_bytes()
    head = data[:8192].decode("utf-8", "replace")
    if not re.match(r"\s*<!doctype html", head, re.I):
        raise ShareError(
            f"{page} does not open with <!doctype html>, which the share host requires"
        )
    for pattern, why in PLACEHOLDERS:
        if pattern.search(head):
            raise ShareError(f"{page} is not finished: {why}. Publishing would make it public.")
    secrets = [] if allow_secrets else find_secrets(data.decode("utf-8", "replace"))
    if secrets:
        raise ShareError(
            "\n".join(
                [
                    f"{page} was not published: it holds what looks like a secret, and anyone with the link could read it.",
                    *(f"  line {s['line']}: {s['kind']}, {s['masked']}" for s in secrets),
                    "Replace each with a placeholder or masked text and run again. If none is a working secret, run again with --allow-secrets.",
                ]
            )
        )

    status, answer = request("POST", ENDPOINT, data, {"content-type": "text/html"})
    # Size is left to the host, which counts what it refuses.
    if status == 413:
        raise ShareError(
            f"the share host refused {page} as too large: it is {len(data) / 1024 / 1024:.1f} MB and the host takes up to 8 MB. Check its images for bytes the box they render in never shows."
        )
    if status == 415:
        raise ShareError("the share host refused the page as not HTML")
    if status == 429:
        raise ShareError("the share host is rate limiting this address; wait a minute and try again")
    if status >= 400 or not answer:
        raise ShareError(f"the share host answered {status}: {json.dumps(answer)}")
    is_new = status == 201

    sidecar = read_sidecar(page)
    known = next((link for link in sidecar["links"] if link["id"] == answer["id"]), None)
    try:
        found = lookup(answer["id"], answer.get("url"))
    except ShareError:
        found = None
    entry = {
        "id": answer["id"],
        "url": answer["url"],
        "published": (known or {}).get("published")
        or datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "expires": (found or {}).get("expires") or (known or {}).get("expires"),
        "bytes": answer.get("bytes"),
    }
    token = (known or {}).get("deleteToken") or answer.get("deleteToken")
    if token:
        entry["deleteToken"] = token
    others = [link for link in sidecar["links"] if link["id"] != answer["id"]]
    sidecar["links"] = [entry, *others]
    write_sidecar(page, sidecar)

    lines = [answer["url"]]
    if is_new:
        lines.append(
            f"Published. Anyone with the link can read it; it expires {day(entry['expires'])}. The delete token is in {sidecar_path(page)}."
        )
    elif token:
        lines.append(f"Already published, unchanged; it expires {day(entry['expires'])}.")
    else:
        lines.append(
            f"Already published, by someone else or from the page's own Share button, so no delete token was issued here; it expires {day(entry['expires'])}."
        )
    for old in others:
        lines.append(
            f"An earlier version is still up at {old['url']} until {day(old.get('expires'))}; --delete {old['id']} takes it down."
        )
    return "\n".join(lines)


def check(page: Path, page_id: str | None = None) -> str:
    sidecar = read_sidecar(page)
    target = page_id or (sidecar["links"][0]["id"] if sidecar["links"] else None)
    if not target:
        return f"{page} has never been published from here."
    known = next((link for link in sidecar["links"] if link["id"] == target), None)
    found = lookup(target, known.get("url") if known else None)
    if not found:
        sidecar["links"] = [link for link in sidecar["links"] if link["id"] != target]
        write_sidecar(page, sidecar)
        return f"The link for {target} is gone: expired or deleted."
    return f"{found['url']}\nUp until {day(found.get('expires'))}."


def remove(page: Path, page_id: str | None = None) -> str:
    sidecar = read_sidecar(page)
    if page_id:
        target = next((link for link in sidecar["links"] if link["id"] == page_id), None)
    else:
        target = sidecar["links"][0] if sidecar["links"] else None
    if not target:
        raise ShareError(
            f"{sidecar_path(page)} holds no link with id {page_id}"
            if page_id
            else f"{page} has never been published from here, so there is nothing to delete"
        )
    if not target.get("deleteToken"):
        raise ShareError(
            f"no delete token for {target['url']}: it was published from somewhere else, and only the publisher can take it down. It expires {day(target.get('expires'))}."
        )
    status, _ = request(
        "DELETE", f"{ENDPOINT}/{target['id']}", headers={"x-delete-token": target["deleteToken"]}
    )
    if status == 403:
        raise ShareError("the share host refused the delete token")
    if status >= 400 and status != 404:
        raise ShareError(f"the share host answered {status}")
    sidecar["links"] = [link for link in sidecar["links"] if link["id"] != target["id"]]
    write_sidecar(page, sidecar)
    if status == 404:
        return f"{target['url']} was already gone."
    return f"Deleted {target['url']}. The link now answers 404."


def main(argv: list[str]) -> int:
    page, flag, page_id = (argv + [None, None, None])[:3]
    if not page or (flag and flag not in ("--allow-secrets", "--check", "--delete")):
        print(
            "usage: python share.py <page.html> [--allow-secrets | --check | --delete [id]]",
            file=sys.stderr,
        )
        return 2
    try:
        if flag == "--check":
            print(check(Path(page), page_id))
        elif flag == "--delete":
            print(remove(Path(page), page_id))
        else:
            print(publish(Path(page), allow_secrets=flag == "--allow-secrets"))
    except ShareError as error:
        print(error, file=sys.stderr)
        return 1
    except OSError as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
