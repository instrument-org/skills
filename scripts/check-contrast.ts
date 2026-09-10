// Reads every page the way a browser stacks it and fails the build when text
// does not clear WCAG AA against what it sits on, once for the light palette and
// once for the dark one. Run by `pnpm check:contrast` and in CI.
//
// A page follows the reader's theme, so no one can look at it in both. This is
// what looking is replaced by. It is string work start to finish: both palettes
// come out of skin/theme.css, the page is walked as tags and class attributes,
// and no browser is started.
//
// What it cannot see, and so cannot promise: a color set in a style attribute or
// by script, a gradient, text over an image, and anything a media query changes
// at another width. What it does see is where the mistakes have actually been.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { listIdeas, STARTER_PATH } from "./ideas.ts";

type Rgb = [number, number, number];
type Palette = Map<string, Rgb>;

/** AA: 4.5 for body text, 3 once the type is large enough to carry itself. */
const AA_TEXT = 4.5;
const AA_LARGE = 3;
const LARGE_PX = 24;
const LARGE_BOLD_PX = 18.66;

/** Type scale, so a heading is not held to the body-text ratio. */
const SIZES: Record<string, number> = {
  "text-xs": 12,
  "text-sm": 14,
  "text-base": 16,
  "text-lg": 18,
  "text-xl": 20,
  "text-2xl": 24,
  "text-3xl": 30,
  "text-4xl": 36,
  "text-5xl": 48,
  "text-6xl": 60,
  "text-7xl": 72,
};

const BOLD = new Set([
  "font-medium",
  "font-semibold",
  "font-bold",
  "font-black",
]);

/** The classes that mean "this block supplies the ink for everything inside it". */
const SUPPLIES_INK = new Set([
  "text-white",
  "text-background",
  "text-code-foreground",
]);

/** Elements that never open a scope, so the walk does not push a frame for them. */
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  // SVG shapes, which close themselves and hold no text these pages care about.
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "stop",
  "use",
]);

interface Frame {
  bg: Rgb;
  bold: boolean;
  ink: Rgb | null;
  size: number;
  tag: string;
  words: string[];
}

export interface Finding {
  bg: string;
  ink: string;
  need: number;
  ratio: number;
  text: string;
  theme: "dark" | "light";
}

function toRgb(hex: string): Rgb {
  const body = hex.slice(1);
  const full =
    body.length === 3
      ? [...body].map((digit) => digit + digit).join("")
      : body.slice(0, 6);
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function hexOf(rgb: Rgb): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function luminance([red, green, blue]: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

function contrast(one: Rgb, other: Rgb): number {
  const first = luminance(one);
  const second = luminance(other);
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  return (high + 0.05) / (low + 0.05);
}

/** A translucent color over what is behind it, which is what the eye judges. */
function composite(front: Rgb, back: Rgb, alpha: number): Rgb {
  const blend = (over: number, under: number) =>
    Math.round(over * alpha + under * (1 - alpha));
  return [
    blend(front[0], back[0]),
    blend(front[1], back[1]),
    blend(front[2], back[2]),
  ];
}

/**
 * Both palettes, straight out of the skin, so this can never drift from it.
 * A token is either one color or `light-dark(light, dark)`; the first form is a
 * step that holds still in both themes and lands in both palettes unchanged.
 */
export function readPalettes(css: string): { dark: Palette; light: Palette } {
  const light: Palette = new Map();
  const dark: Palette = new Map();
  const token =
    /--color-([a-z0-9-]+):\s*(light-dark\([^)]*\)|#[0-9a-f]{3,8})/gi;
  for (const [, name, value] of css.matchAll(token)) {
    if (!name || !value) continue;
    const pair =
      /light-dark\(\s*(#[0-9a-f]{3,8})\s*,\s*(#[0-9a-f]{3,8})\s*\)/i.exec(
        value,
      );
    light.set(name, toRgb(pair?.[1] ?? value));
    dark.set(name, toRgb(pair?.[2] ?? value));
  }
  return { dark, light };
}

/** What a color utility's suffix resolves to, or null when the skin has no such token. */
function resolve(
  suffix: string,
  palette: Palette,
): { alpha: number; rgb: Rgb } | null {
  const [name = "", opacity] = suffix.split("/");
  const alpha = opacity === undefined ? 1 : Number(opacity) / 100;
  if (Number.isNaN(alpha)) return null;
  if (name === "white") return { alpha, rgb: [255, 255, 255] };
  if (name === "black") return { alpha, rgb: [0, 0, 0] };
  const found = palette.get(name);
  return found ? { alpha, rgb: found } : null;
}

/**
 * Walk the body as a stack of frames, carrying the nearest background and the
 * nearest ink down into each child the way inheritance does, and measure every
 * run of text against the frame it lands in.
 */
export function findings(
  html: string,
  palette: Palette,
  theme: "dark" | "light",
): Finding[] {
  const found: Finding[] = [];
  const start = html.indexOf("<body");
  if (start === -1) return found;
  const body = html.slice(start);

  const page = palette.get("background") ?? [255, 255, 255];
  const stack: Frame[] = [
    { bg: page, bold: false, ink: null, size: 16, tag: "root", words: [] },
  ];
  // One report per distinct run: a table of forty cells in one bad color is one
  // thing to fix, not forty lines of output.
  const reported = new Set<string>();

  const pattern =
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>|([^<]+)/g;
  let skipping: string | null = null;

  for (const match of body.matchAll(pattern)) {
    const [whole, closing, rawTag, attributes, selfClosing, text] = match;
    if (whole.startsWith("<!--")) continue;
    const tag = rawTag?.toLowerCase();

    // Script and style hold source, not prose.
    if (skipping) {
      if (closing && tag === skipping) skipping = null;
      continue;
    }

    if (text !== undefined) {
      const top = stack.at(-1);
      const content = text.replace(/&[a-z]+;|&#\d+;/gi, "x").trim();
      if (!content || !top?.ink) continue;
      const large =
        top.size >= LARGE_PX || (top.size >= LARGE_BOLD_PX && top.bold);
      const need = large ? AA_LARGE : AA_TEXT;
      const ratio = contrast(top.ink, top.bg);
      if (ratio >= need) continue;
      const key = `${hexOf(top.ink)}|${hexOf(top.bg)}|${content.slice(0, 32)}`;
      if (reported.has(key)) continue;
      reported.add(key);
      found.push({
        bg: hexOf(top.bg),
        ink: hexOf(top.ink),
        need,
        ratio,
        text: content.replace(/\s+/g, " ").slice(0, 52),
        theme,
      });
      continue;
    }

    // Every branch below is about an element, so the tag has to exist.
    if (!tag) continue;

    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index]?.tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    if (tag === "script" || tag === "style") {
      if (!selfClosing) skipping = tag;
      continue;
    }

    const parent = stack.at(-1)!;
    const words = (/class="([^"]*)"/.exec(attributes ?? "")?.[1] ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const frame: Frame = {
      bg: parent.bg,
      bold: parent.bold,
      ink: parent.ink,
      size: parent.size,
      tag,
      words,
    };

    for (const word of words) {
      const size = SIZES[word];
      if (size !== undefined) frame.size = size;
      if (BOLD.has(word)) frame.bold = true;
      if (word.startsWith("bg-")) {
        const color = resolve(word.slice(3), palette);
        if (color) {
          frame.bg =
            color.alpha === 1
              ? color.rgb
              : composite(color.rgb, parent.bg, color.alpha);
        }
      }
      if (word.startsWith("text-")) {
        const color = resolve(word.slice(5), palette);
        if (color) {
          frame.ink =
            color.alpha === 1
              ? color.rgb
              : composite(color.rgb, frame.bg, color.alpha);
        }
      }
    }

    // The skin paints every link brand ink, except inside a block that already
    // supplies its own, where the link takes the block's.
    const setsOwnInk = words.some(
      (word) => word.startsWith("text-") && resolve(word.slice(5), palette),
    );
    if (tag === "a" && !setsOwnInk) {
      const supplied = stack.some((above) =>
        above.words.some((word) => SUPPLIES_INK.has(word)),
      );
      frame.ink = supplied ? parent.ink : (palette.get("brand-700") ?? null);
    }
    if (!frame.ink && (tag === "body" || tag === "main")) {
      frame.ink = palette.get("foreground") ?? null;
    }

    if (!VOID_TAGS.has(tag) && !selfClosing) stack.push(frame);
  }

  return found;
}

function main() {
  const { dark, light } = readPalettes(readFileSync("skin/theme.css", "utf-8"));
  const pages = [
    { label: "starter.html", path: STARTER_PATH },
    ...listIdeas().flatMap((idea) =>
      idea.examples.map((example) => ({
        label: `${idea.name}/${example.name}`,
        path: example.htmlPath,
      })),
    ),
  ];

  let failed = false;
  for (const page of pages) {
    const html = readFileSync(page.path, "utf-8");
    const found = [
      ...findings(html, light, "light"),
      ...findings(html, dark, "dark"),
    ];
    if (found.length === 0) continue;
    failed = true;
    console.log(`❌ ${page.label}`);
    for (const one of found) {
      console.log(
        `   • ${one.theme.padEnd(5)} ${one.ratio.toFixed(2)}:1 needs ${one.need}  ${one.ink} on ${one.bg}  "${one.text}"`,
      );
    }
  }

  console.log(`${pages.length} page(s) checked in both themes`);
  if (failed) {
    console.log(
      "A step names distance from the paper, not a lightness: ink lives at 700 and above, washes at 300 and below, and white rides only the 400 to 600 middle, which holds still in both themes.",
    );
    process.exit(1);
  }
}

// Imported by its tests, so only run as a command.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
