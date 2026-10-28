# Publishing a page to a link

Every page has a Share button that publishes a copy of itself to a public link. You can use the same endpoint, so a page can reach a reader who can't open a file where they are, such as in a chat app, on a phone, or in a harness with no viewer of its own. This file explains how to do it and when.

## What a link is

A link is a byte-for-byte copy of the file at `https://<id>.instrument.page/`. Anyone with the address can read it. Nothing lists it, search engines are told to stay out, and it expires thirty days after it goes up. The id is a hash of the file's bytes, so the same file always lands at the same link, and an edited file gets a new one while the old link keeps serving the old version until it expires. Publishing creates a delete token, which you get back once and never again. The hosted copy runs sandboxed and can load only from the origins in `allowed-sources.json`, which a page already obeys, so a page that passes the offline test looks the same hosted as it does from disk. On the hosted copy, the Share button becomes a save button.

## What a hosted copy cannot do

The host serves every copy under a `sandbox` policy without `allow-same-origin`, so the page runs with an opaque origin. That means `localStorage`, `sessionStorage`, IndexedDB and `document.cookie` throw a `SecurityError` when the page touches them, and Safari also throws from `history.pushState` and `history.replaceState`. A page that wraps storage in try/catch isn't affected. A page built with a framework that reads storage or routes through the history API at startup (a Slidev deck, most single-page app builds) goes blank, with "The operation is insecure" in the console, even though the same file works from disk. Before publishing a page like that, guard those calls in a classic script at the top of `<head>` that runs before the framework: give each storage object whose access throws an in-memory stand-in, and make the history methods fall back to `location.hash` when the original throws. To see what the host will do, serve the file locally with the header `Content-Security-Policy: sandbox allow-scripts` and open it in Chrome and Safari.

The sandbox is what it costs for anonymous pages to share one domain. Each page has its own subdomain, but cookies are scoped to the registrable domain, and `instrument.page` isn't on the Public Suffix List. A page with a real origin could set cookies that every other page and the share host receive, and could install a service worker that outlives the page's deletion. Hosts such as `github.io` can give each site a real origin, storage included, because the list treats each of their subdomains as a separate site. Until this domain is on the list, hosted pages get no storage.

## When to publish

The link this skill makes is the only link a page gets. A host's own publishing tool (a claude.ai Artifact, a canvas, a gist, a document connector) isn't a way to share it, even when that tool's instructions tell you to publish work meant for a team. The host wraps the page in its own frame, blocks its scripts, fonts and Share button under its own policy, and keeps a copy the reader didn't choose and `--delete` can't reach.

- If the reader asked for a link, or to share, send or post the page, or for a version they can share, publish with the script and give them the link yourself instead of pointing them at the Share button.
- If the reader can't open a file where they are, and this environment has no preview of local files to show it in, publish, and say in one line that you did and what that means: anyone with the link can read the copy, it's gone in thirty days, and you kept the token so you can take it down.
- Otherwise, even when the reader only mentions that someone else will see it, hand over the path, show the page in this environment's preview if it has one, and offer the link in your closing line. Then stop and let them answer. A link they didn't ask for puts a copy of their work on a server they didn't choose, and someone who has just been handed a file rarely thinks to ask for one.

Don't assume the reader knows what a link like this is. Most people have never come across the idea and won't recognize "publish", "unlisted" or "expires", so describe what happens in plain words. You can put a copy of the page on the web at its own address, only someone given the address can reach it, nothing links to it and search engines are kept out, it deletes itself after thirty days, and you can take it down sooner. Say it in one sentence with one question and no jargon. "Want me to put a private copy online? It gets its own address, only people you send it to can open it, and it deletes itself in a month" covers it.

Offer the link even when the file looks like enough. This environment usually can't tell you whether the reader can open an HTML file at all, or see it whole instead of as text or a stripped-down preview, and nobody has asked them. The offer costs a sentence and settles the question.

When the environment blocks publishing, rather than the reader declining, say which host was blocked. A sandbox that allows only named hosts responds with a refusal naming `share.instrument.page`, which is a setting the reader can change but can't guess. Name it, say what the alternative costs, and let them choose, instead of quietly falling back to the host you're running on.

Don't publish a page that holds anything the reader wouldn't hand a stranger without asking first, such as their own figures, the names of private people, or anything from files they marked private. Don't publish a kit's skeleton, a page that still has a placeholder, or a page that fails its checks. Never post the link anywhere except back to the reader.

## How

```sh
node <skill>/share.mjs <slug>.html
python <skill>/share.py <slug>.html
```

These are the same script in two runtimes, with no dependencies in either, so use whichever one is available. It prints the link on its first line, then what happened. Beside the page, it writes `<slug>.share.json`, which holds the id, the link, when it went up and when it expires, and the delete token, which exists nowhere else. Keep that file with the page, since either script reads what the other wrote. Running the same command on an unchanged page reports the existing link. On an edited page, it publishes the new version and names the earlier link that still serves the old one.

```sh
node <skill>/share.mjs <slug>.html --check         # still up, and until when
node <skill>/share.mjs <slug>.html --delete        # take the newest link down
node <skill>/share.mjs <slug>.html --delete <id>   # take an earlier one down
```

After an edit, tell the reader which link is current. Delete the earlier one only once they confirm nobody still needs it, because a link they already passed on going dead is worse than a stale copy that expires on its own.

Tell the reader what you kept: the link, the fact that anyone with it can read the page, the day it expires, and that `--delete` takes it down.

## Reading a page from its link

A page that draws itself with script holds little in its bytes, and a wireframe holds almost nothing except its title until its script runs. So the link answers with something you can read, depending on what you ask for:

- If you ask for Markdown, as most fetch tools do, you get the page as it was drawn, converted to Markdown, with its address in the front matter. Every heading, caption and note is there, and pictures carried inline are left out.
- If you don't ask for it, as `curl` doesn't, you get the page as it was drawn, as HTML with every script removed. Read this version when you need the layout or the classes, since it's the page itself rather than a description of it.

```sh
curl -sSL -H 'accept: text/markdown' https://<id>.instrument.page/
curl -sSL https://<id>.instrument.page/
```

## The endpoint, for when neither runtime is there

Send `POST https://share.instrument.page/share` with `content-type: text/html` and the file as the body, from any origin. The body has to start with `<!doctype html>` and stay under 8 MB. The endpoint answers `201 {id, url, bytes, deleteToken}`, or `200 {id, url, bytes}` with no token when anyone has already published those exact bytes. `GET /share/<id>` answers `{id, url, expires}` or 404. `DELETE /share/<id>` with an `x-delete-token` header answers 204, or 403 for a wrong token, or 404 once the copy is gone. Each address can make twenty uploads a minute.

```sh
curl -sS -H 'content-type: text/html' --data-binary @<slug>.html -o <slug>.share.json https://share.instrument.page/share
```

On Windows, use `curl.exe`, because in PowerShell `curl` on its own is an alias for something else.
