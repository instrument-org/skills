# Drop tab guidance from the agent-browser skill until the browser supports multiple pages

## Context

Instrument's managed browser is one `<webview>` guest per task and agent session, reached over a CDP bridge that intercepts `Target.createTarget` and redirects it to the existing target, navigating it when a URL was requested. There is no second page for a tab command to address.

The upstream `agent-browser` CLI still ships `tab`, `window new`, and `click --new-tab`, and against the bridge they fail in the worst available way: silently. `tab new <url>` reports success, `tab list` then shows two entries that are one target, and switching between them lands on whichever page the single target currently holds. Every command exits 0, so nothing in the transcript marks the point where the agent started reading the wrong page.

The skill named all three commands in four files, always as a prohibition. That is accurate but self-defeating: a prohibition is still an advertisement, and an agent told a command exists will reach for it under pressure. A validation run confirmed the failure mode end to end — the agent read the "do not use tabs" line, then produced a coherent-looking two-tab session against one page.

## Decision

Remove the command names. The skill states the constraint as a property of the browser (one page target; additional pages and popup workflows unavailable) and no longer enumerates the commands that would violate it.

Page-level behavior that is true regardless of tab support stays: popups from `window.open`, `target=_blank`, and equivalent link behavior are still denied, and the guidance to follow links by opening a URL discovered with `snapshot -i --urls` is unchanged.

## Restoring it when the browser supports multiple pages

Multi-page support is expected. When it lands, recover the removed guidance from commit `5484f2a` rather than rewriting it: that diff is the full inventory of where tab behavior needed describing, across `SKILL.md`, `references/commands.md`, `references/session-management.md`, and `references/authentication.md`. Each site needs the opposite treatment — what the commands do, not that they are unavailable — and `authentication.md` in particular gains back a real option, since popup-based OAuth and SSO become reachable once a second page exists.

## Alternatives considered

- **Keep the prohibitions.** Accurate and the status quo, but it leaves the command surface named in four places and relies on the agent obeying a rule it can see a reason to break.
- **Block `tab` in the wrapper's subcommand policy.** Turns a silent wrong answer into a clean refusal, which is strictly better runtime behavior and worth doing on its own. It does not replace this change: the skill would still be describing commands the product refuses.

## Implementation

- Commit `5484f2a` — the removal.
- [`skills/agent-browser/SKILL.md`](../../skills/agent-browser/SKILL.md), [`references/commands.md`](../../skills/agent-browser/references/commands.md), [`references/session-management.md`](../../skills/agent-browser/references/session-management.md), [`references/authentication.md`](../../skills/agent-browser/references/authentication.md)
