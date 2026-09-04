# Product variants and galleries

Reading a product's variants is where a browser run most often produces output that looks complete and is not: the same gallery, captured several times over, reported as several variants.

Selecting a color, size, or thumbnail usually swaps the gallery through a script or network fetch, not by mutating `img.src` on click. Confirm the change before reading, and capture each variant before moving to the next.

- If the same asset URLs repeat across every variant, you are reading a stale gallery, not proof the variants share images. Selection often changes a URL parameter (`?color=`, `?variant=`); open that per-variant URL directly, or read the variation endpoint from `network requests`, instead of clicking swatches.
- After selecting a variant, wait for the specific image to change with `wait --fn` on the `src` rather than a fixed sleep or a network wait, then extract that variant's URLs.
- Handle one variant fully, then the next. Do not click through every variant and screenshot afterward -- every capture then shows only the final state. Distinct variants that yield byte-identical outputs are a bug, not a result.
- Consent, newsletter, and region overlays (OneTrust, marketing popups) intercept clicks. Dismiss the overlay via its own button, then re-snapshot; refs shift once it closes.
