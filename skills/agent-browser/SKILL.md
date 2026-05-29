---
name: agent-browser
description: Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.
---

# Browser Automation with agent-browser

`agent-browser` is pre-installed; session persists across invocations — just run commands.

> `download` and `screenshot` paths: command output reports the actual saved location, which may differ.

## Important Reminders

**`click`/`hover` refs may be off-screen** — snapshot text does not reflect what is visible.
`click @eN` exits 0 and silently no-ops when the element is below the fold.
Always `scrollintoview @eN && click @eN`. For links, prefer `snapshot -i --urls` then `open "<href>"`.
Use `is visible @eN` to branch on visibility.
_(Remove once vercel-labs/agent-browser#1073 ships.)_

**Never fabricate deep URLs** — paths, IDs, and query strings go stale.
Discover via search, follow links from a root page, or use URLs the user provides.

**`snapshot -i` returns interactive elements only** — not body copy.
To read page text, use `get text body` after `wait --load networkidle`.

## Core Workflow

Every workflow:

1. `agent-browser open <url>`
2. `agent-browser snapshot -i` (add `--urls` when following links)
3. Act on refs — `click`/`hover` always need `scrollintoview` first; `fill`/`select` do not
4. Re-snapshot after any navigation or DOM change

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser scrollintoview @e3 && agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
```

## Reading page content

To read a page rather than interact with it:

```bash
agent-browser open https://example.com
agent-browser wait --load networkidle
agent-browser get text body > page.txt
```

| Goal                           | Command                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| Read visible copy              | `get text body` (redirect to a file on long pages)             |
| Read one region                | `get text main`, `get text article`, or `get text "#selector"` |
| Find controls to click or fill | `snapshot -i` (optionally `--urls`)                            |

`snapshot -i` always filters to interactive elements; re-running it won't reveal more text.

**Accordions/collapsed sections:** `get text body` returns only visible text. Expand first (`scrollintoview @eN && click @eN`), then re-run.

## Command Chaining

Commands share a background session — chain with `&&` for efficiency. Shell features (`$(...)`, variables) work freely.

```bash
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i
agent-browser fill @e1 "user@example.com" && agent-browser fill @e2 "pass" && agent-browser scrollintoview @e3 && agent-browser click @e3
agent-browser open https://example.com && agent-browser screenshot page.png

# Capture output mid-chain and feed it to the next command
URL=$(agent-browser get attr @e3 href) && agent-browser open "$URL"
```

Run separately when you need to read intermediate output (e.g. `snapshot -i` to get refs first).

## Handling Authentication

Session cookies/localStorage persist automatically. Navigate to login, fill credentials, submit — subsequent commands are authenticated. See references/authentication.md for OAuth/2FA patterns.

## Essential Commands

```bash
# Navigation
agent-browser open <url>              # Navigate (aliases: goto, navigate)

# Snapshot — for interaction refs; for page copy use get text body (see "Reading page content")
agent-browser snapshot -i             # Interactive elements with refs (recommended); add -c to compact, -d N to limit depth
agent-browser snapshot -i --urls      # Include href URLs for links
agent-browser snapshot -s "#selector" # Scope to CSS selector
agent-browser snapshot                # Full tree (includes headings + static text)

# Interaction (use @refs from snapshot)
agent-browser click @e1               # Off-screen ref = silent no-op; use scrollintoview @e1 && …
agent-browser click @e1 --new-tab     # Click and open in new tab
agent-browser dblclick @e1            # Double-click element
agent-browser hover @e1               # Hover element (reveals tooltips/menus)
agent-browser focus @e1               # Focus element
agent-browser fill @e2 "text"         # Clear and type text
agent-browser type @e2 "text"         # Type without clearing
agent-browser select @e1 "option"     # Select dropdown option
agent-browser check @e1               # Check checkbox
agent-browser uncheck @e1             # Uncheck checkbox
agent-browser press Enter             # Press key
agent-browser keyboard type "text"    # Type at current focus (no selector); use inserttext to bypass key events
agent-browser scroll down 500         # Scroll page
agent-browser scrollintoview @e1      # Scroll element into view

# Upload files
agent-browser upload @e1 ./file.pdf             # Upload single file
agent-browser upload @e1 ./a.png ./b.png        # Upload multiple files

# Get information
agent-browser get text body           # All visible text (pipe to a file if large)
agent-browser get text @e1            # Element text
agent-browser get html @e1            # Element outer HTML
agent-browser get value @e1           # Input/select value
agent-browser get attr @e1 href       # Attribute value
agent-browser get count "li.item"     # Count matching elements
agent-browser get url                 # Current URL
agent-browser get title               # Page title

# Check element state
agent-browser is visible @e1          # Exit 0 if visible, 1 if not
agent-browser is enabled @e1          # Exit 0 if enabled, 1 if not
agent-browser is checked @e1          # Exit 0 if checked, 1 if not

# Wait
agent-browser wait @e1                # Wait for element
agent-browser wait --load networkidle # Wait for network idle
agent-browser wait --url "**/page"    # Wait for URL pattern
agent-browser wait 2000               # Wait milliseconds
agent-browser wait --text "Welcome"    # Wait for text to appear (substring match)
agent-browser wait --fn "!document.body.innerText.includes('Loading...')"  # Wait for text to disappear
agent-browser wait "#spinner" --state hidden  # Wait for element to disappear

# Downloads (see "Downloading Files" below for full guidance and caveats)
agent-browser download @e1 <path>     # Click an element to trigger a download, save to <path>
agent-browser wait --download <path>  # Wait for an in-progress download to finish

# Cookies & Storage
agent-browser cookies get                      # List all cookies
agent-browser cookies set name value --url https://example.com
agent-browser cookies clear                    # Clear all cookies
agent-browser storage local                    # View localStorage
agent-browser storage session                  # View sessionStorage

# Network
agent-browser network requests                 # Inspect tracked requests
agent-browser network requests --type xhr,fetch  # Filter by resource type
agent-browser network requests --method POST   # Filter by HTTP method
agent-browser network requests --status 2xx    # Filter by status (200, 2xx, 400-499)
agent-browser network request <requestId>      # View full request/response detail
agent-browser network route "**/api/*" --abort               # Block matching requests
agent-browser network route "**/api/user" --body '{"id":1}'  # Mock response body
agent-browser network unroute "**/api/*"       # Remove route
agent-browser network har start                # Start HAR recording
agent-browser network har stop ./capture.har   # Stop and save HAR file

# Debug / Recording
agent-browser console                          # View browser console messages (--clear to reset)
agent-browser errors                           # View page JS errors (--clear to reset)
agent-browser trace start                      # Start Chrome DevTools trace
agent-browser trace stop ./trace.json          # Stop and save trace

# Mouse (low-level)
agent-browser mouse move 100 200               # Move to coordinates
agent-browser mouse down                       # Press left button
agent-browser mouse up                         # Release left button
agent-browser mouse wheel 300                  # Scroll wheel (dy [dx])

# Capture
agent-browser screenshot              # Screenshot to temp dir
agent-browser screenshot --full       # Full page screenshot
agent-browser screenshot @e1          # Screenshot just one element (by ref or CSS selector)
agent-browser screenshot --annotate   # Annotated screenshot with numbered element labels
agent-browser screenshot --screenshot-format jpeg --screenshot-quality 80
agent-browser pdf output.pdf          # Save as PDF

# Clipboard
agent-browser clipboard read                      # Read text from clipboard
agent-browser clipboard write "Hello, World!"     # Write text to clipboard
agent-browser clipboard copy                      # Copy current selection
agent-browser clipboard paste                     # Paste from clipboard

# Dialogs (alert, confirm, prompt, beforeunload)
# By default, alert and beforeunload dialogs are auto-accepted so they never block the agent.
agent-browser dialog accept              # Accept dialog
agent-browser dialog accept "my input"   # Accept prompt dialog with text
agent-browser dialog dismiss             # Dismiss/cancel dialog
agent-browser dialog status              # Check if a dialog is currently open

# Diff (compare page states)
agent-browser diff snapshot                          # Compare current vs last snapshot
agent-browser diff snapshot --baseline before.txt    # Compare current vs saved file
agent-browser diff screenshot --baseline before.png  # Visual pixel diff
agent-browser diff url <url1> <url2>                 # Compare two pages
agent-browser diff url <url1> <url2> --selector "#main"  # Scope to element
```

## Efficiency Strategies

**`--urls` avoids re-navigation:** `snapshot -i --urls` gets all hrefs upfront; `open` each directly rather than clicking below-the-fold refs.

**Snapshot once:** grab refs/URLs once, chain remaining actions with `&&`. For reading, `get text body` once — `snapshot -i` won't include paragraph text.

**Multi-page workflow:**

```bash
agent-browser open https://example.com && agent-browser snapshot -i --urls
# Read output to extract URLs, then visit each directly:
agent-browser open https://example.com/page1 && agent-browser screenshot
agent-browser open https://example.com/page2 && agent-browser screenshot
```

## Common Patterns

### Downloading Files

`download` only works for content Chrome treats as a download (`Content-Disposition: attachment` or non-renderable MIME types). Use it on the element that triggers the transfer — `click` on download links is silently cancelled. Command output reports the actual saved path.

```bash
# Option A: Click a download link/button on the page
agent-browser open https://example.com/downloads
agent-browser snapshot -i
agent-browser download @e5 file.docx          # Output: "Download saved to <actual-path>"

# Option B: Open the file URL directly (only for content Chrome treats as a download)
agent-browser open https://example.com/file.docx
agent-browser wait --download file.docx

# Option C: Extract the href first, then open it
agent-browser get attr @e5 href
agent-browser open <that-url>
agent-browser wait --download file.docx
```

**Inline-rendered content (SVG, HTML, PNG, JPG, PDFs)** won't fire a download event — `download`/`wait --download` will time out. Instead:

1. **Public URL:** `curl -fsSL -o ./tmp/logo.svg https://example.com/logo.svg`
2. **Behind login (same-origin only):** `fetch()` via `eval` so cookies apply
3. **No URL** (inline `<svg>`, canvas): grab via `eval` (`outerHTML`, etc.)

For 2 and 3, pipe through `jq -r .` to unwrap the JSON-quoted string:

```bash
agent-browser eval 'document.querySelector("header svg").outerHTML' | jq -r . > ./tmp/logo.svg

agent-browser eval --stdin <<'EOF' | jq -r . | base64 -d > ./tmp/image.png
(async () => {
  const r = await fetch("/private/image.png", { credentials: "include" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const bytes = new Uint8Array(await r.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
})()
EOF
```

### Form Submission

```bash
agent-browser open https://example.com/signup
agent-browser snapshot -i
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser select @e3 "California"
agent-browser check @e4
agent-browser click @e5
agent-browser wait --load networkidle
```

### Login

```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$USERNAME" && agent-browser fill @e2 "$PASSWORD" && agent-browser click @e3
agent-browser wait --url "**/dashboard"
# Subsequent commands are authenticated; the harness persists session state.
```

### Working with Iframes

Iframe content is inlined in snapshots; refs work directly without frame switching.

```bash
agent-browser open https://example.com/checkout
agent-browser snapshot -i
# @e1 [heading] "Checkout"
# @e2 [Iframe] "payment-frame"
#   @e3 [input] "Card number"
#   @e4 [input] "Expiry"
#   @e5 [button] "Pay"

# Interact directly — no frame switch needed
agent-browser fill @e3 "4111111111111111"
agent-browser fill @e4 "12/28"
agent-browser click @e5

# To scope a snapshot to one iframe:
agent-browser frame @e2
agent-browser snapshot -i         # Only iframe content
agent-browser frame main          # Return to main frame
```

### Data Extraction

```bash
agent-browser open https://example.com/products
agent-browser wait --load networkidle
agent-browser get text body > page.txt   # full page copy
agent-browser snapshot -i                # refs for specific fields
agent-browser get text @e5               # targeted cell or element
```

### Visual Browser (Debugging)

```bash
agent-browser highlight @e1            # Outline a ref on the page (visual confirmation)
agent-browser record start demo.webm   # Start recording the session as a .webm video
agent-browser record stop
agent-browser profiler start           # Start CDP performance tracing
agent-browser profiler stop trace.json # Stop and save the profile
```

### Viewport

```bash
agent-browser set viewport 1920 1080          # Set viewport size (default: 1280x720)
agent-browser set viewport 1920 1080 2        # 2x retina (same CSS size, higher res screenshots)
```

`scale` (3rd arg) sets `devicePixelRatio` without changing CSS layout.

### Local Files (PDFs, HTML)

```bash
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser screenshot output.png
```

## Timeouts and Slow Pages

Default timeout: 25s. For slow pages use explicit waits — prefer element/text/URL waits over `wait N`.

**Lazy-loaded images:** `wait --load networkidle` does not trigger lazy loading. `img.src` will return placeholder URLs until the image is scrolled into view. Always `scrollintoview @eN` before evaluating image src or expecting real URLs from search/listing pages.

```bash
agent-browser scrollintoview @e1
agent-browser eval 'document.querySelector("img.product-image").src'
```

## JavaScript Dialogs

`alert`/`beforeunload` are auto-accepted. `confirm`/`prompt` block all commands until dismissed — if commands time out unexpectedly, check for a pending dialog. Responses include a `warning` field when a dialog is open.

```bash
agent-browser dialog status
agent-browser dialog accept           # or: dialog accept "my input" / dialog dismiss
```

## Ref Lifecycle

Refs are invalidated on any page change (navigation, form submit, dynamic re-render). Always re-snapshot before the next interaction.

## Annotated Screenshots (Vision Mode)

`--annotate` overlays numbered labels; `[N]` maps to `@eN` and caches refs. Use for unlabeled icon buttons, canvas elements, or spatial reasoning.

```bash
agent-browser screenshot --annotate
agent-browser click @e2
```

## Semantic Locators (Alternative to Refs)

```bash
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find placeholder "Search" type "query"
agent-browser find testid "submit-btn" click
agent-browser find nth "tr" 2 click
```

## JavaScript Evaluation (eval)

Runs JS in the browser context. Shell quoting corrupts complex expressions — use `--stdin` (heredoc) or `-b <base64>`.

`eval` returns the script's **value**, not stdout — `console.log` prints `null`. Last expression is the return value; use `JSON.stringify(...)` for objects.

```bash
agent-browser eval 'document.title'

# Nested quotes, arrow fns, multiline — use heredoc:
agent-browser eval --stdin <<'EOF'
JSON.stringify(
  Array.from(document.querySelectorAll("img"))
    .filter(i => !i.alt)
    .map(i => ({ src: i.src.split("/").pop(), width: i.width }))
)
EOF
```

`eval -b <base64>` also available for generated scripts.

## Deep-Dive Docs

See `references/`: `snapshot-refs.md`, `authentication.md`.
