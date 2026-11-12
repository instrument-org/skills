import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildReply,
  installPaths,
  resolveLinks,
} from "../scripts/open-in-instrument-link.ts";

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
        "**plan.html** · \`~/My Pages/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/plan.html)",
        "**Q3 #2 (final)+notes.pdf** · \`~/Q3 #2 (final)+notes.pdf\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Q3%20%232%20%28final%29%2Bnotes.pdf)",
        "**naïve 日本語.md** · \`~/Résumé/naïve 日本語.md\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/R%C3%A9sum%C3%A9/na%C3%AFve%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md)",
        "**50% done & 'quoted'!.png** · \`~/50% done & 'quoted'!.png\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/50%25%20done%20%26%20%27quoted%27%21.png)",
        "**My Pages** · \`~/My Pages/\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/)",
        "**My Pages** · \`~/My Pages/\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/My%20Pages/)",
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
        "**comparison.html** · \`~/Projects/pricing/out/comparison.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/out/comparison.html)",
        "**pricing.html** · \`~/visual-answers/pricing.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/visual-answers/pricing.html)",
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
      `"**Pricing \\*tiers\\* \\[draft\\]** · \`~/Projects/pricing/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/pricing/plan.html)"`,
    );
  });

  it("fences a path holding a backtick", () => {
    const { markdown } = buildReply({
      ...mac,
      paths: ["/Users/sam/a`b.md"],
      stat: fakeFs({ "/Users/sam/a`b.md": "file" }),
    });
    expect(markdown).toMatchInlineSnapshot(
      `"**a\\\`b.md** · \`\` ~/a\`b.md \`\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/a%60b.md)"`,
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
        "**report.pdf** · \`~\\report.pdf\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/report.pdf)",
        "**report (v2).pdf** · \`~\\My Docs\\report (v2).pdf\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/My%20Docs/report%20%28v2%29.pdf)",
        "**plan.md** · \`~\\Projects\\Notes\\plan.md\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/Projects/Notes/plan.md)",
        "**Pages** · \`~\\Desktop\\Pages\\\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/Desktop/Pages/)",
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

      - \`~/Projects/emails/welcome.html\`
      - \`~/Projects/emails/day 3 (follow-up).md\`
      - \`~/Projects/emails/images/\`"
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

      - \`~\\a b.pdf\`
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

      - \`~/gone.html\`
      - \`/tmp/scratch/page.html\`"
    `);
  });
});

describe("app links", () => {
  it("links straight into the app, one output or a bundle, on both systems", () => {
    const stat = fakeFs({
      "/Users/sam/My Pages/plan (v2).html": "file",
      "/Users/sam/My Pages": "folder",
      "C:\\Users\\Sam\\My Docs\\report (v2).pdf": "file",
      "\\\\nas\\share\\deck.pdf": "file",
      "D:\\c+d.png": "file",
    });
    const cases = [
      [mac, ["/Users/sam/My Pages/plan (v2).html"], undefined],
      [mac, ["/Users/sam/My Pages"], undefined],
      [windows, ["C:\\Users\\Sam\\My Docs\\report (v2).pdf"], undefined],
      [windows, ["\\\\nas\\share\\deck.pdf"], undefined],
      [
        mac,
        ["/Users/sam/My Pages/plan (v2).html", "/Users/sam/My Pages"],
        "Pages & plan",
      ],
      [
        windows,
        ["C:\\Users\\Sam\\My Docs\\report (v2).pdf", "D:\\c+d.png"],
        "Q3 review",
      ],
    ] as const;
    expect(
      cases.map(
        ([system, paths, title]) =>
          buildReply({
            ...system,
            paths,
            title,
            from: "Codex",
            links: "app",
            stat,
          }).markdown,
      ),
    ).toMatchInlineSnapshot(`
      [
        "**plan (v2).html** · \`~/My Pages/plan (v2).html\` · [Open in Instrument](instrument://file/~/My%20Pages/plan%20%28v2%29.html)",
        "**My Pages** · \`~/My Pages/\` · [Open in Instrument](instrument://file/~/My%20Pages/)",
        "**report (v2).pdf** · \`~\\My Docs\\report (v2).pdf\` · [Open in Instrument](instrument://file/~/My%20Docs/report%20%28v2%29.pdf)",
        "**deck.pdf** · \`\\\\nas\\share\\deck.pdf\` · [Open in Instrument](instrument://file//nas/share/deck.pdf)",
        "**Pages & plan** · 2 files · [Open in Instrument](instrument://files?path=~%2FMy%20Pages%2Fplan%20%28v2%29.html&path=~%2FMy%20Pages%2F)

      - \`~/My Pages/plan (v2).html\`
      - \`~/My Pages/\`",
        "**Q3 review** · 2 files · [Open in Instrument](instrument://files?path=~%2FMy%20Docs%2Freport%20%28v2%29.pdf&path=%2FD%3A%2Fc%2Bd.png)

      - \`~\\My Docs\\report (v2).pdf\`
      - \`D:\\c+d.png\`",
      ]
    `);
  });
});

describe("the home folder shows as ~", () => {
  it("shortens what is shown and keeps the link absolute", () => {
    const stat = fakeFs({
      "/Users/sam/Projects/plan.html": "file",
      "/home/sam/Projects/plan.html": "file",
      "C:\\Users\\Sam\\Projects\\plan.html": "file",
      "C:\\users\\sam\\Projects\\plan.html": "file",
      "/Users/sam": "folder",
      "/Users/samantha/plan.html": "file",
      "/opt/pages/plan.html": "file",
    });
    const linux = { ...mac, home: "/home/sam", cwd: "/home/sam" };
    const cases = [
      [mac, "/Users/sam/Projects/plan.html"],
      [linux, "/home/sam/Projects/plan.html"],
      [windows, "C:\\Users\\Sam\\Projects\\plan.html"],
      [windows, "c:\\users\\sam\\Projects\\plan.html"],
      [mac, "/Users/sam"],
      [mac, "/Users/samantha/plan.html"],
      [mac, "/opt/pages/plan.html"],
    ] as const;
    expect(
      cases.flatMap(([system, input]) =>
        (["web", "app"] as const).map(
          (links) =>
            buildReply({ ...system, paths: [input], stat, links }).markdown,
        ),
      ),
    ).toMatchInlineSnapshot(`
      [
        "**plan.html** · \`~/Projects/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/Projects/plan.html)",
        "**plan.html** · \`~/Projects/plan.html\` · [Open in Instrument](instrument://file/~/Projects/plan.html)",
        "**plan.html** · \`~/Projects/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/home/sam/Projects/plan.html)",
        "**plan.html** · \`~/Projects/plan.html\` · [Open in Instrument](instrument://file/~/Projects/plan.html)",
        "**plan.html** · \`~\\Projects\\plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/C:/Users/Sam/Projects/plan.html)",
        "**plan.html** · \`~\\Projects\\plan.html\` · [Open in Instrument](instrument://file/~/Projects/plan.html)",
        "**plan.html** · \`~\\Projects\\plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/C:/users/sam/Projects/plan.html)",
        "**plan.html** · \`~\\Projects\\plan.html\` · [Open in Instrument](instrument://file/~/Projects/plan.html)",
        "**sam** · \`~/\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/)",
        "**sam** · \`~/\` · [Open in Instrument](instrument://file/~/)",
        "**plan.html** · \`/Users/samantha/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/samantha/plan.html)",
        "**plan.html** · \`/Users/samantha/plan.html\` · [Open in Instrument](instrument://file/Users/samantha/plan.html)",
        "**plan.html** · \`/opt/pages/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/opt/pages/plan.html)",
        "**plan.html** · \`/opt/pages/plan.html\` · [Open in Instrument](instrument://file/opt/pages/plan.html)",
      ]
    `);
  });
});

describe("where links go", () => {
  const none = {
    env: {},
    exists: () => false,
    listDir: () => [],
    readFile: () => "",
  };
  const found = (paths: readonly string[]) => (file: string) =>
    paths.includes(file);

  it("checks where each system's installer puts the app", () => {
    const cases = [
      ["darwin", "/Users/sam", {}],
      ["linux", "/home/sam", {}],
      [
        "win32",
        "C:\\Users\\Sam",
        {
          LOCALAPPDATA: "C:\\Users\\Sam\\AppData\\Local",
          ProgramFiles: "C:\\Program Files",
        },
      ],
      ["win32", "C:\\Users\\Sam", {}],
    ] as const;
    expect(
      cases.map(([platform, home, env]) =>
        installPaths({ platform, home, env }),
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          "/Applications/Instrument.app",
          "/Users/sam/Applications/Instrument.app",
        ],
        [
          "/opt/Instrument/instrument",
          "/usr/share/applications/instrument.desktop",
        ],
        [
          "C:\\Users\\Sam\\AppData\\Local\\Programs\\Instrument\\Instrument.exe",
          "C:\\Program Files\\Instrument\\Instrument.exe",
        ],
        [
          "C:\\Users\\Sam\\AppData\\Local\\Programs\\Instrument\\Instrument.exe",
          "C:\\Program Files\\Instrument\\Instrument.exe",
        ],
      ]
    `);
  });

  it.each([
    ["darwin", "/Users/sam", "/Applications/Instrument.app"],
    ["darwin", "/Users/sam", "/Users/sam/Applications/Instrument.app"],
    ["linux", "/home/sam", "/opt/Instrument/instrument"],
    ["linux", "/home/sam", "/usr/share/applications/instrument.desktop"],
    [
      "win32",
      "C:\\Users\\Sam",
      "C:\\Users\\Sam\\AppData\\Local\\Programs\\Instrument\\Instrument.exe",
    ],
    [
      "win32",
      "C:\\Users\\Sam",
      "C:\\Program Files\\Instrument\\Instrument.exe",
    ],
  ] as const)(
    "links into the app on %s when %s exists",
    (platform, home, file) => {
      expect(
        resolveLinks({ ...none, platform, home, exists: found([file]) }),
      ).toEqual({ links: "app" });
    },
  );

  it.each([
    ["darwin", "/Users/sam"],
    ["linux", "/home/sam"],
    ["win32", "C:\\Users\\Sam"],
  ] as const)(
    "links through the website on %s when nothing is found",
    (platform, home) => {
      expect(resolveLinks({ ...none, platform, home })).toEqual({
        links: "web",
      });
    },
  );

  it("finds an AppImage by the desktop entry that claims the scheme, and not a preview's", () => {
    const dir = "/home/sam/.local/share/applications";
    const entries: Record<string, string> = {
      [`${dir}/appimagekit_1a2b-Instrument.desktop`]:
        "[Desktop Entry]\nName=Instrument\nExec=/home/sam/Apps/Instrument.AppImage %U\nMimeType=x-scheme-handler/instrument;\n",
      [`${dir}/appimagekit_3c4d-Instrument_Preview.desktop`]:
        "[Desktop Entry]\nName=Instrument Preview (night)\nMimeType=x-scheme-handler/instrument-preview-night;\n",
      [`${dir}/notes.txt`]: "x-scheme-handler/instrument",
    };
    const read = (file: string) => {
      const content = entries[file];
      if (content === undefined) throw new Error(`ENOENT: ${file}`);
      return content;
    };
    const names =
      (...keys: string[]) =>
      () =>
        keys.map((key) => path.posix.basename(key));
    const linux = { ...none, platform: "linux", home: "/home/sam" } as const;
    expect([
      resolveLinks({
        ...linux,
        listDir: names(...Object.keys(entries)),
        readFile: read,
      }),
      resolveLinks({
        ...linux,
        listDir: names(
          `${dir}/appimagekit_3c4d-Instrument_Preview.desktop`,
          `${dir}/notes.txt`,
        ),
        readFile: read,
      }),
      resolveLinks({
        ...linux,
        listDir: () => {
          throw new Error("ENOENT");
        },
        readFile: read,
      }),
    ]).toEqual([{ links: "app" }, { links: "web" }, { links: "web" }]);
  });

  it.each([
    ["web", true, "web"],
    ["app", false, "app"],
    [" APP ", false, "app"],
    [" ", true, "app"],
    [undefined, true, "app"],
  ] as const)(
    "--links %s overrides detection (installed: %s)",
    (flag, installed, links) => {
      expect(
        resolveLinks({
          ...none,
          flag,
          platform: "darwin",
          home: "/Users/sam",
          exists: () => installed,
        }),
      ).toEqual({ links });
    },
  );

  it("falls back to the website and warns on a --links value it does not know", () => {
    expect(
      resolveLinks({
        ...none,
        flag: "desktop",
        platform: "darwin",
        home: "/Users/sam",
        exists: () => true,
      }),
    ).toMatchInlineSnapshot(`
      {
        "links": "web",
        "warning": "--links says "desktop", which is neither app nor web, so links go through the website.",
      }
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
        [
          "plan.html",
          "missing.md",
          "--title",
          "Plan",
          "--from",
          "Codex",
          "--links",
          "web",
        ],
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

  it("runs through a symlinked skill folder, as agents reach it", () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "open-in-instrument-")),
    );
    tempDirs.push(dir);
    const link = path.join(dir, "linked-script.ts");
    fs.symlinkSync(SCRIPT, link);
    const result = spawnSync(
      process.execPath,
      [link, "/Users/sam/plan.html", "--title", "Plan"],
      { cwd: dir, encoding: "utf-8" },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[Open in Instrument](");
  });

  it("decides by itself whether this machine has the app, and takes --links over that", () => {
    const dir = os.tmpdir();
    const decided = run(["/Users/sam/plan.html"], dir);
    expect(decided.status).toBe(0);
    expect(decided.stdout).toMatch(
      /\[Open in Instrument\]\((instrument:\/\/file|https:\/\/tryinstrument\.com\/open#)\/Users\/sam\/plan\.html\)/,
    );
    const app = run(["/Users/sam/plan.html", "--links", "app"], dir);
    const web = run(["/Users/sam/plan.html", "--links", "web"], dir);
    const odd = run(["/Users/sam/plan.html", "--links", "both"], dir);
    expect([
      app.stdout,
      web.stdout,
      odd.stdout,
      odd.stderr,
    ]).toMatchInlineSnapshot(`
      [
        "**plan.html** · \`/Users/sam/plan.html\` · [Open in Instrument](instrument://file/Users/sam/plan.html)
      ",
        "**plan.html** · \`/Users/sam/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/plan.html)
      ",
        "**plan.html** · \`/Users/sam/plan.html\` · [Open in Instrument](https://tryinstrument.com/open#/Users/sam/plan.html)
      ",
        "warning: --links says "both", which is neither app nor web, so links go through the website.
      warning: /Users/sam/plan.html does not exist, so its link opens nothing. Check the path, or link the output once it is written.
      ",
      ]
    `);
  });

  it("exits 1 with usage when given no path", () => {
    const result = run([], os.tmpdir());
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage:");
  });
});
