# The starter owns what every page shares

Status: accepted, 2026-09-10

## What

`skills/create-page/starter.html` is the single source for every line a page does not choose for itself: the tab icon, the share widget, the type, the framework, the skin, the page behavior, and the link-icon script. Each sits inside a `<!-- shell:start -->` … `<!-- shell:end -->` pair. `pnpm fix:shell` copies those regions into all 48 examples, and `pnpm check:ideas` fails when one has drifted.

There are three pairs rather than one because the shared parts are not contiguous: a page may put its own CSS between the framework and the shared behavior, and several examples do. Anything outside the pairs belongs to the page.

A `<!-- shell:note … -->` comment is dropped on the way out. Those record why a line in the starter reads the way it does, which is worth having where the shell is edited and is noise in a finished page. Every other comment travels, because a few of them explain the page to whoever opens it.

## Why

Before this, the head was checked a piece at a time: the skin against `skin/theme.css`, the widget tag byte for byte, and nothing else. So a change meant to reach every page reached whichever ones someone remembered. Two had already drifted when this landed: a font URL that moved in the starter but nowhere else until a later pass caught it, and one example missing part of the shared behavior block with nothing to report it.

Byte identity rather than a normalized comparison, because nothing formats these files: HTML is exempt from oxfmt, so an exact match is achievable and is the strongest thing to hold.

The loop for any page-wide change is now: edit `starter.html`, `pnpm fix:shell`, `pnpm capture`.

## Cost

Changing the shell rewrites 48 files, which invalidates every capture, which is 48 headless screenshots that mostly look identical. That is the price of the guarantee and there is no way around it while a capture is keyed to the hash of its whole page.
