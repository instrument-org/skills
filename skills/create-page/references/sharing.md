# Publishing a page to a link

Every page carries a Share button that publishes a copy of itself to a public link. The same endpoint is open to you, so a page can reach a reader who cannot open a file from where they are: a chat surface, a phone, a harness with no viewer of its own. This is how, and when.

## What a link is

A copy of the file, byte for byte, at `https://<id>.instrument.page/`. Anyone with the address can read it; nothing lists it, search engines are told to stay out, and it expires thirty days after it went up. The id is a hash of the bytes, so the same file always lands at the same link and an edited file gets a new one, while the old one goes on serving the old version until it expires. Publishing mints a delete token, handed back once and never again. The hosted copy runs sandboxed and may load only from the origins in `allowed-sources.json`, which is what a page obeys already, so a page that passes the offline test looks the same hosted as it does from disk. Its Share button becomes a save button.

## What a hosted copy cannot do

The host serves every copy under a `sandbox` policy without `allow-same-origin`, so the page runs with an opaque origin. There, `localStorage`, `sessionStorage`, IndexedDB and `document.cookie` throw a `SecurityError` on access, and Safari also throws from `history.pushState` and `history.replaceState`. A page that wraps storage in try/catch, as [`interaction.md`](interaction.md) asks, is unaffected. A page built by a framework that reads storage or routes through the history API at startup (a Slidev deck, most single-page app builds) goes blank with "The operation is insecure" in the console, while the same file works from disk. Guard those calls before publishing such a page, in a classic script at the top of `<head>` that runs before the framework: an in-memory stand-in for each storage object whose access throws, and history methods that fall back to `location.hash` when the original throws. To see what the host will do, serve the file locally with the header `Content-Security-Policy: sandbox allow-scripts` and open it in Chrome and Safari.

The sandbox is the price of anonymous pages sharing one domain. Each page has its own subdomain, but cookies are scoped to the registrable domain, and `instrument.page` is not on the Public Suffix List: a page with a real origin could set cookies that every other page and the share host receive, and could install a service worker that outlives the page's deletion. Hosts such as `github.io` can give each site a real origin, storage included, because the list treats each of their subdomains as a site of its own. Until this domain is listed, hosted pages get no storage.

## When to publish

- The reader asked for a link, or to send the page to someone. Publish.
- The reader cannot open a file where they are, and you have no viewer of your own to show it in. Publish, and say in one line that you did and what that means: a copy anyone with the link can read, gone in thirty days, and you kept the token so you can take it down.
- Otherwise, hand over the path, open the page in whatever this environment offers, and offer the link in your closing line. Then stop and let them answer: a link they did not ask for is a copy of their work on a server they did not choose, and a reader who has just been handed a file is rarely the one to think of asking.

The offer assumes nothing. Most readers have never met the idea and will not recognize "publish", "unlisted" or "expires", so say what happens in words that carry their own meaning: that you can put a copy of the page on the web at its own address, that only someone given the address can reach it, that nothing links to it and search engines are kept out, that it deletes itself after thirty days, and that you can take it down sooner. One sentence, one question, no jargon to decode. "Want me to put a private copy online? It gets its own address, only people you send it to can open it, and it deletes itself in a month" is the whole of it.

Offer even where the file looks like enough. Whether the reader can open an HTML file at all, and see it whole rather than as text or a stripped preview, is a thing this environment usually cannot tell you and the reader has not been asked. The offer costs a sentence and settles it.

Where publishing is refused by the environment rather than by the reader, say which host was blocked. A sandbox that allows only named hosts answers with a refusal naming `share.instrument.page`, which is a setting the reader can change and cannot guess. Name it, say what the alternative costs, and let them choose rather than quietly falling back to the host you are running on.

Do not publish a page that carries something the reader would not hand a stranger without asking first: their own figures, names of private people, anything from files they marked private. Do not publish the starter, an example, or a page still carrying a placeholder or failing its checks; the script refuses the last two. Never post the link anywhere but back to the reader.

## How

```sh
node <skill>/share.mjs <slug>.html
python <skill>/share.py <slug>.html
```

The same script in two runtimes, no dependencies in either; take whichever is here. Prints the link on its first line, then what happened. Beside the page it writes `<slug>.share.json`: the id, the link, when it went up and when it expires, and the delete token, which exists nowhere else. Keep that file with the page; either script reads what the other wrote. The same command on an unchanged page reports the existing link; on an edited page it publishes the new version and names the earlier link still serving the old one.

```sh
node <skill>/share.mjs <slug>.html --check         # still up, and until when
node <skill>/share.mjs <slug>.html --delete        # take the newest link down
node <skill>/share.mjs <slug>.html --delete <id>   # take an earlier one down
```

After an edit, tell the reader which link is current. Delete the earlier one when they confirm nobody still needs it, not before: a link they already sent on that goes dead is worse than a stale copy that expires on its own.

Tell the reader what you kept: the link, that anyone holding it can read the page, the day it expires, and that `--delete` takes it down.

## The endpoint, for when neither runtime is there

`POST https://share.instrument.page/share` with `content-type: text/html` and the file as the body, from any origin. The body has to open with `<!doctype html>` and stay under 8 MB. It answers `201 {id, url, bytes, deleteToken}`, or `200 {id, url, bytes}` with no token when those bytes are already published, by anyone. `GET /share/<id>` answers `{id, url, expires}` or 404; `DELETE /share/<id>` with an `x-delete-token` header answers 204, 403 for a wrong token, 404 once gone. Twenty uploads a minute per address.

```sh
curl -sS -H 'content-type: text/html' --data-binary @<slug>.html -o <slug>.share.json https://share.instrument.page/share
```

On Windows that is `curl.exe`; in PowerShell, `curl` alone is an alias for something else.
