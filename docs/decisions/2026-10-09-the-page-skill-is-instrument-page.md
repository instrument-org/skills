# The page skill is instrument-page

Status: accepted, 2026-10-09

## What

The skill that makes one self-contained HTML page is `instrument-page`, and what it makes is an Instrument page. Its description names the term, so "make me an Instrument page" routes to it by name.

## Why

The word a person says has to land on one skill and nothing else. "Page", "doc", "canvas" and "artifact" each already name something an agent knows how to make, and an agent asked for one builds that thing without asking. A bare `create-page` installed into a third party's agent reads as a generic verb next to the host's own page and artifact tools, which is how agents in Claude Code came to publish these pages as claude.ai Artifacts.

"Instrument page" pairs the brand, which an agent without the skill does not recognize, with the plainest noun for the thing. It is what a person says when sending one ("I'll send Neil the Instrument page"), and it is what every shared copy's address already reads: `<id>.instrument.page`. "Page" covers the whole range, from a three-line note to an interactive tool, where "doc" pictures text and "site" overstates the small ones.

## Options weighed

- Keep `create-page`. The description change in the same week fixed routing on its own, so the rename is for the person and the third-party installer, not the agent.
- Instrument doc. Fits the "new document format" framing and the small pages, undersells the interactive ones, and does not match the link.
- A coined word. Every candidate was either unfamiliar enough that nobody would remember it or familiar enough that an agent already had a meaning for it.

## Cost

Consumers pin a version, so each renames on its next bump: the app's skill name constant and catalog weighting, and the website's fetched skill name and install command.
