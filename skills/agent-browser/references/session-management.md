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

- `auth`, `state`, `session`, `profiles`, `connect`, or `close` subcommands
- `--session`, `--state`, `--profile`, `--provider`, `--cdp`, `--restore`, or related connection and persistence flags
- `tab`, `window new`, `click --new-tab`, and popup-based workflows

The wrapper blocks connection and persistence controls because they would bypass or duplicate the workspace-owned context. The CDP bridge exposes only one page target, so its tab and window commands cannot create another page.

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

The managed bridge exposes one page target. Although the upstream CLI recognizes tab and window commands, Instrument does not create additional pages for them and may navigate the current target. If a task requires simultaneous pages, popup messaging, separate authenticated profiles, or isolated proxy contexts, explain the limitation and ask for a different workflow.

## Resetting site state

Prefer the site's own sign-out or reset controls. When the task explicitly requires a cookie reset:

```bash
agent-browser cookies clear
agent-browser storage local clear
```

`cookies clear` affects the workspace browser profile and may sign the user out of unrelated sites. `storage local clear` affects the current origin. Do not use either as routine cleanup. Instrument handles browser lifecycle automatically.
