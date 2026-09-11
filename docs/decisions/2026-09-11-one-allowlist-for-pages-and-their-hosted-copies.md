# One allowlist for pages and their hosted copies

Status: accepted, 2026-09-11

## What

`allowed-sources.json` at the registry root names every origin a page may load from and every address prefix a page's script may build at runtime, each with its reason. `scripts/check-ideas.ts` reads its allowlists from that file rather than carrying them as constants. The pages worker in `instrument-org/internal` reads the same file at deploy time and folds every origin in it into the `connect-src` of every hosted copy.

## Why

The worker's directive was typed by hand from the checker's constants, and the two drifted twice in one day. A page that fetched sql.js's wasm from the CDN worked from disk and failed on its hosted copy, because the worker had never heard of the CDN; the CDN was added to the worker by hand; and the registry moved its libraries to a different CDN the same afternoon. A rule that two lists must match is a rule someone has to remember. One file that both sides read is a rule nobody has to.

JSON rather than the checker's TypeScript, because the platform reads it from a tarball of this repo and should not have to execute this repo's code to learn a list. The reasons that were comments beside each constant are `why` fields, so the file still explains itself, and the esm.sh version pin travels as a pattern string the checker compiles.

The worker takes every origin in both lists, whichever way a page reaches it. The file does not say whether an address is fetched, loaded by a tag, or drawn as an image, and it should not have to: nothing in it is untrusted for a tag, so allowing it for a fetch enables nothing new, and a stricter mapping is exactly the judgment that just failed.

## Cost

An origin added here reaches agents the moment it merges and reaches hosted copies once the pages worker is deployed again, which its release workflow now offers by hand. The order is: change the registry, then deploy pages. The worker only ever adds origins, since a hosted copy lives thirty days and may have been published from an older registry; dropping one is an edit there by hand.
