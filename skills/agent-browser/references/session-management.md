# Managed browser targets and site state

Instrument owns the browser connection, profile, state, screenshots, downloads,
and lifecycle. Commands in the same task reuse one managed browser target.

## While the target remains live

- Navigation and open tabs
- `sessionStorage`

The command daemon may stop while idle without closing the browser target, so a
later command in the task can reconnect to the same page. Refs and explicit
frame context live in the command daemon, so take a fresh snapshot after an idle
reconnect and do not rely on old refs.

## In the workspace browser profile

- Cookies and `localStorage`
- IndexedDB and service workers
- Authenticated site state backed by those stores

Profile-backed data can survive target recreation. The page, tabs, refs, and
`sessionStorage` are live-target state and should not be assumed to survive it.

## Unsupported upstream controls

Do not use these upstream surfaces in Instrument:

- `auth`, `state`, `session`, `profiles`, `connect`, or `close` subcommands
- `--session`, `--state`, `--profile`, `--provider`, `--cdp`, `--restore`, or
  related connection and persistence flags

They are blocked because they would bypass or duplicate the workspace-owned
browser context.

## Continue existing work

Read the current URL and take a fresh snapshot before acting:

```bash
agent-browser get url
agent-browser snapshot -i
```

Refs are tied to the latest page state, not to a saved session. Re-snapshot
after navigation, form submission, tab changes, or major DOM updates.

## Tabs instead of named sessions

Use tabs when one task needs several pages in the same browser context:

```bash
agent-browser tab new --label one https://example.com/one
agent-browser tab new --label two https://example.com/two
agent-browser tab
agent-browser tab one
agent-browser tab close two
```

The tab list also reports stable IDs such as `t1` and `t2`; positional integers
are not accepted. Tabs share cookies and storage. They are not isolated
identities. If a task requires separate authenticated profiles or proxy
contexts, explain that the managed browser does not expose them and ask for a
different workflow.

## Resetting site state

Prefer the site's own sign-out or reset controls. When the task explicitly
requires a cookie reset:

```bash
agent-browser cookies clear
agent-browser storage local clear
```

Clearing state affects the managed project session and may sign the user out of
other sites. Do not do it as routine cleanup. Instrument handles browser
lifecycle automatically.
