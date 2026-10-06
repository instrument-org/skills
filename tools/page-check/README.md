# page-check

The full create-page check in headless Chromium, for evals and development. It is outside `skills/` on purpose: an installed skill starts no process and opens no browser, so the check an agent runs there is `page.mjs` (static) plus the skill's own `lib/probe.js` evaluated in the agent's browser tool. This tool runs those same two pieces, and adds screenshots.

```sh
pnpm page-check page.html [more.html] [--inputs <files>] [--no-build] [--out <dir>]
```

For each page it runs `page.mjs`'s build and static check (skipped with `--no-build`), opens the page in Chromium over the DevTools protocol, evaluates `skills/create-page/lib/probe.js` and prints what it returns, then writes `<name>.desktop.png` (1280 wide, full page), `<name>.preview.png` (1104x590) and `<name>.phone.png` (390 wide) beside the page or into `--out`. Exit 0 pass, 1 FAIL, 2 bad command, 3 Chromium could not run.

## Which browser

Only a downloaded Chromium, never a browser installed in Applications, Program Files or `/usr/bin`: on macOS, launching the user's own Chrome from another app raises an App Management permission prompt in that app's name.

- `PAGE_CHECK_CHROME=/path/to/chromium` wins, and is an error when it does not exist.
- Otherwise it searches agent-browser's downloads (`~/.agent-browser/browsers`), Playwright's cache (`~/Library/Caches/ms-playwright`, `~/.cache/ms-playwright`, or `%LOCALAPPDATA%\ms-playwright`) and Puppeteer's (`~/.cache/puppeteer`), and takes the newest headless shell, then the newest full Chromium.

With none, it exits saying so; `npx playwright install chromium-headless-shell` downloads one. It prints the browser it uses to stderr.

`scripts/page-check.test.ts` covers the lookup, and runs the probe on a clean page and a planted overlap when a downloaded Chromium is there (it is skipped otherwise, as on CI).
