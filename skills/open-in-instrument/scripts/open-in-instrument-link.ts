/**
 * Print the reply line that links outputs to Instrument: one line per output, or one link for several outputs of the same piece of work
 * @note Prints Markdown to stdout and warnings to stderr; inside Instrument, where INSTRUMENT_WORK is set, prints only each absolute path, one per line. It reads only whether each path exists and is a folder, and whether Instrument is installed where its installer puts it, and opens nothing.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
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
  const fromHome =
    homeRoot && under(full, homeRoot) ? full.slice(homeRoot.length) : undefined;
  const display = fromHome === undefined ? full : "~" + fromHome;

  // The link's form of the path: forward slashes, and on Windows the drive leads: /C:/Users/Sam.
  const slashed = win ? full.replaceAll("\\", "/") : full;
  const slashPath = drive ? `/${slashed}` : slashed;
  const segments = slashPath.split("/");
  const linkPath = segments
    .map((segment, index) => (index === 1 && drive ? segment : encode(segment)))
    .join("/");
  // The app reads a leading ~ as the home folder of the computer the link is
  // opened on, so a link to a synced folder opens on each of the person's
  // computers whatever their user name there.
  const appSlashPath =
    fromHome === undefined
      ? slashPath
      : "~" + (win ? fromHome.replaceAll("\\", "/") : fromHome);
  const appPath = `${fromHome === undefined ? "" : "/"}${appSlashPath
    .split("/")
    .map(encode)
    .join("/")}`;

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
    appSlashPath,
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
  insideInstrument = false,
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
  /** The person is already in the app, so only the paths are printed. */
  insideInstrument?: boolean;
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

  if (insideInstrument) {
    return {
      markdown: outputs.map((output) => output.full).join("\n"),
      warnings,
    };
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
    const params = outputs.map(
      (output) => `path=${encode(output.appSlashPath)}`,
    );
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

/** What the release build is called on disk: the bundle, the install folder, the executable and its desktop entry. */
const APP_PRODUCT_NAME = "Instrument";
const APP_EXECUTABLE = "instrument";

/**
 * Where each system's installer puts the app, from electron-builder's config:
 * the macOS bundle in either Applications folder, the NSIS per-user and
 * per-machine folders on Windows, and on Linux the deb and rpm install folder
 * and the desktop entry they register.
 */
export function installPaths({
  platform,
  home,
  env,
}: {
  platform: NodeJS.Platform;
  home: string;
  env: Readonly<Record<string, string | undefined>>;
}) {
  if (platform === "darwin") {
    return [
      `/Applications/${APP_PRODUCT_NAME}.app`,
      path.posix.join(home, "Applications", `${APP_PRODUCT_NAME}.app`),
    ];
  }
  if (platform === "win32") {
    const localAppData =
      env.LOCALAPPDATA || path.win32.join(home, "AppData", "Local");
    const programFiles = env.ProgramFiles || "C:\\Program Files";
    return [
      path.win32.join(
        localAppData,
        "Programs",
        APP_PRODUCT_NAME,
        `${APP_PRODUCT_NAME}.exe`,
      ),
      path.win32.join(
        programFiles,
        APP_PRODUCT_NAME,
        `${APP_PRODUCT_NAME}.exe`,
      ),
    ];
  }
  return [
    `/opt/${APP_PRODUCT_NAME}/${APP_EXECUTABLE}`,
    `/usr/share/applications/${APP_EXECUTABLE}.desktop`,
  ];
}

/** An AppImage is integrated by a desktop entry of any name in the person's own applications folder, claiming the app's scheme. */
function appImageEntries(home: string) {
  return path.posix.join(home, ".local", "share", "applications");
}
const SCHEME_HANDLER = new RegExp(
  `x-scheme-handler/${APP_EXECUTABLE}(?:;|\\s|$)`,
  "m",
);

/**
 * Whether the release app is installed where its installer puts it. On Linux
 * an AppImage has no fixed place, so the person's desktop entries are read for
 * the one that claims the instrument: scheme. Nothing is run.
 */
export function appInstalled({
  platform,
  home,
  env,
  exists,
  listDir,
  readFile,
}: {
  platform: NodeJS.Platform;
  home: string;
  env: Readonly<Record<string, string | undefined>>;
  exists: (file: string) => boolean;
  listDir: (dir: string) => string[];
  readFile: (file: string) => string;
}) {
  if (installPaths({ platform, home, env }).some(exists)) return true;
  if (platform === "darwin" || platform === "win32") return false;
  const dir = appImageEntries(home);
  let entries: string[];
  try {
    entries = listDir(dir);
  } catch {
    return false;
  }
  return entries.some((name) => {
    if (!name.endsWith(".desktop")) return false;
    try {
      return SCHEME_HANDLER.test(readFile(path.posix.join(dir, name)));
    } catch {
      return false;
    }
  });
}

/**
 * Where links go: as --links says when it was given, else straight into the
 * app when it is installed on this machine, else through the website.
 * A --links value that is neither app nor web counts as the website, with a warning.
 */
export function resolveLinks({
  flag,
  env = process.env,
  platform = process.platform,
  home = homedir(),
  exists = (file) => statSync(file, { throwIfNoEntry: false }) !== undefined,
  listDir = (dir) => readdirSync(dir),
  readFile = (file) => readFileSync(file, "utf-8"),
}: {
  flag?: string;
  env?: Readonly<Record<string, string | undefined>>;
  platform?: NodeJS.Platform;
  home?: string;
  exists?: (file: string) => boolean;
  listDir?: (dir: string) => string[];
  readFile?: (file: string) => string;
}): { links: Links; warning?: string } {
  const value = flag?.trim().toLowerCase();
  if (value === "app" || value === "web") return { links: value };
  if (value) {
    return {
      links: "web",
      warning: `--links says ${JSON.stringify(value)}, which is neither app nor web, so links go through the website.`,
    };
  }
  const installed = appInstalled({
    platform,
    home,
    env,
    exists,
    listDir,
    readFile,
  });
  return { links: installed ? "app" : "web" };
}

const USAGE = `open-in-instrument-link

Usage:
  $ node open-in-instrument-link.ts <path> [--title <title>]
  $ node open-in-instrument-link.ts <path> <path>... --title <work> [--from <agent>]

Prints the Markdown to paste into your reply. One path prints one line; several
paths print one link that opens them together, then each path on its own line.
Relative paths resolve against the current folder. Warnings go to stderr.
Inside Instrument, where INSTRUMENT_WORK is set, it prints only each absolute
path, one per line, with no link: the person is already in the app.

Options:
  --title <title>  Names the output, or for several the piece of work (default: the file name)
  --from <agent>   Names you as you would introduce yourself; used with several paths
  --links <where>  Where the link goes: app (instrument://) or web
                   (tryinstrument.com/open). Without it, app when Instrument is
                   installed on this machine, else web. Pass web only when the
                   person said the reply is for someone else
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
    const insideInstrument = Boolean(process.env.INSTRUMENT_WORK);
    let links: Links = "web";
    if (!insideInstrument) {
      const resolved = resolveLinks({ flag: values.links });
      links = resolved.links;
      if (resolved.warning) console.error(`warning: ${resolved.warning}`);
    }
    const { markdown, warnings } = buildReply({
      paths: positionals,
      title: values.title,
      from: values.from,
      links,
      insideInstrument,
    });
    for (const warning of warnings) console.error(`warning: ${warning}`);
    console.log(markdown);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
