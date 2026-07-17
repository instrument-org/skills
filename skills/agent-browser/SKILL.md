---
name: agent-browser
description: Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.
---

# Browser automation with agent-browser

`agent-browser` is preinstalled and reuses one managed browser target for the
current task and agent session. Use it as an adaptive observe, act, verify
loop. Read [`references/commands.md`](references/commands.md) when a recipe needs
a command or option not shown here. Open the relevant reference before guessing
syntax or working around a failed command.

Screenshots without an explicit path are saved under `.instrument/screenshots/`.
Command output reports the actual path used for screenshots and downloads,
which may differ from the requested path.

## Choose an approach

| Need                             | Start with                                    |
| -------------------------------- | --------------------------------------------- |
| Read or research a page          | `read [url]`; `get text body` for visible DOM |
| Find controls                    | `snapshot -i`, optionally with `--urls`       |
| Follow ordinary links            | Snapshot URLs, then `open` the discovered URL |
| Fill forms or operate an app     | Repeated snapshot, action, and assertion      |
| Understand a visual layout       | Screenshot and inspect the saved image        |
| Extract structured repeated data | Scoped text first, browser `eval` if needed   |
| Diagnose broken behavior         | Screenshot, console, errors, then network     |
| Reuse authenticated access       | Managed browser profile or user sign-in       |

## Core loop

1. Open a user-provided or discovered URL.
2. Observe the relevant state with text, a snapshot, or a screenshot.
3. Choose the narrowest reliable action.
4. Wait for the expected result, not an arbitrary delay.
5. Re-observe after navigation or a DOM change.
6. Assert the requested result before reporting success.

```bash
agent-browser open https://example.com/form
agent-browser wait --load networkidle
agent-browser snapshot -i
# Read the returned refs before continuing.

agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser click @e3
agent-browser wait --url "https://example.com/success**"
agent-browser get url
agent-browser get text body
```

Refs can change after navigation, submission, or a dynamic rerender. Re-run
`snapshot -i` before the next action instead of assuming an old ref still
identifies the same element.

## Common command map

| Need                          | Commands                                             |
| ----------------------------- | ---------------------------------------------------- |
| Navigate                      | `open`, `back`, `forward`, `reload`                  |
| Read content                  | `read`, `get text`, `get html`                       |
| Find controls                 | `snapshot -i`, `snapshot -i --urls`, `find`          |
| Interact                      | `click`, `fill`, `type`, `press`, `select`, `upload` |
| Wait and verify               | `wait`, `get url`, `is visible`, `is enabled`        |
| Change page context           | `frame`, `scrollintoview`                            |
| Capture or export             | `screenshot`, `pdf`, `record`                        |
| Save a browser download       | `download @ref <path>`                               |
| Diagnose or compare app state | `dialog`, `console`, `errors`, `network`, `diff`     |
| Inspect app performance       | `vitals`, `react`, `profiler`, `trace`               |

The command map is for discovery, not a substitute for observing the page.
Read command output before choosing refs, paths, frame targets, or
follow-up actions.

## Critical invariants

- Never fabricate a deep URL, identifier, or query string. Discover links from
  a provided page or use a URL supplied by the user.
- `snapshot -i` returns interactive elements, not all body copy. Use
  `get text body`, `get text main`, or another scoped region to read.
- A ref may exist outside the viewport. Use `is visible` or `scrollintoview`
  when visibility, hover behavior, screenshots, or lazy loading matter.
- Use element, text, URL, function, or load waits when possible. Fixed sleeps
  are a fallback, not a readiness check.
- Do not treat command success as task success. Verify visible text, URL,
  control state, downloaded content, or rendered appearance as appropriate.
- Do not place passwords, tokens, cookies, or saved browser state in project
  files or command arguments.
- Instrument manages the connection, session, profile, state, and lifecycle.
  Do not use upstream `auth`, `state`, `session`, `connect`, or `close`
  commands or their related flags.
- Instrument exposes one browser target. Do not use `tab`, `window new`,
  `click --new-tab`, or popup-based workflows. Follow ordinary links by
  opening a URL discovered with `snapshot -i --urls` in the current target.

## Recover from common failures

- **Ref not found or wrong element:** re-run a scoped `snapshot -i`; refs are
  invalid after navigation and may change after any major DOM update.
- **Unexpected timeout:** inspect the URL and visible text, then run
  `agent-browser dialog status`. A pending `confirm` or `prompt` blocks other
  commands until accepted or dismissed.
- **Element missing or not clickable:** check visibility, scroll it into view,
  and inspect the newest screenshot for overlays. Interact with a covering
  dialog or banner before retrying the target.
- **Text input ignores `fill` or `type`:** focus the field, then use
  `keyboard inserttext` or `keyboard type` as the fallback.
- **Iframe control absent:** a fresh snapshot includes one level of accessible
  iframe content and its refs work directly. Use `frame @ref` for a scoped
  snapshot; inaccessible cross-origin frames may require a different workflow.

## Recipe: read and research

```bash
agent-browser read https://example.com > work/page.txt
agent-browser open https://example.com
agent-browser wait --load networkidle
agent-browser snapshot -i --urls
```

`read [url]` is the primary agent-friendly text or Markdown surface. With no
URL, it reads the active page. Use `get text body` or a scoped region when the
task specifically needs currently visible DOM copy or post-interaction state.
Read the snapshot for controls and discovered links. On multi-page work,
collect the real URLs once and read or open them directly. Expand accordions
before visible-DOM extraction when the content starts hidden.

## Recipe: interact and verify

After each meaningful action, wait on the state it should cause and then check
that state directly:

```bash
agent-browser snapshot -i
agent-browser click @e5
agent-browser wait --text "Saved"
agent-browser get text body
```

For a toggle or checkbox, use `is checked`. For submission, check the resulting
URL and confirmation copy. For destructive or externally visible actions,
confirm that the user authorized the action before performing it.

## Escalate element targeting carefully

Use the least brittle option that can express the task:

1. Refs from a fresh scoped snapshot.
2. Semantic locators such as role, label, text, placeholder, or test ID.
3. A stable CSS selector for a specific region.
4. Browser `eval` for structured page data or behavior the CLI cannot express.
5. Coordinates only for canvas or spatial interfaces with visual confirmation.

```bash
agent-browser find label "Email" fill "user@example.com"
agent-browser find role button click --name "Save"
```

For multiline JavaScript, use stdin so shell quoting cannot rewrite it:

```bash
agent-browser eval --stdin <<'EOF'
JSON.stringify(
  Array.from(document.querySelectorAll("article h2"), (heading) => ({
    text: heading.textContent?.trim(),
    id: heading.id,
  }))
)
EOF
```

`eval` returns the expression value. It does not return `console.log` output.
It runs JavaScript, not TypeScript: type annotations or other TS-only syntax
(`(img: any) => ...`) throw `SyntaxError`.

## Recipe: visual review

Use a screenshot when correctness depends on layout, visibility, clipping,
hover state, canvas content, or unlabeled icons.

```bash
agent-browser screenshot --annotate
agent-browser screenshot work/page-viewport.png
agent-browser pdf work/page-full.pdf
```

Read the resulting image. Annotated label `[N]` maps to ref `@eN`. Before
capturing a below-the-fold or hover-only element, scroll it into view and
establish the relevant state. Full-page screenshots are unavailable in the
managed browser; capture successive viewports or export the full page to PDF.
Reuse the newest image under
`.instrument/screenshots/` when it already shows the state you need.

## Recipe: structured extraction

Prefer scoped text when prose is enough. Use `eval` only when repeated fields
must remain associated or attributes contain the required values. Return JSON
with source URLs and stable labels, save it under `work/`, then validate sample
records against the page.

To collect image URLs, note that `read` and `get text` return prose, not
`<img>` sources; enumerate `document.images` (`src`, `currentSrc`, `srcset`)
with `eval`. Lazy images may expose placeholders until scrolled into view. Read
`srcset`, `data-*` attributes, or the URL the detail page actually serves. Do
not invent a higher-resolution URL by editing path segments or query
parameters.

## Recipe: product variants and galleries

Selecting a color, size, or thumbnail usually swaps the gallery through a
script or network fetch, not by mutating `img.src` on click. Confirm the change
before reading, and capture each variant before moving to the next.

- If the same asset URLs repeat across every variant, you are reading a stale
  gallery, not proof the variants share images. Selection often changes a URL
  parameter (`?color=`, `?variant=`); open that per-variant URL
  directly, or read the variation endpoint from `network requests`, instead of
  clicking swatches.
- After selecting a variant, wait for the specific image to change
  (`wait --fn` on the `src`, or `wait --load networkidle` then re-read) rather
  than a fixed sleep, then extract that variant's URLs.
- Handle one variant fully, then the next. Do not click through every variant
  and screenshot afterward -- every capture then shows only the final state.
  Distinct variants that yield byte-identical outputs are a bug, not a result.
- Consent, newsletter, and region overlays (OneTrust, marketing popups)
  intercept clicks. Dismiss the overlay via its own button, then re-snapshot;
  refs shift once it closes.

## Recipe: authenticated work

Commands in the current task and agent session reuse its managed browser
target. Cookies and durable site storage use the workspace's persistent browser
profile. Open the login page, let the user enter credentials or complete
same-target OAuth redirects and two-factor steps in the visible browser, then
wait for and verify the authenticated state.
Do not ask for secrets in chat or pass them through commands. See
[`references/authentication.md`](references/authentication.md).

## Recipe: downloads and captured files

Use `download`, not `click`, on a control that triggers a browser download:

```bash
agent-browser snapshot -i
agent-browser download @e5 work/report.pdf
```

The command authorizes the transfer and waits for it. Inline PDF, image, SVG,
and HTML responses do not produce a download event. For those, use the
discovered public URL or same-origin `fetch()` in browser context; when a shell
downloader is simplest, keep flags minimal, since the sandboxed `curl` rejects
some options (for example `--retry`). Check the command's reported output path,
which may differ from the requested path, then inspect the saved file and
confirm its type and content: a CDN resize URL can return a different format
than its extension or query implies (a `.jpg` name serving a transparent PNG).

## Recipe: diagnose a web workflow

Reproduce the smallest failing interaction, then collect evidence in this
order:

1. Current URL, visible text, and screenshot.
2. Browser console and page errors.
3. Relevant XHR or fetch requests and their responses.
4. Trace or profiler output only for a performance-specific question.

```bash
agent-browser get url
agent-browser screenshot
agent-browser console
agent-browser errors
agent-browser network requests
```

Save an explicit baseline before using `diff snapshot --baseline` or
`diff screenshot --baseline` for before-and-after assertions.
For app-specific diagnostics, `vitals` measures Web Vitals, `pushstate`
navigates an SPA without a reload, and `react` exposes the component tree when
the page was opened with the React DevTools hook. See the command reference for
their setup and limits.

## Open a reference when

| Situation                                                                | Reference                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Need exact command syntax, downloads, dialogs, diffs, or app diagnostics | [`references/commands.md`](references/commands.md)                     |
| A ref is stale, targeting fails, or an iframe is involved                | [`references/snapshot-refs.md`](references/snapshot-refs.md)           |
| Login, OAuth, two-factor, or session expiry is involved                  | [`references/authentication.md`](references/authentication.md)         |
| Need persistence, sequential page work, or a clean site state            | [`references/session-management.md`](references/session-management.md) |
| Connectivity or proxy behavior differs from expectations                 | [`references/proxy-support.md`](references/proxy-support.md)           |
| Diagnosing loading or interaction performance                            | [`references/profiling.md`](references/profiling.md)                   |
| Capturing a reproducible browser walkthrough                             | [`references/video-recording.md`](references/video-recording.md)       |

The optional `templates/capture-workflow.sh` starting point captures readable
text, interaction structure, a viewport image, and a full-page PDF. Inspect and
customize it before use.
