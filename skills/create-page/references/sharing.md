# Sharing a page

Every page carries a Share button, from the `tryinstrument.com/page.js` widget `page.mjs` writes into it. Sharing is the reader's to do, with that button. You never publish a page yourself: no script, no request to the share host, no link you made on their behalf. A copy online is their work on a server, and only they decide that.

When the reader asks for a link, tell them to press Share on the page, and what they will get: a copy of the file at its own address, readable by anyone they send it to, listed nowhere, kept out of search engines, and gone after thirty days. An edited page shared again gets a new address; the old one keeps serving the old version until it expires.

## What a shared copy cannot do

The host serves every copy sandboxed, with an opaque origin, and lets it load only from the hosts a page may load from already, so a page that works offline looks the same shared. Under that sandbox `localStorage`, `sessionStorage`, IndexedDB and `document.cookie` throw a `SecurityError` on access, and Safari also throws from `history.pushState` and `history.replaceState`. A page that wraps storage in try/catch is unaffected. A page built by a framework that reads storage or routes through the history API at startup (a Slidev deck, most single-page app builds) goes blank with "The operation is insecure" in the console, while the same file works from disk. Guard those calls in a classic script at the top of `<head>` that runs before the framework: an in-memory stand-in for each storage object whose access throws, and history methods that fall back to `location.hash` when the original throws.

## What not to put on a page meant to be shared

Something the reader would not hand a stranger without asking first: their own figures, names of private people, anything from files they marked private. Say so when a page carries that, so they decide before they press Share.
