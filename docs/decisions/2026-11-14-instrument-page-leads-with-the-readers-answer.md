# instrument-page leads with the reader's answer and repeats one unit

Status: accepted, 2026-11-14. Replaces the method in [`2026-10-05-create-page-is-a-method-with-kits.md`](2026-10-05-create-page-is-a-method-with-kits.md); its stylesheet, check, recipes and kits stand. Builds on [`2026-10-24-pages-are-neutral-with-four-feels-and-two-layouts.md`](2026-10-24-pages-are-neutral-with-four-feels-and-two-layouts.md), whose stylesheet the new method sits on.

## Context

The method in `SKILL.md` had ten steps: analyze the inputs, direct a shape, a feel and a hero, lead with the point, write, build and check, and so on. It fixed what the template router got wrong, but in a blind comparison its pages were no better than those of the same model given no guidance at all. Its look helped. What it did not do was make the agent decide what the reader should come away with before deciding anything else.

Reading the pages people had actually made with it, and what they said about them, the same failures recurred:

- a headline that names the topic;
- a first screen that starts the story rather than giving the answer;
- sections that each take a different form, so the reader relearns the page as they scroll;
- drill-ins hidden in `details`;
- a closing block of sources, method and arithmetic that nobody reads.

## How it was tested

Pages were made in clean rooms: headless runs with no user settings, skills or project instructions, one run per page per approach. Two kinds of task:

- five real pages from the team's own work, each rebuilt from its request and material;
- two held-out tasks from the earlier evaluation, whose hidden grader notes name the buried point and the traps.

Up to fourteen approaches ran on each task:

- the method on main;
- no guidance, run with two different model families;
- a host's own built-in page guidance;
- the new method, and the new method with a sketch-first step;
- a second agent critiquing as the reader;
- one screen only;
- pictures with captions and no paragraphs;
- fixed slots;
- a plain document.

A fresh judge agent per task ranked every version blind from desktop and phone screenshots, and from the page text where facts had to be checked. Finally, the reader whose pages these were compared the new method against the method on main, blind, on four of the pages.

## Decision

`SKILL.md` teaches three things, on the neutral stylesheet with its layouts and feels. One change to that stylesheet's record: the default layout is `wide`, not `column`. Every block sits on one left edge with prose at a reading width, because a centered column with wide rows breaking out around it read as text jumping back and forth. `column` stays for a short note that is all prose.

1. **The angle before anything else.** The direction comment records:
   - `reader`: who opens the page;
   - `after`: what they should know, feel or decide after the first screen;
   - `point`: that sentence as the headline;
   - `send`: the line sent with the link;
   - `leave`: what is left out;
   - `unit`: the one thing the page repeats;
   - `conflicts`: where the inputs disagree.

   `after` is often not what the request literally names. A page for a teammate about a bug they reported is about what their report led to.

2. **The first screen holds the whole answer:** a kicker, the point as the `h1`, at most one sentence, then the answer itself in the hero. The hero is the decision and its reason, a few summary bullets, the small table or chart that is the answer, the picture that proves it, or the demo already playing. When the point is an amount, it is a chart of it to one scale. A page that fits on that screen stops there.
3. **Below it, one unit repeated:** a bold one-line claim, the real thing (a screenshot sliced to what changed, a clip, a drawing of the mechanism, a short table), and at most two sentences.
   - Pictures lead.
   - Nothing is hidden behind a click or revealed on scroll; motion plays on open.
   - Items the reader answers are numbered, led by short names, with a recommendation.
   - The `h1` is the only claim; section headings are labels in the field's words.
   - The page ends with its last unit: no footer of sources, method or arithmetic. A source is a link where its fact appears; arithmetic the reader will check is a table that adds up.

## Results

- **The study's five real pages:**
  - The new method placed first to fourth on every one, the best average of the fourteen approaches.
  - The method on main averaged the same as no guidance, in both rounds.
  - The original hand-made pages, the plain document, and one model family with no guidance placed last.
- **The held-out tasks:** the new method placed fourth and sixth of thirteen, behind pictures with captions and the method on main, whose to-scale charts and checkable arithmetic won there. The chart-for-amounts rule restores that strength.
- **The blind two-up:** the reader picked the new method on all four pages. Their reasons were the missing footer, the single left edge and how easily it digested. The look gave the versions away, so this check is weaker than its count suggests.

## Options weighed

- **Keep the ten-step method.** It scored level with no guidance.
- **A second agent critiques as the reader.** It was as good on average and the steadiest of all, but it needs a subagent and a second pass on every page. Its gains come from the same angle-first step the new method makes mandatory.
- **One screen only.** Forcing brevity did well in the first round and poorly once judges were told the reader wants real screenshots below the answer. The new method keeps "a page that fits stops there" without forcing it.
- **Pictures carry it.** It won when the material was screens or numbers and placed near last when it was a mechanism or a conversation.
- **Sketch three visuals first.** It placed first on two pages and thirteenth on another. It drew diagrams where real screenshots existed, and it revealed content on scroll, so stills and link previews showed empty boxes.
- **Fixed slots, a plain document, and a host's own page guidance.** All placed mid-table or lower.

## Consequences

- Pages lose the provenance footer, and the old rule that sources, illustrative figures and thin research are noted there. Each is said where it applies.
- `page.mjs` still requires only `point=` in the direction comment. The other fields are guidance, not checks.
- The judges read stills: motion, and anything a reader types or taps, was invisible to them. Every rank is one run per cell, so a gap of one or two places is noise.
- The next evaluation should draw its tasks from pages their reader studied closely. Pages the reader never read carefully gave the weakest signal.
