"""Publish a finished page to a public link, the same link the page's own Share
button makes, from wherever the agent is running:

    python <this file> <slug>.html            publish and print the link
    python <this file> <slug>.html --check    is the link still up, and until when
    python <this file> <slug>.html --delete   take the newest link down
    python <this file> <slug>.html --delete <id>

A link is a copy of the file at https://<id>.instrument.page/, readable by
anyone who has the address, unlisted, and gone after thirty days. The id is a
hash of the bytes, so the same file always lands at the same link and an edited
file gets a new one. Publishing mints a delete token, handed back once and never
again; this script keeps it in <slug>.share.json beside the page, which is the
only place it exists, so a later run (or a later agent) can take the link down.
Read references/sharing.md for when to publish at all.

The same commands, the same sidecar and the same words as share.mjs beside it;
take whichever runtime is here. Standard library only. INSTRUMENT_SHARE_ENDPOINT
overrides the share host, for a local or staging pages worker.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ENDPOINT = os.environ.get(
    "INSTRUMENT_SHARE_ENDPOINT", "https://share.instrument.page/share"
)

# What the share host refuses over, so the refusal is read here first.
MAX_BYTES = 8 * 1024 * 1024

# Two placeholders every page starts with; a page still carrying one is not finished.
PLACEHOLDERS = [
    (re.compile(r"<title>\s*TITLE\s*</title>", re.I), "its <title> is still the starter's TITLE"),
    (
        re.compile(r'name="instrument:idea"\s+content="TEMPLATE@', re.I),
        "its instrument:idea meta still reads TEMPLATE",
    ),
]


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


def lookup(page_id: str):
    status, answer = request("GET", f"{ENDPOINT}/{page_id}")
    if status == 404:
        return None
    if status >= 400:
        raise ShareError(f"lookup answered {status}")
    return answer


def publish(page: Path) -> str:
    data = page.read_bytes()
    if len(data) > MAX_BYTES:
        raise ShareError(
            f"{page} is {len(data) / 1024 / 1024:.1f} MB; the share host takes up to 8 MB. Check its images for bytes the box they render in never shows."
        )
    head = data[:8192].decode("utf-8", "replace")
    if not re.match(r"\s*<!doctype html", head, re.I):
        raise ShareError(
            f"{page} does not open with <!doctype html>, which the share host requires and every page from starter.html has"
        )
    for pattern, why in PLACEHOLDERS:
        if pattern.search(head):
            raise ShareError(f"{page} is not finished: {why}. Publishing would make it public.")

    status, answer = request("POST", ENDPOINT, data, {"content-type": "text/html"})
    if status == 413:
        raise ShareError("the share host refused the page as too large")
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
        found = lookup(answer["id"])
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
    found = lookup(target)
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
    if not page or (flag and flag not in ("--check", "--delete")):
        print("usage: python share.py <page.html> [--check | --delete [id]]", file=sys.stderr)
        return 2
    run = check if flag == "--check" else remove if flag == "--delete" else publish
    try:
        print(run(Path(page), page_id) if flag else run(Path(page)))
    except ShareError as error:
        print(error, file=sys.stderr)
        return 1
    except OSError as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
