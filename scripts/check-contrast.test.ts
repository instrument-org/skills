import { describe, expect, it } from "vitest";
import { findings, readPalettes } from "./check-contrast.ts";

const SKIN = `
  --color-background: light-dark(#ffffff, #000000);
  --color-foreground: light-dark(#000000, #ffffff);
  --color-card: light-dark(#ffffff, #111111);
  --color-brand-500: #0e7869;
  --color-brand-700: light-dark(#0a4a42, #56c2b0);
  --color-muted-foreground: light-dark(#6d655f, #9a918a);
`;

const { dark, light } = readPalettes(SKIN);

function page(body: string): string {
  return `<body class="bg-background text-foreground">${body}</body>`;
}

describe("readPalettes", () => {
  it("splits a light-dark pair into the two palettes", () => {
    expect(light.get("brand-700")).toEqual([10, 74, 66]);
    expect(dark.get("brand-700")).toEqual([86, 194, 176]);
  });

  it("puts a step that holds still into both", () => {
    expect(light.get("brand-500")).toEqual(dark.get("brand-500"));
  });
});

describe("findings", () => {
  it("passes body text on the page ground in both themes", () => {
    expect(findings(page("<p>readable</p>"), light, "light")).toEqual([]);
    expect(findings(page("<p>readable</p>"), dark, "dark")).toEqual([]);
  });

  it("catches white on a step that flips to light", () => {
    const html = page('<div class="bg-foreground text-white">inverted</div>');
    expect(findings(html, light, "light")).toEqual([]);
    expect(findings(html, dark, "dark")).toMatchInlineSnapshot(`
      [
        {
          "bg": "#ffffff",
          "ink": "#ffffff",
          "need": 4.5,
          "ratio": 1,
          "text": "inverted",
          "theme": "dark",
        },
      ]
    `);
  });

  it("gives a link the skin's brand ink, and catches it on brand", () => {
    const html = page('<div class="bg-brand-500"><a href="#x">pick</a></div>');
    expect(findings(html, light, "light")).toMatchInlineSnapshot(`
      [
        {
          "bg": "#0e7869",
          "ink": "#0a4a42",
          "need": 4.5,
          "ratio": 1.8875327306980239,
          "text": "pick",
          "theme": "light",
        },
      ]
    `);
  });

  it("lets a block that supplies its own ink hand it to the link", () => {
    const html = page(
      '<div class="bg-brand-500 text-white"><a href="#x">pick</a></div>',
    );
    expect(findings(html, light, "light")).toEqual([]);
    expect(findings(html, dark, "dark")).toEqual([]);
  });

  it("holds large type to the lower ratio", () => {
    const dim = '<p class="text-muted-foreground bg-card">';
    expect(findings(page(`${dim}small</p>`), light, "light")).toEqual([]);
    expect(
      findings(
        page(`<p class="text-brand-700 bg-brand-500">on brand</p>`),
        light,
        "light",
      ),
    ).toHaveLength(1);
    expect(
      findings(
        page(`<p class="text-3xl text-brand-700 bg-brand-500">on brand</p>`),
        light,
        "light",
      ),
    ).toHaveLength(1);
  });

  it("composites an opacity modifier over what is behind it", () => {
    const html = page(
      '<div class="bg-card"><p class="text-foreground/10">faint</p></div>',
    );
    expect(findings(html, light, "light")).toHaveLength(1);
  });

  it("reads nothing out of a style or script block", () => {
    const html = page(
      "<style>p { color: #fff }</style><script>const a = 1;</script>",
    );
    expect(findings(html, light, "light")).toEqual([]);
  });
});
