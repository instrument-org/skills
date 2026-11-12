/**
 * Print the reply line that links outputs to Instrument: one line per output, or one link for several outputs of the same piece of work
 * @note Prints Markdown to stdout and warnings to stderr. It reads only whether each path exists and is a folder, and the person's link preference, and opens nothing.
 */
import { readFileSync, realpathSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const OPEN_URL = "https://tryinstrument.com/open#";
const APP_PROTOCOL = "instrument";
const LABEL = "Open in Instrument";
const PREFERENCE_FILE = "agent-links";

type Kind = "file" | "folder" | undefined;

/** Where a link goes: to the website's open page, or straight into the app. */
export type Links = "app" | "web";

function statKind(target: string): Kind {
  const stat = statSync(target, { throwIfNoEntry: false });
  if (!stat) return undefined;
  return stat.isDirectory() ? "folder" : "file";
}

function realpathOrSelf(target: string) {
  try {
    return realpathSync(target);
  } catch {
    return target;
  }
}

function defaultTempRoots(platform: NodeJS.Platform) {
  const roots = [tmpdir(), realpathOrSelf(tmpdir())];
  if (platform !== "win32") {
    roots.push(
      "/tmp",
      "/var/tmp",
      "/var/folders",
      "/private/tmp",
      "/private/var/tmp",
      "/private/var/folders",
    );
  }
  return roots;
}

/** encodeURIComponent, plus the characters it leaves that end a Markdown link or read as emphasis. */
function encode(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function escapeMarkdown(text: string) {
  return text.replace(/[\\`*_[\]]/g, "\\$&");
}

function inlineCode(text: string) {
  return text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``;
}

function resolveOutput(
  input: string,
  {
    cwd,
    home,
    platform,
    stat,
    tempRoots,
  }: {
    cwd: string;
    home: string;
    platform: NodeJS.Platform;
    stat: (absolutePath: string) => Kind;
    tempRoots: readonly string[];
  },
) {
  const win = platform === "win32";
  const p = win ? path.win32 : path.posix;

  let expanded = input;
  if (
    input === "~" ||
    input.startsWith("~/") ||
    (win && input.startsWith("~\\"))
  ) {
    expanded = home + input.slice(1);
  }
  // A Git Bash path such as /c/Users/Sam reaches Node unconverted when quoted oddly.
  const msys = win ? /^\/([A-Za-z])(\/|$)/.exec(expanded) : null;
  if (msys) expanded = `${msys[1]}:/${expanded.slice(3)}`;

  let absolute = p.resolve(cwd, expanded);
  const drive = win ? /^([A-Za-z]):/.exec(absolute) : null;
  if (drive) absolute = drive[1]!.toUpperCase() + absolute.slice(1);

  const kind = stat(absolute);
  const full =
    kind === "folder" && !absolute.endsWith(p.sep)
      ? absolute + p.sep
      : absolute;

  // What the reply shows: the path from the home folder as ~ when it is under it.
  const homeRoot = home.endsWith(p.sep) ? home.slice(0, -1) : home;
  const under = (child: string, parent: string) =>
    win
      ? child.toLowerCase().startsWith(parent.toLowerCase() + p.sep)
      : child.startsWith(parent + p.sep);
  const display =
    homeRoot && under(full, homeRoot)
      ? "~" + full.slice(homeRoot.length)
      : full;

  // The link's form of the path: forward slashes, and on Windows the drive leads: /C:/Users/Sam.
  const slashed = win ? full.replaceAll("\\", "/") : full;
  const slashPath = drive ? `/${slashed}` : slashed;
  const segments = slashPath.split("/");
  const linkPath = segments
    .map((segment, index) => (index === 1 && drive ? segment : encode(segment)))
    .join("/");
  const appPath = segments.map(encode).join("/");

  const inTemp = tempRoots.some((root) => {
    const rel = win
      ? p.relative(root.toLowerCase(), absolute.toLowerCase())
      : p.relative(root, absolute);
    return !rel.startsWith("..") && !p.isAbsolute(rel);
  });

  return {
    full,
    display,
    name: p.basename(absolute),
    slashPath,
    linkPath,
    appPath,
    exists: kind !== undefined,
    inTemp,
  };
}

export function buildReply({
  paths,
  title,
  from,
  links = "web",
  cwd = process.cwd(),
  home = homedir(),
  platform = process.platform,
  stat = statKind,
  tempRoots = defaultTempRoots(platform),
}: {
  paths: readonly string[];
  title?: string;
  from?: string;
  links?: Links;
  cwd?: string;
  home?: string;
  platform?: NodeJS.Platform;
  stat?: (absolutePath: string) => Kind;
  tempRoots?: readonly string[];
}): { markdown: string; warnings: string[] } {
  if (paths.length === 0) throw new Error("Give at least one path.");

  const seen = new Set<string>();
  const outputs = paths
    .map((input) =>
      resolveOutput(input, { cwd, home, platform, stat, tempRoots }),
    )
    .filter((output) => !seen.has(output.full) && seen.add(output.full));

  const warnings: string[] = [];
  for (const output of outputs) {
    if (!output.exists) {
      warnings.push(
        `${output.full} does not exist, so its link opens nothing. Check the path, or link the output once it is written.`,
      );
    } else if (output.inTemp) {
      warnings.push(
        `${output.full} is in a temporary folder, which gets cleaned up, and its link stops working then. Write an output the person will want later into their project or a folder they named, and link that copy.`,
      );
    }
  }

  const name = title?.trim();
  const [only] = outputs;
  if (outputs.length === 1 && only) {
    const heading = name || only.name || only.full;
    const link =
      links === "app"
        ? `${APP_PROTOCOL}://file${only.appPath}`
        : OPEN_URL + only.linkPath;
    return {
      markdown: `**${escapeMarkdown(heading)}** · ${inlineCode(only.display)} · [${LABEL}](${link})`,
      warnings,
    };
  }

  if (!name) {
    throw new Error(
      "Several outputs need --title, naming the piece of work they belong to.",
    );
  }
  let link;
  if (links === "app") {
    const params = outputs.map((output) => `path=${encode(output.slashPath)}`);
    link = `${APP_PROTOCOL}://files?${params.join("&")}`;
  } else {
    const params = [`title=${encode(name)}`];
    const agent = from?.trim();
    if (agent) params.push(`from=${encode(agent)}`);
    for (const output of outputs) {
      params.push(`f=${encode(output.slashPath)}`);
    }
    link = OPEN_URL + params.join("&");
  }
  const lines = [
    `**${escapeMarkdown(name)}** · ${outputs.length} files · [${LABEL}](${link})`,
    "",
    ...outputs.map((output) => `- ${inlineCode(output.display)}`),
  ];
  return { markdown: lines.join("\n"), warnings };
}

/** Where Instrument keeps its own settings on this platform, and so the person's link preference. */
export function preferenceFile({
  platform,
  home,
  env,
}: {
  platform: NodeJS.Platform;
  home: string;
  env: Readonly<Record<string, string | undefined>>;
}) {
  if (platform === "win32") {
    const appData = env.APPDATA || path.win32.join(home, "AppData", "Roaming");
    return path.win32.join(appData, "Instrument", PREFERENCE_FILE);
  }
  const config =
    platform === "darwin"
      ? path.posix.join(home, "Library", "Application Support")
      : env.XDG_CONFIG_HOME || path.posix.join(home, ".config");
  return path.posix.join(config, "Instrument", PREFERENCE_FILE);
}

/**
 * The person's choice of where links go: the --links flag, then INSTRUMENT_LINKS,
 * then the agent-links file in Instrument's settings folder, then the website.
 * A blank value is no value. Any other value that is neither app nor web counts as the website, with a warning naming its source.
 */
export function resolveLinks({
  flag,
  env = process.env,
  platform = process.platform,
  home = homedir(),
  readFile = (file) => readFileSync(file, "utf-8"),
}: {
  flag?: string;
  env?: Readonly<Record<string, string | undefined>>;
  platform?: NodeJS.Platform;
  home?: string;
  readFile?: (file: string) => string;
}): { links: Links; warning?: string } {
  const file = preferenceFile({ platform, home, env });
  const sources: [string, string | undefined][] = [
    ["--links", flag],
    ["INSTRUMENT_LINKS", env.INSTRUMENT_LINKS],
    [
      file,
      (() => {
        try {
          return readFile(file);
        } catch {
          return undefined;
        }
      })(),
    ],
  ];
  for (const [source, raw] of sources) {
    const value = raw?.trim().toLowerCase();
    if (!value) continue;
    if (value === "app" || value === "web") return { links: value };
    return {
      links: "web",
      warning: `${source} says ${JSON.stringify(value)}, which is neither app nor web, so links go through the website.`,
    };
  }
  return { links: "web" };
}

const USAGE = `open-in-instrument-link

Usage:
  $ node open-in-instrument-link.ts <path> [--title <title>]
  $ node open-in-instrument-link.ts <path> <path>... --title <work> [--from <agent>]

Prints the Markdown to paste into your reply. One path prints one line; several
paths print one link that opens them together, then each path on its own line.
Relative paths resolve against the current folder. Warnings go to stderr.

Options:
  --title <title>  Names the output, or for several the piece of work (default: the file name)
  --from <agent>   Names you as you would introduce yourself; used with several paths
  --links <where>  Where the link goes: web (tryinstrument.com/open, the default) or app
                   (instrument://). Only when the person asked; otherwise their
                   INSTRUMENT_LINKS variable or Instrument's agent-links file decides
  -h, --help       Display this message`;

// Agents reach the script through a symlinked skill folder, so the file it was
// invoked by is compared where it really leads.
if (
  import.meta.url === pathToFileURL(realpathOrSelf(process.argv[1] ?? "")).href
) {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        title: { type: "string" },
        from: { type: "string" },
        links: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error(USAGE);
    process.exit(1);
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }
  if (positionals.length === 0) {
    console.error(USAGE);
    process.exit(1);
  }
  try {
    const { links, warning } = resolveLinks({ flag: values.links });
    if (warning) console.error(`warning: ${warning}`);
    const { markdown, warnings } = buildReply({
      paths: positionals,
      title: values.title,
      from: values.from,
      links,
    });
    for (const warning of warnings) console.error(`warning: ${warning}`);
    console.log(markdown);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
