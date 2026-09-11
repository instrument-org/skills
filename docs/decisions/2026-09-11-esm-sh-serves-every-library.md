# esm.sh serves every library

Status: accepted, 2026-09-11

## What

Every `create-page` page loads its framework, its icon set and any library from `https://esm.sh`, pinned to an exact version, and from nowhere else but Google Fonts and the share widget. `scripts/check-ideas.ts` holds the origin list and rejects an esm.sh URL whose package is not pinned to `major.minor.patch`. `skills/create-page/references/loading.md` says how a page loads a thing in each of the four shapes the host offers: a module import, a file as published (`?raw`), a stylesheet or asset by path, and a React component library with its React deduplicated (`?deps=`).

The offline test is unchanged: a library may add motion, precision or scale to something already on the page, and may never be the only copy of a fact.

## Why

The list before this named one host and seven package paths on it, and the seventh broke it. Excalidraw 0.18 ships as ES modules only, with React and a dozen packages as bare imports. jsDelivr's `+esm` build resolves each package's peer range on its own, so one import graph pulled React 18.2.0, 18.3.1, 19.0.0 and 19.2.5 together and died on the first hook. esm.sh's `?deps=` pins one React through the whole graph, and the same page mounted first time.

Behind that specific failure is a general one. UMD builds are going away, package by package, and a host that mirrors files cannot make a modern package loadable; a host that builds them can. Every library the templates use today loads from esm.sh in a test, and the two that only ship a global (sql.js, Leaflet) load as published with `?raw`.

Two things fell out of consolidating. One URL shape is one thing to teach an agent, where before the rule was a list of paths that had to grow by a line per library. And esm.sh answers a pinned URL with `cache-control: immutable`, which is the promise a page opened years later actually needs and which the old list never had in writing.

## Options weighed

Stay on jsDelivr and map every transitive React URL to one through an import map. It works, and it is a map of a package's internals that breaks the next time the package updates a dependency. Self-host bundles on `tryinstrument.com`. Strictly more work for the same bytes, and a build we would own for every library forever. esm.sh.

## Cost

esm.sh is one project fronted by Cloudflare, not a foundation-scale CDN, and it builds on demand: a package it cannot build fails at page-open rather than at publish. The pin and the offline test bound both. A page that fails to get its library shows what it wrote, and `?raw` is the exit for a package the builder cannot handle.

The starter changed, which rewrote all sixty-three examples and every capture, as the starter decision in `2026-09-10-the-starter-owns-what-every-page-shares.md` says it must.
