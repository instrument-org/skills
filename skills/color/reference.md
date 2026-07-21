# Script reference

Complete command-line usage for the scripts indexed in `SKILL.md`.

## `check-contrast.py` Check WCAG contrast for a foreground and opaque background color.

```text
usage: check-contrast.py [-h] [--target {normal,large,ui,aaa}] [--json]
                         foreground background

Check WCAG contrast for a foreground/background pair.

positional arguments:
  foreground            Foreground hex color, including optional alpha
  background            Opaque background hex color

options:
  -h, --help            show this help message and exit
  --target {normal,large,ui,aaa}
                        Required contrast target (default: normal)
  --json                Print JSON output
```

## `generate-palette.py` Generate an sRGB-gamut-mapped OKLCH shade scale from a hex color.

```text
usage: generate-palette.py [-h] [--json] color

Generate an sRGB-gamut-mapped OKLCH shade scale.

positional arguments:
  color       Opaque source color in hex notation

options:
  -h, --help  show this help message and exit
  --json      Print JSON output
```
