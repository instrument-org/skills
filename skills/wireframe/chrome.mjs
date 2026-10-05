// Headless Chrome over the DevTools protocol, with no npm dependency (Node 22
// has fetch and WebSocket built in). Every wait has a deadline, and every
// failure throws a ChromeError whose message says what happened, so a caller
// can never mistake "Chrome did not run" for "the page is fine".

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, win32 as win } from "node:path";

export class ChromeError extends Error {}

// Where each platform installs Chrome, Chromium and Edge, in that order of
// preference. CHROME (or CHROME_PATH) overrides the search; when it is set
// and wrong, that is the error, rather than a quiet fall back to another browser.
const BROWSERS = {
  darwin: (home) =>
    [
      "Google Chrome.app/Contents/MacOS/Google Chrome",
      "Chromium.app/Contents/MacOS/Chromium",
      "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ].flatMap((app) => [
      join("/Applications", app),
      join(home, "Applications", app),
    ]),
  win32: (_home, env) =>
    [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA]
      .filter(Boolean)
      .flatMap((root) => [
        win.join(root, "Google", "Chrome", "Application", "chrome.exe"),
        win.join(root, "Chromium", "Application", "chrome.exe"),
        win.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
      ]),
  linux: (_home, env) => [
    ...[
      "google-chrome",
      "google-chrome-stable",
      "chromium",
      "chromium-browser",
      "microsoft-edge",
      "microsoft-edge-stable",
    ].flatMap((name) =>
      (env.PATH || "/usr/bin")
        .split(":")
        .filter(Boolean)
        .map((dir) => join(dir, name)),
    ),
    "/opt/google/chrome/chrome",
    "/snap/bin/chromium",
  ],
};

// Returns { bin } for the browser to run, or { error } saying where it looked.
export function findChrome({
  env = process.env,
  platform = process.platform,
  home = homedir(),
  exists = existsSync,
} = {}) {
  const override = env.CHROME || env.CHROME_PATH;
  if (override)
    return exists(override)
      ? { bin: override }
      : { error: `CHROME is set to ${override}, which does not exist` };
  const looked = [
    ...new Set((BROWSERS[platform] ?? BROWSERS.linux)(home, env)),
  ];
  const bin = looked.find((p) => exists(p));
  return bin
    ? { bin }
    : {
        error: `no Chrome, Chromium or Edge found (looked in ${looked.length} places, such as ${looked.slice(0, 2).join(" and ")}); set CHROME=/path/to/chrome`,
      };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withDeadline(promise, ms, what) {
  let t;
  return Promise.race([
    promise,
    new Promise(
      (_, rej) =>
        (t = setTimeout(
          () =>
            rej(
              new ChromeError(
                `${what} took longer than ${Math.round(ms / 1000)}s`,
              ),
            ),
          ms,
        )),
    ),
  ]).finally(() => clearTimeout(t));
}

// Starts Chrome and returns { page, close }. page has send(method, params),
// navigate(url), evaluate(expr), screenshot(opts) and on(event, fn).
export async function launch({ timeoutMs = 15000 } = {}) {
  const { bin, error } = findChrome();
  if (!bin) throw new ChromeError(error);
  const profile = mkdtempSync(
    join(process.env.TMPDIR || tmpdir(), "create-page-chrome-"),
  );
  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    "--allow-file-access-from-files",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-extensions",
    // Chrome refuses to start its sandbox as root, which is how containers run.
    ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []),
    "about:blank",
  ];
  let proc;
  try {
    proc = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    rmSync(profile, { recursive: true, force: true });
    throw new ChromeError(`could not start ${bin}: ${e.message}`);
  }
  let stderr = "";
  let exited = null;
  proc.on("exit", (code, signal) => (exited = { code, signal }));
  proc.on("error", (e) => (exited = { code: -1, signal: e.message }));
  const close = () => {
    try {
      proc.kill("SIGKILL");
    } catch {
      // Chrome is already gone; nothing to stop.
    }
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // A profile file still locked on Windows; the temp dir is cleaned by the OS.
    }
  };
  const wsUrl = await withDeadline(
    new Promise((resolve, reject) => {
      proc.stderr.on("data", (d) => {
        stderr += d;
        const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
        if (m) resolve(m[1]);
      });
      proc.on("exit", () =>
        reject(
          new ChromeError(
            `Chrome exited before it was ready (${JSON.stringify(exited)}): ${stderr.trim().slice(-400) || "no output"}`,
          ),
        ),
      );
      proc.on("error", (e) =>
        reject(new ChromeError(`Chrome failed to start: ${e.message}`)),
      );
    }),
    timeoutMs,
    "starting Chrome",
  ).catch((e) => {
    close();
    throw e;
  });

  const port = new URL(wsUrl).port;
  let target;
  try {
    const list = await withDeadline(
      fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()),
      5000,
      "listing Chrome tabs",
    );
    target = list.find((t) => t.type === "page");
    if (!target) throw new ChromeError("Chrome started with no page tab");
  } catch (e) {
    close();
    throw e instanceof ChromeError
      ? e
      : new ChromeError(`could not reach Chrome on port ${port}: ${e.message}`);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await withDeadline(
    new Promise((r, j) => {
      ws.onopen = r;
      ws.onerror = () => j(new ChromeError("DevTools socket failed to open"));
    }),
    5000,
    "opening the DevTools socket",
  ).catch((e) => {
    close();
    throw e;
  });
  let id = 0;
  const waiting = new Map();
  const listeners = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) {
      const { resolve, reject } = waiting.get(m.id);
      waiting.delete(m.id);
      if (m.error)
        reject(new ChromeError(`${m.error.message} (${m.error.code})`));
      else resolve(m.result);
    } else if (m.method) {
      if (m.method === "Page.javascriptDialogOpening")
        send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      for (const fn of listeners.get(m.method) ?? []) fn(m.params);
    }
  };
  ws.onclose = () => {
    for (const { reject } of waiting.values())
      reject(
        new ChromeError(
          "Chrome closed the DevTools connection (it crashed or was killed)",
        ),
      );
    waiting.clear();
  };
  const send = (method, params = {}, ms = 20000) =>
    withDeadline(
      new Promise((resolve, reject) => {
        const i = ++id;
        waiting.set(i, { resolve, reject });
        ws.send(JSON.stringify({ id: i, method, params }));
      }),
      ms,
      `Chrome ${method}`,
    );
  const on = (method, fn) => {
    if (!listeners.has(method)) listeners.set(method, []);
    listeners.get(method).push(fn);
    return () =>
      listeners.set(
        method,
        listeners.get(method).filter((f) => f !== fn),
      );
  };
  const once = (method, ms) => {
    let off;
    return withDeadline(
      new Promise(
        (r) =>
          (off = on(method, (p) => {
            off();
            r(p);
          })),
      ),
      ms,
      `waiting for ${method}`,
    ).finally(() => off?.());
  };

  await send("Page.enable");
  await send("Runtime.enable");

  const evaluate = async (expression, ms = 20000) => {
    const r = await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      ms,
    );
    if (r.exceptionDetails)
      throw new ChromeError(
        `script in page failed: ${r.exceptionDetails.exception?.description?.split("\n")[0] ?? r.exceptionDetails.text}`,
      );
    return r.result.value;
  };

  // Sets the viewport (CSS px). mobile=true gives a real phone layout at
  // widths headless Chrome's window will not go down to.
  const viewport = (width, height, { mobile = false, dark = false } = {}) =>
    Promise.all([
      send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
        screenWidth: width,
        screenHeight: height,
      }),
      send("Emulation.setEmulatedMedia", {
        features: [
          { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
        ],
      }),
    ]);

  const navigate = async (url, { loadMs = 10000 } = {}) => {
    const loaded = once("Page.loadEventFired", loadMs);
    const r = await send("Page.navigate", { url });
    if (r.errorText)
      throw new ChromeError(`Chrome could not open ${url}: ${r.errorText}`);
    try {
      await loaded;
    } catch {
      // A slow font or CDN script held the load event; measure what has rendered.
      loaded.catch(() => {});
    }
    await evaluate(
      `Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]).then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))`,
      8000,
    );
    await sleep(250);
  };

  const screenshot = async ({ width, height, clipHeight }) => {
    const h = Math.min(clipHeight ?? height, 12000);
    const r = await send(
      "Page.captureScreenshot",
      {
        format: "png",
        captureBeyondViewport: h > height,
        clip: { x: 0, y: 0, width, height: h, scale: 1 },
      },
      30000,
    );
    return Buffer.from(r.data, "base64");
  };

  return {
    page: {
      send,
      on,
      evaluate,
      viewport,
      navigate,
      screenshot,
      alive: () => !exited,
    },
    close: () => {
      try {
        ws.close();
      } catch {
        // Socket already closed.
      }
      close();
    },
    bin,
  };
}
