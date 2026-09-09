import { describe, expect, it } from "vitest";
import { checkExampleMeta, checkSelfContained } from "./check-ideas.ts";
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
