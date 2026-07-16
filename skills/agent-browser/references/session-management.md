# Managed browser session

Instrument owns the browser connection, profile, state, screenshots, downloads,
and lifecycle. Every `agent-browser` command in a project targets the same
managed session.

## What persists

- Navigation and open tabs
- Cookies and web storage
- IndexedDB and service workers
- Authenticated site state

The command daemon may stop while idle, but the managed browser view and its
site state remain available to later commands.

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
agent-browser tab new https://example.com/one
agent-browser tab new https://example.com/two
agent-browser tab
agent-browser tab 1
```

Tabs share cookies and storage. They are not isolated identities. If a task
requires separate authenticated profiles or proxy contexts, explain that the
managed browser does not expose them and ask for a different workflow.

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
