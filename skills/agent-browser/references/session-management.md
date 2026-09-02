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
- Popup-based workflows and anything else that needs a second page

The wrapper blocks session identity and config/plugin discovery because they would bypass the workspace-owned context. The CDP bridge exposes only one page target, so nothing can create another page.

## Targeting a browser outside the app

Connection and launch flags (`--cdp`, `--auto-connect`, `--provider`, `--profile`, and the launch-state flags that imply a local launch) are not on that list. Whether this environment reaches any browser outside the app is up to the environment, and `agent-browser --help` is what says so; do not conclude either way from this document.

Targeting applies to the single invocation that carries it, so repeat the flag on every command of an external flow — a bare follow-up silently lands back on the managed target. Switching browsers changes which signed-in identity you act as, so say you are switching rather than doing it silently, and re-verify signed-in state afterward instead of assuming the previous session carried over.

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

The managed bridge exposes one page target, and a command that would otherwise open another page navigates the current one instead. If a task requires simultaneous pages, popup messaging, separate authenticated profiles, or isolated proxy contexts, explain the limitation and ask for a different workflow.

Pace a run of pages on one origin. A shell loop that opens eight of a site's pages back to back issues them faster than any person browses, and it costs you the remaining pages if the origin decides to refuse partway. Take the pages a few at a time, do the work for each before fetching the next, and treat a slow or refused page as a reason to stop rather than to retry harder.

When an origin does push back, do not answer it by fetching the same URLs another way. This is the trap that looks most like resourcefulness and is not. A scripted HTTP client is refused on what it is, not on what it sends, and the part being read sits below the headers you can set. Measured against one such site: `curl` and a Node fetch were both refused while carrying byte-identical copies of the headers a real browser sends, on either HTTP version, at the same moment another client stack was being served normally. Copying headers does not make a scripted client pass, and no amount of waiting changes it either. It also abandons the cookies and session that made the earlier requests legitimate. Do not read the status code as advice either: a refusal on shape is often served as `429`, which reads as a rate limit and is not one. Stay in the browser, or tell the user the site is refusing and offer what you can source another way.

## Resetting site state

Prefer the site's own sign-out or reset controls. When the task explicitly requires a cookie reset:

```bash
agent-browser cookies clear
agent-browser storage local clear
```

`cookies clear` affects the workspace browser profile and may sign the user out of unrelated sites. `storage local clear` affects the current origin. Do not use either as routine cleanup. Instrument handles browser lifecycle automatically.
