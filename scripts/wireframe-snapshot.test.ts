import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  addSnapshots,
  readSnapshot,
  readStore,
  writeInto,
} from "../skills/wireframe/add-snapshot.mjs";

const WIREFRAME = join(import.meta.dirname, "../skills/wireframe");
const run = promisify(execFile);

const SHEET = `.btn{color:red}${" ".repeat(2000)}`;
const doc = (body: string, sheet = SHEET) =>
  `<!doctype html><html><head><meta name="wireframe-snapshot" content="390x844" data-url="https://example.com/a"><style>${sheet}</style><style>.small{}</style></head><body>${body}</body></html>`;

describe("readSnapshot", () => {
  it("reads snapshot.js's printed object, and takes its fields over the meta", () => {
    const s = readSnapshot(
      JSON.stringify({
        url: "https://example.com/b",
        title: "B",
        w: 1280,
        h: 800,
        bg: "rgb(1, 2, 3)",
        notes: ["kept 3"],
        html: doc(""),
      }),
    );
    expect({ ...s, html: s.html.length > 0 }).toMatchInlineSnapshot(`
      {
        "bg": "rgb(1, 2, 3)",
        "h": 800,
        "html": true,
        "notes": [
          "kept 3",
        ],
        "title": "B",
        "url": "https://example.com/b",
        "w": 1280,
      }
    `);
  });

  it.each([
    ["the HTML alone", doc("")],
    ["the HTML as a JSON string", JSON.stringify(doc(""))],
  ])("reads %s, with its size and address from the meta", (_, text) => {
    const s = readSnapshot(text);
    expect([s.w, s.h, s.url]).toEqual([390, 844, "https://example.com/a"]);
  });

  it("refuses what isn't a snapshot", () => {
    expect(() => readSnapshot('{"result":"ok"}')).toThrow(/not a snapshot/);
  });
});

describe("addSnapshots", () => {
  const a = readSnapshot(doc("<p>A</p>"));
  const b = readSnapshot(doc("<p>B</p>"));

  it("stores a large stylesheet once for every snapshot that has it, and keeps small ones inline", () => {
    const store = addSnapshots({ sheets: {}, pages: {} }, { a, b });
    expect(Object.values(store.sheets)).toEqual([SHEET]);
    const hash = Object.keys(store.sheets)[0] ?? "";
    const pages = JSON.stringify(store.pages);
    expect(pages.split(`<style data-sheet=\\"${hash}\\"></style>`)).toHaveLength(3);
    expect(pages.split("<style>.small{}</style>")).toHaveLength(3);
  });

  it("replaces a snapshot added again under its name, and drops sheets nothing uses", () => {
    const first = addSnapshots({ sheets: {}, pages: {} }, { a });
    const again = addSnapshots(first, {
      a: readSnapshot(doc("<p>A2</p>", `.x{}${" ".repeat(2000)}`)),
    });
    expect(Object.keys(again.pages)).toEqual(["a"]);
    expect(again.pages.a.html).toContain("A2");
    expect(Object.values(again.sheets)).toEqual([`.x{}${" ".repeat(2000)}`]);
  });
});

describe("writeInto", () => {
  const page =
    "<html><body><main id=rack></main>\n<!-- shell:start --><script>window.__instrumentSource = 1</script><!-- shell:end -->\n</body></html>";
  const store = addSnapshots(
    { sheets: {}, pages: {} },
    { a: readSnapshot(doc("<script>alert(1)</script></script>")) },
  );

  it("writes data no snapshot can break out of, and reads it back", () => {
    const out = writeInto(page, store, "/* runtime */");
    const data =
      /id="wireframe-snapshots">([\s\S]*?)<\/script>/.exec(out)?.[1] ?? "";
    expect(data).not.toContain("<");
    expect(readStore(out)).toEqual(store);
  });

  it("puts the data and the runtime in once however often it runs", () => {
    const twice = writeInto(
      writeInto(page, store, "/* one */"),
      store,
      "/* two */",
    );
    expect(twice.match(/id="wireframe-snapshots"/g)).toHaveLength(1);
    expect(twice.match(/id="wireframe-snapshot-frames"/g)).toHaveLength(1);
    expect(twice).toContain("/* two */");
    expect(twice.indexOf("wireframe-snapshot-frames")).toBeLessThan(
      twice.indexOf("</body>"),
    );
  });

  it("goes before the shell's last block, so a published copy carries it", () => {
    const out = writeInto(page, store, "/* runtime */");
    expect(out.indexOf("wireframe-snapshot-frames")).toBeLessThan(
      out.indexOf("__instrumentSource"),
    );
    expect(out.indexOf("wireframe-snapshots")).toBeLessThan(
      out.indexOf("__instrumentSource"),
    );
  });

  it("refuses a page without the shell's last block", () => {
    expect(() =>
      writeInto("<html><body></body></html>", store, ""),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: no shell block at the end of the page's body; is it a wireframe page from new.mjs?]`);
  });
});

describe("add-snapshot.mjs", () => {
  it("keeps a page's size flat as frames draw the same snapshots", async () => {
    const dir = mkdtempSync(join(tmpdir(), "add-snapshot-"));
    const pagePath = join(dir, "page.html");
    await run(
      "node",
      [join(WIREFRAME, "new.mjs"), pagePath, "Pricing: yearly prices"],
      { cwd: dir },
    );
    writeFileSync(
      join(dir, "pricing.json"),
      JSON.stringify(readSnapshot(doc("<h1>Pricing</h1>"))),
    );
    writeFileSync(join(dir, "plans.html"), doc("<h1>Plans</h1>"));
    const { stdout } = await run(
      "node",
      [
        join(WIREFRAME, "add-snapshot.mjs"),
        pagePath,
        join(dir, "pricing.json"),
        join(dir, "plans.html"),
      ],
      { cwd: dir },
    );
    expect(stdout).toMatch(
      /snap\("pricing"\): 390x844, \d+ KB, from https:\/\/example.com\/a; give its frames w: 390, h: 844/,
    );
    expect(stdout).toMatch(/2 snapshots, 1 shared stylesheets/);
    const store = readStore(readFileSync(pagePath, "utf8"));
    expect(Object.keys(store.pages).sort()).toEqual(["plans", "pricing"]);

    await run(
      "node",
      [join(WIREFRAME, "add-snapshot.mjs"), pagePath, "--remove", "plans"],
      { cwd: dir },
    );
    expect(
      Object.keys(readStore(readFileSync(pagePath, "utf8")).pages),
    ).toEqual(["pricing"]);
  });

  it("refuses a page without frames", async () => {
    const dir = mkdtempSync(join(tmpdir(), "add-snapshot-"));
    writeFileSync(join(dir, "page.html"), "<html><body></body></html>");
    writeFileSync(join(dir, "a.html"), doc(""));
    await expect(
      run("node", [
        join(WIREFRAME, "add-snapshot.mjs"),
        join(dir, "page.html"),
        join(dir, "a.html"),
      ]),
    ).rejects.toMatchObject({
      stdout: expect.stringContaining("make one with new.mjs first"),
    });
  });
});
