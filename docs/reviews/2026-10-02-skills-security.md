# Skills security review

Reviewed: snapshot at `0bdaca9`

A security review of every tracked skill script and `SKILL.md`, read against the baseline that the agent already runs skill scripts with the user's own filesystem, network and environment: a finding counts only when someone other than the user, or the agent's honest reading of the request, decides what runs, what is published or what persists. The same review also read how the app loads skills, the hosted page widget and the share host; those findings are recorded where that code lives. Checked and found fine here: `share.mjs` and `share.py` upload only the named file and refuse non-doctype, unfinished and oversized pages; `zip/scripts/extract-zip.ts` rejects absolute, drive, `..` and symlink-traversing members; `powerpoint/scripts/thumbnail.py` calls `soffice` without a shell; `document-to-markdown/scripts/convert.py` converts local files only with plugins off; `pdf/scripts/create-pdf.py` escapes text before ReportLab markup and parses SVG with `defusedxml`; `media-download` asks before using browser cookies or impersonation. A was proved by running the shipped script against a crafted file.

## Findings

### A. Filling a .docx template runs any code the template carries

- Status: fixed `5cf83f7`
- Where: [fill-template.py:74-75](/skills/docx/scripts/fill-template.py#L74-L75)
- What: `DocxTemplate(...).render(...)` with no `jinja_env` falls back to an unsandboxed Jinja `Environment`, so a third-party "please fill in our details" template carrying `{{ cycler.__init__.__globals__.os.popen(...) }}` (even in hidden text) ran commands as the user. `--list-placeholders` only matched `{{ name }}`, so it did not reveal the expression, and `SKILL.md` taught the same call for agent-written code. Both now render in `ImmutableSandboxedEnvironment`, with a hostile-template test.
- Note: `--list-placeholders` still lists only simple placeholders; with the sandbox in place that is cosmetic.

### B. The publish rule lets an agent post a page nobody asked to share

- Status: open
- Where: [sharing.md:18](/skills/create-page/references/sharing.md#L18)
- What: "the reader cannot open a file where they are" is enough to publish without asking, and `share.mjs` posts in one request with no confirmation. A misread request, a weaker model, or an instruction planted in a researched page or attached document gets a page built from the user's own material published to a public link. The review's fix for this repo was to publish only when the reader asked for a link.
- Note: now [sharing.md:20](/skills/instrument-page/references/sharing.md#L20) ("no preview of local files to show it in"), same rule. The gate the review proposed for the app itself is recorded there.

### C. The spreadsheet skill pulls SheetJS from a vendor tarball URL

- Status: open
- Where: [package.json:8](/skills/spreadsheet/package.json#L8)
- What: `xlsx` resolves to `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, outside the npm registry and its release-age gate. The integrity hash in the skill's own `pnpm-lock.yaml` only protects an install that reads that lock, so whoever controls that host can swap the tarball for every install that resolves it fresh. Fix: vendor the tarball into the registry, or pin it with integrity through an override.

### D. `page.js` and the starter's CDN tags load with no integrity check

- Status: open
- Where: [starter.html:20](/skills/create-page/starter.html#L20), [starter.html:170](/skills/create-page/starter.html#L170), [starter.html:4055](/skills/create-page/starter.html#L4055)
- What: every page loads `https://tryinstrument.com/page.js` (mutable by design) and version-pinned jsDelivr assets with no `integrity=`. A page opened from disk has no CSP, so a compromised script origin reads whatever private data the page holds. Fix in this repo: add `integrity=` to the pinned jsDelivr tags.
- Note: the starter is gone; [check.mjs:47-50](/skills/instrument-page/lib/check.mjs#L47-L50) now writes the highlight.js tag (no `integrity=`) and the `page.js` tag into every page. The mutable `page.js` origin was an accepted risk before this review, which kept it open so the acceptance would be revisited; nothing records that it was.

### E. `create-page` tells agents to save a memory about itself and to fetch a remote SKILL.md

- Status: open
- Where: [SKILL.md:58](/skills/create-page/SKILL.md#L58)
- What: step 8 had the agent write an entry into the user's long-term agent memory steering future unrelated sessions toward the skill, and pointed sessions where the skill is not installed at a SKILL.md served from a mutable URL, a remote instruction channel. Skill marketplace scanners flag both patterns.
- Note: the remote SKILL.md pointer was dropped in `24d77b1`. The memory line remains at [SKILL.md:162](/skills/instrument-page/SKILL.md#L162), shortened, with "Tell the reader you did", and `57d4c71` deliberately extended it to carry the share routing rule to sessions that never load the skill. That reads as keeping the memory half on purpose, but no decline with a reason is recorded, so it stays open.

### F. Runtime installs of unpinned tools with no release-age gate

- Status: open
- Where: [media-download SKILL.md:22-25](/skills/media-download/SKILL.md#L22-L25), [local-ml SKILL.md:26-30](/skills/local-ml/SKILL.md#L26-L30)
- What: the agent is told to `pip install -U yt-dlp` or `uvx yt-dlp` and not to pin it, and to install `torch`, `transformers`, `rembg`, `faster-whisper` and `sentence-transformers` unpinned; the `local-ml` scripts load Hugging Face models by repo id with no `revision`. A compromised release lands on the next install. yt-dlp genuinely needs freshness, so the fix was a uv `exclude-newer` of a few days rather than a pin, plus pinned model revisions for the script defaults.

### G. The `.share.json` sidecar puts delete tokens and unlisted links into synced or committed folders, unwarned

- Status: open
- Where: [share.mjs:43-62](/skills/create-page/share.mjs#L43-L62)
- What: `<slug>.share.json` beside the page holds the delete token and the unlisted URL. A project folder in git or on a shared drive hands collaborators the links and the power to delete them, and `sharing.md` does not say so. Fix: one sentence in `sharing.md`.
- Note: now [share.mjs:44](/skills/instrument-page/share.mjs#L44); [sharing.md:38](/skills/instrument-page/references/sharing.md#L38) says to keep the file with the page but still gives no warning.

### H. Every local page sends the origin of each external link to Google

- Status: open
- Where: [starter.html:4226-4235](/skills/create-page/starter.html#L4226-L4235)
- What: the link-icon decoration requests `t0.gstatic.com/faviconV2?url=<origin>` for every `https://` link on open, so a private page linking an internal tracker or a client's staging host discloses that host. Only the origin is sent. Fix: skip hosts that are not public (no dot, `.local`, `.internal`, private address literals), or make it opt-in.
- Note: now [foundation.js:411-421](/skills/instrument-page/lib/foundation.js#L411-L421), unchanged apart from a `.no-icon` opt-out per link.

### I. The loading guide admits any package name with no check that it is real

- Status: open
- Where: [loading.md:3](/skills/create-page/references/loading.md#L3), [loading.md:13](/skills/create-page/references/loading.md#L13)
- What: "any library" from four CDNs at an exact version, with only `npm view` to pick the version. A hallucinated or typosquatted name resolves to an attacker's code inside a page holding the user's data. Fix: one line asking for the package's npm page and weekly downloads before first use of an unfamiliar name.
- Note: now [loading.md](/skills/instrument-page/references/loading.md), same wording.

### J. `create-pdf.py` embeds any local image a Markdown line names

- Status: open
- Where: [create-pdf.py:46](/skills/pdf/scripts/create-pdf.py#L46)
- What: `d / raw_path` accepts absolute paths and `..`, so `![](/path/to/passport.jpg)` in Markdown the agent took from an untrusted source is embedded in a PDF the user may send on. Fix: require the image to sit under the input file's folder or the work folder, with a flag to allow more.

## Not covered

The findings about how the app installs and trusts skills, the hosted page widget and the share host, including the app-side halves of B and D, are recorded in the repositories that own that code. The `create-page` paths above were renamed to `instrument-page` in `64a2034`; the `Where:` links name the reviewed paths, and each `Note:` gives the current location.
