---
name: color
description: "Choose, generate, and audit colors for interfaces, documents, charts, and brand systems. Use when the user wants a color palette or shade scale, needs WCAG contrast checked, is designing light or dark themes, wants accessible status or data-visualization colors, or asks whether foreground and background colors are readable. Activate for hex, RGB, HSL, OKLCH, contrast ratios, color accessibility, and color-token work."
---

# Color

Use the bundled scripts for exact pairwise contrast checks and deterministic OKLCH shade generation. Use design judgment to assign semantic roles and review the colors in their actual context.

## Choose an approach

| Need                                      | Approach                                       |
| ----------------------------------------- | ---------------------------------------------- |
| Check a known foreground/background pair  | Run `check-contrast.py`                        |
| Generate a shade scale from a brand color | Run `generate-palette.py`, then check pairs    |
| Audit an interface or screenshot          | Identify actual rendered pairs, then test each |
| Design status or chart colors             | Add labels, shapes, or patterns; simulate CVD  |
| Build theme tokens                        | Start with semantic roles, then choose colors  |

Dominant colors in a screenshot do not reveal which pixels are foreground and background. Trace the rendered CSS or inspect the exact pixels for each text, icon, border, and surface pair. Account for opacity by checking the composited foreground against its real background.

## Recipe: build semantic tokens

Generate candidates from the brand color:

```bash
python <color-skill-path>/scripts/generate-palette.py "#2563EB" --json > work/blue-palette.json
```

Assign roles from the interface requirements instead of treating shade numbers as semantics:

```css
:root {
  --surface: #ffffff;
  --text: #172554;
  --border: #bfdbfe;
  --action: #2563eb;
  --action-text: #ffffff;
}
```

Check every rendered pair, including hover, active, disabled, selected, focus, and dark-theme states:

```bash
python <color-skill-path>/scripts/check-contrast.py "#172554" "#FFFFFF"
python <color-skill-path>/scripts/check-contrast.py "#FFFFFF" "#2563EB"
python <color-skill-path>/scripts/check-contrast.py "#93C5FD" "#172554" --target ui
```

The generated scale preserves the source hue and uses OKLCH lightness steps, but gamut mapping can reduce chroma. The source color remains shade 500. The script rejects colors too close to black or white to support lighter and darker steps around that anchor. Shade labels are candidates, not guarantees about contrast or intended use.

## Recipe: audit an interface

1. Inventory semantic roles and interactive states in both themes.
2. Resolve transparency against the final surface.
3. Check normal text at 4.5:1, qualifying large text at 3:1, and meaningful UI boundaries at 3:1. Check 7:1 only when AAA is an explicit target.
4. Verify information survives grayscale and is not encoded by color alone.
5. Inspect the actual interface at ordinary and increased zoom. Contrast math does not detect tiny type, thin strokes, glare, or poor visual hierarchy.

For charts, use position, labels, line styles, markers, or patterns in addition to hue. Contrast against the canvas and perceptual separation between series are different requirements; validate both.

## Traps

- Do not infer accessibility from palette swatches. Test actual pairs.
- Do not use a shade number as proof of contrast.
- HSL lightness is not perceptually uniform. Prefer OKLCH for generated ramps.
- Disabled content that still communicates information must remain readable.
- Brand compliance does not override legibility or redundant encoding.
- A passing ratio does not prove that two chart series are distinguishable.

## Verification

- Record the tested foreground, composited background, target, ratio, and pass state.
- Recheck every state after changing a token because one token may feed several components.
- Inspect light and dark themes visually at the requested output size.
- For print or exported documents, inspect the exported artifact, not only the source application.

## Script index

Complete command options are in [`reference.md`](reference.md).

- `check-contrast.py`: Check WCAG contrast for a foreground and opaque background color.
- `generate-palette.py`: Generate an sRGB-gamut-mapped OKLCH shade scale from a hex color.
