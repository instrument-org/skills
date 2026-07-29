# Managed browser target and site state

Instrument owns the browser connection, profile, state, screenshots, downloads, and lifecycle. Commands in the same task and agent session reuse one managed browser target.

## While the target remains live

- Current page and navigation history
- `sessionStorage`

The command daemon may stop while idle without closing the browser target, so a later command in the task can reconnect to the same page. Refs and explicit frame context live in the command daemon, so take a fresh snapshot after an idle reconnect and do not rely on old refs.

## In the workspace browser profile

- Cookies and `localStorage`
- IndexedDB and service workers
- Authenticated site state backed by those stores

Profile-backed data can survive target recreation. The page, navigation history, refs, and `sessionStorage` are live-target state and should not be assumed to survive it.

## Unsupported upstream controls

Do not use these upstream surfaces in Instrument:

- `auth`, `state`, `session`, `connect`, or `close` subcommands
- `batch`, `plugin`, `mcp`, `chat`, `inspect`, `stream`, `launch`, and the install, upgrade, doctor, and dashboard subcommands. Issue each command on its own rather than batching them.
- `--session`, `--session-name`, `--config`, or `--namespace` flags
- `tab`, `window new`, `click --new-tab`, and popup-based workflows in the managed task browser

The wrapper blocks session identity and config/plugin discovery because they would bypass the workspace-owned context. Connection and persistence flags (`--cdp`, `--auto-connect`, `--provider`, `--profile`, `--state`, `--restore`) are allowed and route that invocation to an external browser (see the External browsers section in `SKILL.md`); they never affect the managed task browser. The task browser's CDP bridge exposes only one page target, so its tab and window commands cannot create another page.

## External browser sessions

An invocation carrying an external targeting flag runs in a sibling daemon session, so the task browser connection and an external connection coexist. The flag applies to that invocation only: a bare follow-up command routes back to the task browser, so repeat the flag on every command of an external flow. External refs and page state live in that sibling session; re-snapshot when switching targets.

## Continue existing work

Read the current URL and take a fresh snapshot before acting:

```bash
agent-browser get url
agent-browser snapshot -i
```

Refs are tied to the latest page state, not to a saved session. Re-snapshot after navigation, form submission, or major DOM updates.

## Sequential multi-page work

Collect real URLs before leaving a page, then open them in the same target:

```bash
agent-browser get url
agent-browser snapshot -i --urls
agent-browser open https://example.com/discovered-page
agent-browser back
```

The managed bridge exposes one page target. Although the upstream CLI recognizes tab and window commands, Instrument does not create additional pages for them and may navigate the current target. If a task requires simultaneous pages, popup messaging, separate authenticated profiles, or isolated proxy contexts, consider an external browser (see the External browsers section in `SKILL.md`) or explain the limitation and ask for a different workflow.

## Resetting site state

Prefer the site's own sign-out or reset controls. When the task explicitly requires a cookie reset:

```bash
agent-browser cookies clear
agent-browser storage local clear
```

`cookies clear` affects the workspace browser profile and may sign the user out of unrelated sites. `storage local clear` affects the current origin. Do not use either as routine cleanup. Instrument handles browser lifecycle automatically.
