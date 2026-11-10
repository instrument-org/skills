import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildReply } from "../scripts/open-in-instrument-link.ts";

const SCRIPT = fileURLToPath(
  new URL("../scripts/open-in-instrument-link.ts", import.meta.url),
);

function fakeFs(entries: Record<string, "file" | "folder">) {
  return (absolutePath: string) => entries[absolutePath];
}

const mac = {
  cwd: "/Users/sam/Projects/pricing",
  home: "/Users/sam",
  platform: "darwin",
  tempRoots: ["/tmp", "/private/var/folders"],
} as const;

const windows = {
  cwd: "C:\\Users\\Sam\\Projects",
  home: "C:\\Users\\Sam",
  platform: "win32",
  tempRoots: ["C:\\Users\\Sam\\AppData\\Local\\Temp"],
} as const;

describe("one output", () => {
  it("encodes each path segment", () => {
    const cases = [
      ["/Users/sam/My Pages/plan.html", "file"],
      ["/Users/sam/Q3 #2 (final)+notes.pdf", "file"],
      ["/Users/sam/Résumé/naïve 日本語.md", "file"],
      ["/Users/sam/50% done & 'quoted'!.png", "file"],
      ["/Users/sam/My Pages", "folder"],
      ["/Users/sam/My Pages/", "folder"],
      ["/", "folder"],
    ] as const;
    const replies = cases.map(([input, kind]) =>
      buildReply({
        ...mac,
        paths: [input],
        stat: fakeFs({ [path.posix.resolve(input)]: kind }),
      }),
    );
    expect(replies.flatMap((reply) => reply.warnings)).toEqual([]);
    expect(replies.map((reply) => reply.markdown)).toMatchInlineSnapshot(`
      [
        "**plan.html** · \`/Users/sam/My Pages/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/plan.html)",
        "**Q3 #2 (final)+notes.pdf** · \`/Users/sam/Q3 #2 (final)+notes.pdf\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Q3%20%232%20%28final%29%2Bnotes.pdf)",
        "**naïve 日本語.md** · \`/Users/sam/Résumé/naïve 日本語.md\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/R%C3%A9sum%C3%A9/na%C3%AFve%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md)",
        "**50% done & 'quoted'!.png** · \`/Users/sam/50% done & 'quoted'!.png\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/50%25%20done%20%26%20%27quoted%27%21.png)",
        "**My Pages** · \`/Users/sam/My Pages/\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/)",
        "**My Pages** · \`/Users/sam/My Pages/\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/)",
        "**/** · \`/\` · [Open in Instrument](https://tryinstrument.com/open#/)",
      ]
    `);
  });

  it("resolves a relative path and ~ against the current folder and home", () => {
    const stat = fakeFs({
      "/Users/sam/Projects/pricing/out/comparison.html": "file",
      "/Users/sam/visual-answers/pricing.html": "file",
    });
    expect(
      [
        buildReply({ ...mac, paths: ["out/comparison.html"], stat }),
        buildReply({ ...mac, paths: ["~/visual-answers/pricing.html"], stat }),
      ].map((reply) => reply.markdown),
    ).toMatchInlineSnapshot(`
      [
        "**comparison.html** · \`/Users/sam/Projects/pricing/out/comparison.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/out/comparison.html)",
        "**pricing.html** · \`/Users/sam/visual-answers/pricing.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/visual-answers/pricing.html)",
      ]
    `);
  });

  it("uses the title, escaped for Markdown, and ignores --from", () => {
    const { markdown } = buildReply({
      ...mac,
      paths: ["plan.html"],
      title: "Pricing *tiers* [draft]",
      from: "Codex",
      stat: fakeFs({ "/Users/sam/Projects/pricing/plan.html": "file" }),
    });
    expect(markdown).toMatchInlineSnapshot(
      `"**Pricing \\*tiers\\* \\[draft\\]** · \`/Users/sam/Projects/pricing/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/plan.html)"`,
    );
  });

  it("fences a path holding a backtick", () => {
    const { markdown } = buildReply({
      ...mac,
      paths: ["/Users/sam/a`b.md"],
      stat: fakeFs({ "/Users/sam/a`b.md": "file" }),
    });
    expect(markdown).toMatchInlineSnapshot(
      `"**a\\\`b.md** · \`\` /Users/sam/a\`b.md \`\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/a%60b.md)"`,
    );
  });
});

describe("Windows", () => {
  it("leads with the drive and uses forward slashes", () => {
    const cases = [
      ["C:\\Users\\Sam\\report.pdf", "C:\\Users\\Sam\\report.pdf", "file"],
      [
        "c:/Users/Sam/My Docs/report (v2).pdf",
        "C:\\Users\\Sam\\My Docs\\report (v2).pdf",
        "file",
      ],
      ["Notes\\plan.md", "C:\\Users\\Sam\\Projects\\Notes\\plan.md", "file"],
      ["~\\Desktop\\Pages", "C:\\Users\\Sam\\Desktop\\Pages", "folder"],
      ["/d/Media/clip.mp4", "D:\\Media\\clip.mp4", "file"],
      ["\\\\nas\\share\\deck.pdf", "\\\\nas\\share\\deck.pdf", "file"],
    ] as const;
    const replies = cases.map(([input, absolute, kind]) =>
      buildReply({
        ...windows,
        paths: [input],
        stat: fakeFs({ [absolute]: kind }),
      }),
    );
    expect(replies.flatMap((reply) => reply.warnings)).toEqual([]);
    expect(replies.map((reply) => reply.markdown)).toMatchInlineSnapshot(`
      [
        "**report.pdf** · \`C:\\Users\\Sam\\report.pdf\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/report.pdf)",
        "**report (v2).pdf** · \`C:\\Users\\Sam\\My Docs\\report (v2).pdf\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/My%20Docs/report%20%28v2%29.pdf)",
        "**plan.md** · \`C:\\Users\\Sam\\Projects\\Notes\\plan.md\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/Projects/Notes/plan.md)",
        "**Pages** · \`C:\\Users\\Sam\\Desktop\\Pages\\\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/Desktop/Pages/)",
        "**clip.mp4** · \`D:\\Media\\clip.mp4\` · [Open in Instrument](https://tryinstrument.com/open#/D:/Media/clip.mp4)",
        "**deck.pdf** · \`\\\\nas\\share\\deck.pdf\` · [Open in Instrument](https://tryinstrument.com/open#//nas/share/deck.pdf)",
      ]
    `);
  });

  it("warns for a path in the temporary folder, whatever its case", () => {
    const absolute = "C:\\users\\sam\\appdata\\local\\temp\\x\\page.html";
    const { warnings } = buildReply({
      ...windows,
      paths: ["c:\\users\\sam\\appdata\\local\\temp\\x\\page.html"],
      stat: fakeFs({ [absolute]: "file" }),
    });
    expect(warnings).toMatchInlineSnapshot(`
      [
        "C:\\users\\sam\\appdata\\local\\temp\\x\\page.html is in a temporary folder, which gets cleaned up, and its link stops working then. Write an output the person will want later into their project or a folder they named, and link that copy.",
      ]
    `);
  });
});

describe("several outputs", () => {
  const stat = fakeFs({
    "/Users/sam/Projects/emails/welcome.html": "file",
    "/Users/sam/Projects/emails/day 3 (follow-up).md": "file",
    "/Users/sam/Projects/emails/images": "folder",
  });

  it("prints one bundle link, keeping order and dropping repeats", () => {
    const { markdown } = buildReply({
      ...mac,
      cwd: "/Users/sam/Projects/emails",
      paths: [
        "welcome.html",
        "day 3 (follow-up).md",
        "images",
        "./welcome.html",
      ],
      title: "Onboarding emails & more",
      from: "Claude Code",
      stat,
    });
    expect(markdown).toMatchInlineSnapshot(`
      "**Onboarding emails & more** · 3 files · [Open in Instrument](https://tryinstrument.com/open#title=Onboarding%20emails%20%26%20more&from=Claude%20Code&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fwelcome.html&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fday%203%20%28follow-up%29.md&f=%2FUsers%2Fsam%2FProjects%2Femails%2Fimages%2F)

      - \`/Users/sam/Projects/emails/welcome.html\`
      - \`/Users/sam/Projects/emails/day 3 (follow-up).md\`
      - \`/Users/sam/Projects/emails/images/\`"
    `);
  });

  it("leaves out from when it is not given, and encodes Windows paths whole", () => {
    const { markdown } = buildReply({
      ...windows,
      paths: ["C:\\Users\\Sam\\a b.pdf", "D:\\c+d.png"],
      title: "Q3 review",
      stat: fakeFs({
        "C:\\Users\\Sam\\a b.pdf": "file",
        "D:\\c+d.png": "file",
      }),
    });
    expect(markdown).toMatchInlineSnapshot(`
      "**Q3 review** · 2 files · [Open in Instrument](https://tryinstrument.com/open#title=Q3%20review&f=%2FC%3A%2FUsers%2FSam%2Fa%20b.pdf&f=%2FD%3A%2Fc%2Bd.png)

      - \`C:\\Users\\Sam\\a b.pdf\`
      - \`D:\\c+d.png\`"
    `);
  });

  it("refuses several outputs without a title", () => {
    expect(() =>
      buildReply({ ...mac, paths: ["a.html", "b.html"], stat }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Several outputs need --title, naming the piece of work they belong to.]`,
    );
  });
});

describe("warnings", () => {
  it("warns for missing paths and temporary folders, and still prints the line", () => {
    const { markdown, warnings } = buildReply({
      ...mac,
      paths: ["/Users/sam/gone.html", "/tmp/scratch/page.html"],
      title: "Drafts",
      stat: fakeFs({ "/tmp/scratch/page.html": "file" }),
    });
    expect(warnings).toMatchInlineSnapshot(`
      [
        "/Users/sam/gone.html does not exist, so its link opens nothing. Check the path, or link the output once it is written.",
        "/tmp/scratch/page.html is in a temporary folder, which gets cleaned up, and its link stops working then. Write an output the person will want later into their project or a folder they named, and link that copy.",
      ]
    `);
    expect(markdown).toMatchInlineSnapshot(`
      "**Drafts** · 2 files · [Open in Instrument](https://tryinstrument.com/open#title=Drafts&f=%2FUsers%2Fsam%2Fgone.html&f=%2Ftmp%2Fscratch%2Fpage.html)

      - \`/Users/sam/gone.html\`
      - \`/tmp/scratch/page.html\`"
    `);
  });
});

describe("command", () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs)
      fs.rmSync(dir, { recursive: true, force: true });
    tempDirs.length = 0;
  });

  function run(args: string[], cwd: string) {
    const result = spawnSync(process.execPath, [SCRIPT, ...args], {
      cwd,
      encoding: "utf-8",
    });
    return {
      status: result.status,
      stdout: result.stdout
        .replaceAll(cwd, "<cwd>")
        .replaceAll(encodeURIComponent(cwd), "<cwd>"),
      stderr: result.stderr.replaceAll(cwd, "<cwd>"),
    };
  }

  it("prints the line on stdout and warnings on stderr", () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "open-in-instrument-")),
    );
    tempDirs.push(dir);
    fs.writeFileSync(path.join(dir, "plan.html"), "<p>plan</p>");
    expect(
      run(
        ["plan.html", "missing.md", "--title", "Plan", "--from", "Codex"],
        dir,
      ),
    ).toMatchInlineSnapshot(`
      {
        "status": 0,
        "stderr": "warning: <cwd>/plan.html is in a temporary folder, which gets cleaned up, and its link stops working then. Write an output the person will want later into their project or a folder they named, and link that copy.
      warning: <cwd>/missing.md does not exist, so its link opens nothing. Check the path, or link the output once it is written.
      ",
        "stdout": "**Plan** · 2 files · [Open in Instrument](https://tryinstrument.com/open#title=Plan&from=Codex&f=<cwd>%2Fplan.html&f=<cwd>%2Fmissing.md)

      - \`<cwd>/plan.html\`
      - \`<cwd>/missing.md\`
      ",
      }
    `);
  });

  it("exits 1 with usage when given no path", () => {
    const result = run([], os.tmpdir());
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage:");
  });
});
