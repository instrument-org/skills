# Agents publish pages the reader cannot open

Status: accepted, 2026-09-13

## What

`create-page` ships `share.mjs` beside its starter, which publishes a finished page to the same public link the page's own Share button makes, and `references/sharing.md`, which says when an agent may do that on the reader's behalf: when the reader asked for a link, or when the reader cannot open a file where they are and the harness offers no viewer. Otherwise the agent hands over the path and leaves Share to the reader. The script keeps the delete token in a `<slug>.share.json` beside the page, refuses a page still carrying the starter's placeholders, and on an edited page names the earlier link still serving the old version rather than deleting it. SKILL.md's last step points at both.

## Why

The share endpoint (`apps/pages` in `instrument-org/internal`) takes `text/html` from any origin with no credential, because the pages that call it are files on disk with no origin. That makes it callable from any agent runtime with one request, and the widget is already public, so nothing here widens what is reachable; it only tells the agent it exists.

The reason to tell it is the reader who cannot open a file. An agent in a chat surface, on a phone, or in a harness with no viewer of its own can write a page and then has no way to show it; a link is the only delivery, and a page that stops at a path is a page never opened. The widget cannot help there, since nobody is looking at the page to press it.

The reason to bound it is that publishing is outward and only half reversible. A copy sits on a server for thirty days, readable by anyone holding the address, and the token that takes it down early exists once. So the rule is by need rather than by convenience: the reader asked, or the reader has no other way to see it. In every other case the reader can press Share themselves, and a link they did not ask for is a copy of their work somewhere they did not choose.

A script rather than a documented `curl` line, because the bookkeeping is the part an agent drops: the token comes back once and is worthless in a transcript. The script writes it beside the page, where a later run or a later agent finds it, and turns the endpoint's status codes into sentences. Node only, with no Python twin: the operation is one request, so the runtime the task happens to be in does not matter, and a `.py` would make create-page a Python project under `check:skill`. It sits at the skill root beside `starter.html` rather than in a `scripts/` folder, which that checker reads as a package wanting a `package.json`; both are files the agent reaches for directly, and the root is the first thing the runtime's file listing shows. `curl` is in the reference for a runtime with no Node.

## Options weighed

- Leave step 7 as it was, "publish it and return the link" with no means. An agent reads it and either cannot act or improvises a request without keeping the token.
- Publish by default whenever the harness has no viewer, without a consent rule. Simpler, and wrong for a page built from the reader's own private material.
- Ask before every publish. Right when the content is sensitive, which the rule already says, and needless friction when the reader asked for the link in the first place.

## Cost

Two links can serve two versions of one page for up to thirty days after an edit, on purpose. The sidecar is one more file beside the output that carries a credential, low value but real: it can take down that one link and nothing else. A harness with no Node falls back to `curl` and keeps the response by hand.
