---
name: wireframe
description: "Generate HTML wireframes and prototypes with Tailwind CSS. Use when the user wants to create a wireframe, mockup, prototype, HTML artifact, layout sketch, or UI concept — even if they don't say 'wireframe' explicitly. Activate for requests like 'sketch a login page', 'mock up a dashboard', 'create an HTML prototype', or 'wireframe the settings screen'. Not for building full applications (use a template for that)."
---

# Wireframe

Create viewer-compatible HTML wireframes with Tailwind CSS. Use the bundled script to establish the required document shell, then edit the generated HTML freely to fit the requested interface.

## Viewer contract

Keep these elements in every wireframe:

```html
<style type="text/tailwindcss">
  @import "tailwindcss";
</style>
```

Also keep the local Tailwind `<script>` emitted by the scaffold exactly as written. It points at the copy this skill installs into the task, which lets Instrument compile Tailwind v4 without a build step or public CDN. Do not replace it with a package import, remote script, or generated CSS file.

The script is served from the task, so a wireframe only styles correctly while it lives in the task that installed the skill. If a page renders as unstyled HTML, check that request first -- a wireframe whose Tailwind never loaded has no background of its own and takes on whatever is behind it.

## Recipe: scaffold, then compose

Create the shell at the final project-relative path:

```text
tsx <wireframe-skill-path>/scripts/create-wireframe.ts --output output/wireframe.html --title "Account settings"
```

Then edit `output/wireframe.html` directly. Replace the placeholder body with semantic HTML and Tailwind utilities. This is the main creative step; the script is only a reliable scaffold.

For substantial generated markup, write it to a file and avoid shell quoting:

```text
tsx <wireframe-skill-path>/scripts/create-wireframe.ts --output output/wireframe.html --body-file work/body.html --theme-file work/theme.css --title "Dashboard"
```

`theme.css` contains declarations for the existing `@theme` block, for example:

```css
--color-brand-500: oklch(0.62 0.17 255);
--font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
```

## Composition guidance

- Establish the page hierarchy first: navigation, primary region, supporting regions, and actions.
- Use realistic labels and data so density and wrapping problems are visible.
- Include relevant empty, loading, selected, disabled, validation, and error states.
- Make the layout usable at both narrow and desktop widths with responsive utilities.
- Add small inline scripts only when interaction is part of the requested prototype. Keep state and behavior local to the HTML file.
- Prefer ordinary HTML controls and visible labels so the prototype remains understandable and accessible.

## Verify in the viewer

Open the generated HTML in Instrument's file viewer and inspect it at desktop and narrow widths. Confirm that Tailwind styles compiled, content is not clipped, controls and interaction states work, and the hierarchy matches the request. File creation alone is not verification.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

- `create-wireframe.ts`: Generate an HTML wireframe scaffold with Tailwind CSS styling
