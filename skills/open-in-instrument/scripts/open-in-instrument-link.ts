/**
 * Print the reply line that links outputs to Instrument: one line per output, or one link for several outputs of the same piece of work
 * @note Prints Markdown to stdout and warnings to stderr. It reads only whether each path exists and is a folder, and opens nothing.
 */
import { realpathSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const OPEN_URL = "https://tryinstrument.com/open#";
const LABEL = "Open in Instrument";

type Kind = "file" | "folder" | undefined;

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
  const display =
    kind === "folder" && !absolute.endsWith(p.sep)
      ? absolute + p.sep
      : absolute;

  // The link's form of the path: forward slashes, and on Windows the drive leads: /C:/Users/Sam.
  const slashed = win ? display.replaceAll("\\", "/") : display;
  const slashPath = drive ? `/${slashed}` : slashed;
  const linkPath = slashPath
    .split("/")
    .map((segment, index) => (index === 1 && drive ? segment : encode(segment)))
    .join("/");

  const inTemp = tempRoots.some((root) => {
    const rel = win
      ? p.relative(root.toLowerCase(), absolute.toLowerCase())
      : p.relative(root, absolute);
    return !rel.startsWith("..") && !p.isAbsolute(rel);
  });

  return {
    display,
    name: p.basename(absolute),
    slashPath,
    linkPath,
    exists: kind !== undefined,
    inTemp,
  };
}

export function buildReply({
  paths,
  title,
  from,
  cwd = process.cwd(),
  home = homedir(),
  platform = process.platform,
  stat = statKind,
  tempRoots = defaultTempRoots(platform),
}: {
  paths: readonly string[];
  title?: string;
  from?: string;
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
    .filter((output) => !seen.has(output.display) && seen.add(output.display));

  const warnings: string[] = [];
  for (const output of outputs) {
    if (!output.exists) {
      warnings.push(
        `${output.display} does not exist, so its link opens nothing. Check the path, or link the output once it is written.`,
      );
    } else if (output.inTemp) {
      warnings.push(
        `${output.display} is in a temporary folder, which gets cleaned up, and its link stops working then. Write an output the person will want later into their project or a folder they named, and link that copy.`,
      );
    }
  }

  const name = title?.trim();
  const [only] = outputs;
  if (outputs.length === 1 && only) {
    const heading = name || only.name || only.display;
    const link = OPEN_URL + only.linkPath;
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
  const params = [`title=${encode(name)}`];
  const agent = from?.trim();
  if (agent) params.push(`from=${encode(agent)}`);
  for (const output of outputs) {
    params.push(`f=${encode(output.slashPath)}`);
  }
  const lines = [
    `**${escapeMarkdown(name)}** · ${outputs.length} files · [${LABEL}](${OPEN_URL}${params.join("&")})`,
    "",
    ...outputs.map((output) => `- ${inlineCode(output.display)}`),
  ];
  return { markdown: lines.join("\n"), warnings };
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
  -h, --help       Display this message`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        title: { type: "string" },
        from: { type: "string" },
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
    const { markdown, warnings } = buildReply({
      paths: positionals,
      title: values.title,
      from: values.from,
    });
    for (const warning of warnings) console.error(`warning: ${warning}`);
    console.log(markdown);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
