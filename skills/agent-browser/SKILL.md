---
name: agent-browser
description: Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Browser Automation with agent-browser

`agent-browser` is pre-installed and ready to use. The browser session is managed for you and persists across invocations within a project — just run commands.

> Pass any path you like to `download` and `screenshot`; the command's output reports the actual saved location, which may differ.

## Core Workflow

> **IMPORTANT — URL Discovery:** Never fabricate specific or deep URLs (paths, category IDs, query strings) from memory — these change and your training data is likely stale. Well-known root domains (`amazon.com`, `github.com`, etc.) are fine as a starting point. For anything more specific, discover the URL first: use a search tool, follow links from a root page, or use a URL the user or a document has provided.

Every browser automation follows this pattern:

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
```

## Command Chaining

The browser persists across `agent-browser` invocations via a background daemon, so chaining commands with `&&` in a single shell call works naturally and is more efficient than separate calls. Use shell features (`&&`, `$(...)`, variables) freely.

```bash
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i
agent-browser fill @e1 "user@example.com" && agent-browser fill @e2 "pass" && agent-browser click @e3
agent-browser open https://example.com && agent-browser screenshot page.png

# Capture output mid-chain and feed it to the next command
URL=$(agent-browser get attr @e3 href) && agent-browser open "$URL"
```

Use `&&` when you don't need to read intermediate output. Run commands separately when you need to parse output first (e.g., `snapshot -i` to discover refs, then act on them).

## Handling Authentication

The harness manages browser sessions, so cookies/localStorage persist across `agent-browser` invocations within a project. Just navigate to the login page, fill credentials, submit, and proceed — subsequent commands are already authenticated. See [references/authentication.md](references/authentication.md) for OAuth, 2FA, and token refresh patterns.

## Essential Commands

```bash
# Navigation
agent-browser open <url>              # Navigate (aliases: goto, navigate)

# Snapshot
agent-browser snapshot -i             # Interactive elements with refs (recommended)
agent-browser snapshot -i --urls      # Include href URLs for links
agent-browser snapshot -s "#selector" # Scope to CSS selector

# Interaction (use @refs from snapshot)
agent-browser click @e1               # Click element
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
agent-browser keyboard type "text"    # Type at current focus (no selector)
agent-browser keyboard inserttext "text"  # Insert without key events
agent-browser scroll down 500         # Scroll page
agent-browser scroll down 500 --selector "div.content"  # Scroll within a specific container
agent-browser scrollintoview @e1      # Scroll element into view

# Upload files
agent-browser upload @e1 ./file.pdf             # Upload single file
agent-browser upload @e1 ./a.png ./b.png        # Upload multiple files

# Get information
agent-browser get text @e1            # Get element text
agent-browser get html @e1            # Get element outer HTML
agent-browser get value @e1           # Get input/select value
agent-browser get attr @e1 href       # Get attribute value
agent-browser get count "li.item"     # Count matching elements
agent-browser get box @e1             # Bounding box (x, y, width, height)
agent-browser get styles @e1          # Computed CSS styles
agent-browser get url                 # Get current URL
agent-browser get title               # Get page title

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

# Tabs
agent-browser tab new                          # Open new tab
agent-browser tab list                         # List open tabs
agent-browser tab 2                            # Switch to tab by index
agent-browser tab close                        # Close current tab

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

**Use `--urls` to avoid re-navigation.** When you need to visit links from a page, use `snapshot -i --urls` to get all href URLs upfront. Then `open` each URL directly instead of clicking refs and navigating back.

**Snapshot once, act many times.** Never re-snapshot the same page. Extract all needed info (refs, URLs, text) from a single snapshot, then chain the remaining actions with `&&`.

**Multi-page workflow:**

```bash
agent-browser open https://example.com && agent-browser snapshot -i --urls
# Read output to extract URLs, then visit each directly:
agent-browser open https://example.com/page1 && agent-browser screenshot
agent-browser open https://example.com/page2 && agent-browser screenshot
```

## Common Patterns

### Downloading Files

`download` and `wait --download` only work for content Chrome treats as a download (responses with `Content-Disposition: attachment`, or MIME types it won't render inline). Use `download` on the element that triggers the file transfer directly — clicking a download link with `click` is silently cancelled by Chrome.

Pass any destination path; the file is saved to a harness-managed downloads directory and the command's output reports the actual path. Read that output to learn where the file ended up.

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

**Inline-rendered content (SVG, HTML, PNG, JPG, most PDFs)** renders in the tab instead of firing a download event, so `download`/`wait --download` will time out. Pick by what you have:

1. **Real asset URL, public:** `curl -fsSL -o ./tmp/logo.svg https://example.com/logo.svg`
2. **Real asset URL, behind login:** `fetch()` it from the page's own origin via `eval` so cookies apply (must be **same-origin** — `www.example.com` and `example.com` differ).
3. **No URL** (inline `<svg>`, canvas, generated content): grab the DOM (`outerHTML`, etc.) via `eval`.

For 2 and 3, pipe the eval output through `jq -r .` to unwrap its JSON-quoted string straight onto disk:

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

Iframe content is automatically inlined in snapshots. Refs inside iframes carry frame context, so you can interact with them directly.

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
agent-browser snapshot -i
agent-browser get text @e5
agent-browser get text body > page.txt

agent-browser snapshot -i --json
agent-browser get text @e1 --json
```

### Visual Browser (Debugging)

```bash
agent-browser --headed open https://example.com
agent-browser highlight @e1
agent-browser inspect
agent-browser record start demo.webm # Record session
agent-browser profiler start         # Start Chrome DevTools profiling
agent-browser profiler stop trace.json
```

Use `AGENT_BROWSER_HEADED=1` to enable headed mode via environment variable.

### Viewport

```bash
agent-browser set viewport 1920 1080          # Set viewport size (default: 1280x720)
agent-browser set viewport 1920 1080 2        # 2x retina (same CSS size, higher res screenshots)
```

The `scale` parameter (3rd argument) sets `window.devicePixelRatio` without changing CSS layout.

### Local Files (PDFs, HTML)

```bash
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser screenshot output.png
```

## Timeouts and Slow Pages

The default timeout is 25 seconds (`AGENT_BROWSER_DEFAULT_TIMEOUT` env var, in ms). For slow pages use explicit waits:

```bash
agent-browser wait --load networkidle
agent-browser wait "#content"
agent-browser wait --url "**/dashboard"
agent-browser wait --fn "document.readyState === 'complete'"
agent-browser wait 5000
```

### Lazy-Loaded Images

`wait --load networkidle` does not trigger lazy loading — only scrolling into the viewport does.

```bash
agent-browser scrollintoview @e1
agent-browser eval 'document.querySelector("img.product-image").src'
```

## JavaScript Dialogs

When a page opens a JavaScript dialog (`alert()`, `confirm()`, or `prompt()`), it blocks all other browser commands (snapshot, screenshot, click, etc.) until the dialog is dismissed. If commands start timing out unexpectedly, check for a pending dialog:

```bash
agent-browser dialog status
agent-browser dialog accept
agent-browser dialog accept "my input"
agent-browser dialog dismiss
```

When a dialog is pending, all command responses include a `warning` field indicating the dialog type and message.

## Ref Lifecycle

Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes. Always re-snapshot after:

- Clicking links or buttons that navigate
- Form submissions
- Dynamic content loading (dropdowns, modals)

```bash
agent-browser click @e5
agent-browser snapshot -i   # MUST re-snapshot
agent-browser click @e1
```

## Annotated Screenshots (Vision Mode)

Use `--annotate` to get a screenshot with numbered labels. Each label `[N]` maps to ref `@eN`. This caches refs so you can interact without a separate snapshot.

```bash
agent-browser screenshot --annotate
agent-browser click @e2
```

Use when the page has unlabeled icon buttons, canvas/chart elements, or you need spatial reasoning.

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

Use `eval` to run JavaScript in the browser context. **Shell quoting can corrupt complex expressions** -- use `--stdin` or `-b` to avoid issues.

> **`eval` returns the script's value, not its stdout.** `console.log(...)` will print `null` because nothing is returned. Always make the **last expression** the value you want — typically wrap your code in `(() => { ...; return x; })()` or `(async () => { ...; return x; })()`. Use `JSON.stringify(...)` to get readable output for objects/arrays.

```bash
# Simple expressions work with regular quoting
agent-browser eval 'document.title'
agent-browser eval 'document.querySelectorAll("img").length'

# Complex JS: use --stdin with heredoc (RECOMMENDED for nested quotes, arrow fns, multiline)
agent-browser eval --stdin <<'EOF'
JSON.stringify(
  Array.from(document.querySelectorAll("img"))
    .filter(i => !i.alt)
    .map(i => ({ src: i.src.split("/").pop(), width: i.width }))
)
EOF
```

For programmatic/generated scripts where heredocs are awkward, `eval -b <base64>` is also available.

## Deep-Dive Documentation

See `references/` for additional detail: ref lifecycle (`snapshot-refs.md`) and authentication patterns (`authentication.md`).
