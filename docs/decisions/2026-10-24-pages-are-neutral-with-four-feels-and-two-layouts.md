# Pages are neutral, with four feels and two layouts

Status: accepted, 2026-10-24; the writing and later details added 2026-10-26. Updates [`2026-10-05-create-page-is-a-method-with-kits.md`](2026-10-05-create-page-is-a-method-with-kits.md): the method, the stylesheet, the check, the recipes and the kits stand; what the stylesheet looks like and what the agent picks on `<html>` change.

## Context

The foundation stylesheet carried the Instrument brand into every page: teal as the default accent, an uppercase teal kicker, teal step numbers and tags. Pages are meant to be portable containers for any explainer, so the brand read as a template. Several details looked machine-made: a colored stripe down the side of rounded cards, a ring around every tag, a collapsible section ruled above and below right before the ruled footer, a triangle on each disclosure.

The two attributes the agent set on `<html>` mixed two ideas. Six feels named situations (urgent, warm, crew) next to looks (ledger, festive), so the agent had to map a situation onto a look. Four shapes (card, read, sheet, wall) named how a page is used, but card and read differed by 2rem of column, and sheet and wall were both one wide column. The stylesheet also pushed every grid, card row, flow diagram and four-column table onto a wider track automatically, so most pages had two left edges.

The words read as machine-made too. SKILL.md asked for every section heading to "say something", so the agent squeezed a claim into each one, and the skill's own instructions were written in a clipped, aphoristic voice that agents carried into the pages they wrote.

## Decision

- **Neutral structure, intentional color.** Text, links, rules, labels and the kicker are neutral in every feel. Anything without `data-tone` or `data-c` is gray. The accent shows only where a page marks something, and SKILL.md tells the agent to mark only what carries the point. The kicker is sentence case in Inter.
- **Four feels, named for how they look, picked by what carries the page:** `editorial` when prose does (a serif), `bold` when one fact does (heavy type, one hot color, square corners), `dense` when tables do (small type, tight rows), and `minimal` for everything else. A feel is a look, not a topic: an incident or a deadline takes the feel its content calls for and marks what is urgent with `data-tone="bad"`.
- **Two layouts.** `data-layout` replaces `data-shape`: `column` (the default) or `wide` (a roster or big table; prose keeps a reading width on the same left edge; prints landscape). Card's real content, that a link dropped in chat must make its point on the first screen, is the cookbook recipe "A one-screen card".
- **One left edge.** Everything sits in the column. `.bleed` is the deliberate way out, for a table or chart that needs the room.
- **Plain words.** The `h1` is the one heading that makes a claim. Section headings are labels in the words the field already uses (an incident review's Impact, Timeline and Follow-ups). SKILL.md's "The words" asks for real names, the active voice and spoken word order, and lists the patterns to read aloud for. The skill's own prose (SKILL.md, the cookbook, the references and the kit docs) is written the same way, since agents copy the voice of their instructions.
- **Old names keep working.** The stylesheet draws calm as minimal; warm as editorial; urgent, festive and crew as bold; ledger as dense; card and read as column; sheet and wall as wide. `page.mjs` accepts them, and SKILL.md teaches only the new ones.

## Options weighed

- **Keep situation names and restyle them.** Urgent lost most of its look once kickers and unmarked elements went neutral, and any feel can show urgency through marks. A situation name asks the agent to translate; a look name does not.
- **More feels (swiss, colorful, warm, technical, cute).** Each overlapped another: Swiss with bold, colorful with `data-c` in any feel, warm with editorial, technical with code blocks that already sit well in every feel. Every feel has to be crafted and checked in light, dark and phone, so fewer, better ones won.
- **Keep shapes and fix their widths.** The CSS behind four shapes was two widths; the rest was writing advice, which belongs in the method.
- **Keep modules wide by default and add `.narrow`.** Readers found pages with two edges chaotic; opting in to width is rarer and safer than opting out.
- **A vocabulary of approved headings.** It would fit the pages we had and miss most of the documents people ask for. Principles and a short list of patterns to avoid leave the agent free to use each field's own words.

## Consequences

- `--pill` sets the rounding of buttons, tags, bars, dots and step numbers; bold sets it to 0. `--fill` is the neutral tint for unmarked things. `--bar` is the thickness of a bar, thinner in dense, and SKILL.md asks the agent to size its own chart bars from it.
- A tag is its tone's color on a tint of it, with twice the tint on a dark ground, so a chip reads in both themes. The recipes mark a pick or a recommendation with `data-tone="good"`, and `ul.todo` covers things still to ask, since `ul.ticks` means done or true.
- `foundation.js` draws the connectors in an `ol.flow`, whose boxes wrap onto new rows; with no script, and in print, a plain arrow sits in each gap.
- The footer keeps a hairline rule with space above and below, and a collapsible section has a rule above it only, so the two never stack.
- The layout probe's "cramped" rule now leads with fewer columns or shorter cells before `.bleed`.
- A page using a removed name that never shipped (colorful, swiss, technical) fails the check.
