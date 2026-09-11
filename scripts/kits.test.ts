import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  panel,
  label,
} from "../skills/create-page/templates/storyboard/scripts/panels.mjs";

const PANELS_DIR = join(
  import.meta.dirname,
  "../skills/create-page/templates/storyboard/scripts",
);

function python(code: string): string {
  return execFileSync("python3", ["-c", code], {
    cwd: PANELS_DIR,
    encoding: "utf-8",
  }).trim();
}

describe("storyboard panels kit", () => {
  // A label is prose, and prose has quotes in it. Inside aria-label a bare one
  // ends the attribute, so the rest of the sentence becomes markup.
  it("escapes a quoted label inside aria-label", () => {
    expect(
      panel([label(10, 10, 'say "hi" & <go>')], {
        label: 'A "quoted" & <label>',
      }),
    ).toMatchInlineSnapshot(
      `"<svg viewBox="0 0 400 300" class="block w-full" role="img" aria-label="A &quot;quoted&quot; &amp; &lt;label>"><text x="10" y="10" text-anchor="middle" font-size="13" fill="var(--color-gray-400)" font-weight="400" style="font-family:inherit">say &quot;hi&quot; &amp; &lt;go></text></svg>"`,
    );
  });

  // The two files promise the same calls and the same output, so a fix that
  // lands in one and not the other is a page that differs by which language
  // the agent happened to pick.
  it("draws the same escaped label from Python", () => {
    expect(
      python(
        `from panels import panel, label; print(panel([label(10, 10, 'say "hi" & <go>')], label='A "quoted" & <label>'))`,
      ),
    ).toBe(
      panel([label(10, 10, 'say "hi" & <go>')], {
        label: 'A "quoted" & <label>',
      }),
    );
  });

  it("draws the same sample from either language", () => {
    const node = execFileSync("node", ["panels.mjs"], {
      cwd: PANELS_DIR,
      encoding: "utf-8",
    }).trim();
    expect(
      python("import runpy; runpy.run_path('panels.py', run_name='__main__')"),
    ).toBe(node);
  });
});
