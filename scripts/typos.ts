// Runs the spell checker, vendoring the binary on first use. `typos` is a Rust
// binary with no first-party npm package, so we fetch the checksum-verified
// artifact straight from crate-ci's GitHub releases rather than trusting a
// third-party npm mirror that would also need a postinstall allowance. The
// binary is cached under node_modules, so a clean install re-fetches it and
// nothing lands in the working tree.
//
// A matching install on PATH is used ahead of any download, since Homebrew and
// cargo ship the same release. A mismatched one is a last resort, taken only
// when the release cannot be fetched at all.
//
// Arguments are forwarded, so `pnpm check:spelling --write-changes` applies the
// corrections and `pnpm check:spelling <path>` narrows the scan.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CACHE_DIR = path.resolve(
  import.meta.dirname,
  "../node_modules/.cache/typos",
);

// Bump deliberately, and refresh every checksum below with it. Get them from
// the release page, or by hashing each downloaded asset with `shasum -a 256`.
const TYPOS_VERSION = "1.49.0";

const BINARY_NAME = process.platform === "win32" ? "typos.exe" : "typos";

// sha256 of each release asset, keyed by rust target triple. Pinned here because
// crate-ci publishes no checksum sidecar to fetch alongside the archive.
const CHECKSUMS: Record<string, string> = {
  "aarch64-apple-darwin":
    "8c0e7bd40b2b60c0b0cfe9f74dd814b4d4385c956ce86860f7da9e62d91fdc73",
  "aarch64-unknown-linux-musl":
    "85c8b87b22a0fb1da130cd4d495e0beba7f1225eb580933184509e146ec4c509",
  "x86_64-apple-darwin":
    "4cecbf653a9fc45f023abf57f4e2e2f6b138c2d2387b09289beacdd3f0ea7bfd",
  "x86_64-pc-windows-msvc":
    "06d3a1b71c282e021671070696a72696d5c60ea485b47dc4f8f1fbcf90144d02",
  "x86_64-unknown-linux-musl":
    "48bd2d58e02ce713b8c0f1aa239e68ee4f7d8c551013135806e6aed3938d9e10",
};

// Linux builds are musl-only upstream, and there is no Windows arm64 artifact.
const TARGET_TRIPLES: Partial<
  Record<NodeJS.Platform, Partial<Record<NodeJS.Architecture, string>>>
> = {
  darwin: {
    arm64: "aarch64-apple-darwin",
    x64: "x86_64-apple-darwin",
  },
  linux: {
    arm64: "aarch64-unknown-linux-musl",
    x64: "x86_64-unknown-linux-musl",
  },
  win32: {
    x64: "x86_64-pc-windows-msvc",
  },
};

function cachedPath(target: string): string {
  return path.join(CACHE_DIR, `${TYPOS_VERSION}-${target}`, BINARY_NAME);
}

// Fetch the pinned release into the cache and return its path.
async function downloadBinary(target: string): Promise<string> {
  const expected = CHECKSUMS[target];
  if (!expected) {
    throw new Error(`No pinned checksum for ${target}; add one to CHECKSUMS`);
  }

  const ext = process.platform === "win32" ? "zip" : "tar.gz";
  const asset = `typos-v${TYPOS_VERSION}-${target}.${ext}`;
  // eslint-disable-next-line no-console
  console.log(`Downloading ${asset}...`);
  const archive = await fetchBuffer(
    `https://github.com/crate-ci/typos/releases/download/v${TYPOS_VERSION}/${asset}`,
  );

  const actual = createHash("sha256").update(archive).digest("hex");
  if (actual !== expected) {
    throw new Error(
      `Checksum mismatch for ${asset}: expected ${expected}, got ${actual}`,
    );
  }

  // Extract to a scratch dir and move the binary into place as the last step, so
  // a killed download never leaves a half-written binary that the cache check
  // above would treat as good.
  const destPath = cachedPath(target);
  const extractDir = mkdtempSync(path.join(tmpdir(), "typos-download-"));
  try {
    const archivePath = path.join(extractDir, asset);
    writeFileSync(archivePath, archive);
    extractArchive({ archivePath, asset, ext, extractDir });
    mkdirSync(path.dirname(destPath), { recursive: true });
    renameSync(path.join(extractDir, BINARY_NAME), destPath);
    if (process.platform !== "win32") {
      chmodSync(destPath, 0o755);
    }
  } finally {
    rmSync(extractDir, { force: true, recursive: true });
  }
  return destPath;
}

// The `tar` on Windows runners is often MSYS/Git GNU tar, which can't read zips
// and reads a `D:\...` path as a remote host. Use PowerShell there. Elsewhere
// `tar` is bsdtar, which autodetects the format; run it from `extractDir` with a
// relative archive name so a drive-letter path never reaches it.
function extractArchive({
  archivePath,
  asset,
  ext,
  extractDir,
}: {
  archivePath: string;
  asset: string;
  ext: string;
  extractDir: string;
}) {
  if (ext === "zip" && process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${extractDir}' -Force`,
      ],
      { stdio: "inherit" },
    );
    return;
  }
  execFileSync("tar", ["-xf", asset], { cwd: extractDir, stdio: "inherit" });
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

// The typos to run: the vendored copy once it is cached, a matching install on
// PATH ahead of any download, and the pinned release otherwise.
async function resolveBinary(): Promise<string> {
  const target = TARGET_TRIPLES[process.platform]?.[process.arch];
  if (target && existsSync(cachedPath(target))) {
    return cachedPath(target);
  }

  const installed = resolveInstalledVersion();
  if (installed === TYPOS_VERSION) {
    return BINARY_NAME;
  }

  if (!target) {
    throw new Error(
      `typos publishes no ${process.platform} ${process.arch} build; install typos ${TYPOS_VERSION} on PATH to check spelling on this host`,
    );
  }

  try {
    return await downloadBinary(target);
  } catch (error) {
    // A release outage should not block the check when a usable binary is
    // already here. Name the version, so a result that disagrees with CI's is
    // explainable rather than mysterious.
    if (!installed) {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `Could not fetch typos ${TYPOS_VERSION} (${String(error)}).\nFalling back to typos ${installed} on PATH, which may not agree with CI.`,
    );
    return BINARY_NAME;
  }
}

// The version of a typos already on PATH, or undefined when there is none.
function resolveInstalledVersion(): string | undefined {
  try {
    // `typos --version` prints `typos-cli <semver>`.
    const output = execFileSync(BINARY_NAME, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.trim().split(/\s+/).at(-1);
  } catch {
    return undefined;
  }
}

const binary = await resolveBinary();
const { status } = spawnSync(binary, process.argv.slice(2), {
  stdio: "inherit",
});
// eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
process.exit(status ?? 1);
