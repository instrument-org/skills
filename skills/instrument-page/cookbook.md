# Cookbook

These are techniques rather than components, so change anything you need to. Read only the recipe your hero needs.

## Drawing at true size from data

Every chart, plan and strip on a page uses this technique. The data sits in the page as JSON, and a small script draws the SVG at the real pixel width of its box. A 12px label is then 12px on a phone and on a desktop, and no text scales down until it can't be read. The drawing redraws whenever its box changes size.

```html
<figure class="hero" id="fig">
  <svg role="img" aria-label="What the drawing shows, in one sentence"></svg>
  <figcaption>What it shows and where the numbers come from.</figcaption>
</figure>
<script type="application/json" id="data">
  {"series": [ ... ]}
</script>
<script>
  const D = JSON.parse(document.getElementById("data").textContent);
  // Draws into fig's svg at its real pixel width. draw(w) returns {h, svg}.
  function fit(fig, draw) {
    const svg = fig.querySelector("svg");
    const go = () => {
      const cs = getComputedStyle(fig);
      const w = Math.round(
        fig.clientWidth -
          parseFloat(cs.paddingLeft) -
          parseFloat(cs.paddingRight),
      );
      const { h, svg: inner } = draw(w);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
      svg.innerHTML = inner;
    };
    go();
    new ResizeObserver(go).observe(fig);
  }
  // Rough text width in px, for deciding whether a label fits.
  const tw = (s, size = 12) => String(s).length * size * 0.56;
  // Pushes labels apart vertically so none overlap: items are {y}, sorted in place.
  function spread(items, gap = 15) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++)
      items[i].y = Math.max(items[i].y, items[i - 1].y + gap);
    return items;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
</script>
```

- Set labels at 12 to 14px, and use `font-weight="600"` for the ones that matter. A label on a colored fill uses `class="paper"`. Put long names in HTML beside the drawing, as a key or a list, instead of inside it.
- Check `width < 560` inside `draw` to give phones their own version, with fewer ticks, labels moved under the drawing, and a taller, narrower shape.
- Take colors from classes and attributes (`class="muted"`, `data-c="2"`, `data-tone="bad"`, or `class="outline"` for a stroke) and never from hex, so dark mode and print work.

## A chart that carries the headline

The chart should show the point, and the data only as far as it supports the point. If the headline says the night shift caused the problem, draw the night shift as the colored line and everything else in gray.

```js
fit(document.getElementById("fig"), (w) => {
  const h = w < 560 ? 260 : 320,
    L = 40,
    R = w < 560 ? 12 : 130,
    T = 16,
    B = 28;
  const xs = D.months,
    max = 60,
    min = -20;
  const x = (i) => L + (i / (xs.length - 1)) * (w - L - R);
  const y = (v) => T + ((max - v) / (max - min)) * (h - T - B);
  let s = "";
  for (const v of [-20, 0, 20, 40, 60])
    s += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" class="faint"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" class="muted">${v}</text>`;
  xs.forEach((m, i) => {
    if (w >= 560 || i % 2 === 0)
      s += `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" font-size="12" class="muted">${m}</text>`;
  });
  const ends = [];
  D.series.forEach((row) => {
    const pts = row.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    s += `<polyline points="${pts}" class="outline" ${row.point ? `data-tone="bad" stroke-width="3"` : `style="--tone: var(--line-2)" stroke-width="2"`}/>`;
    ends.push({ y: y(row.values.at(-1)), name: row.name, point: row.point });
  });
  if (w >= 560)
    for (const e of spread(ends))
      s += `<text x="${w - R + 8}" y="${e.y + 4}" font-size="13" ${e.point ? `font-weight="650" data-tone="bad"` : `class="muted"`}>${esc(e.name)}</text>`;
  D.events.forEach((ev, i) => {
    const X = x(ev.at),
      right = X + tw(ev.label) + 8 > w - (w < 560 ? 0 : R),
      Y = T + 10 + (w < 560 ? i * 15 : 0); // flip near the edge; stagger on phones
    s += `<line x1="${X}" x2="${X}" y1="${T}" y2="${h - B}" class="outline" stroke-dasharray="3 3" style="--tone: var(--muted)"/><text x="${right ? X - 4 : X + 4}" y="${Y}" text-anchor="${right ? "end" : "start"}" font-size="12" font-weight="600">${esc(ev.label)}</text>`;
  });
  return { h, svg: s };
});
```

- Color one series and leave the rest muted. Name each line at its end instead of in a legend. On a phone, name the lines in the caption or in a `.row` of `.dot` labels under the chart.
- Mark three events at most, each with a short label.
- Bars that compare a few things often work better as HTML: rows of `<div class="bar" style="--v:62%">` with the label and the value written as text. They reflow on phones with no extra work.
- When you draw options over time, draw each one only as far as it really runs. A contract or subscription that ends at month 24 stops at month 24, unless the inputs say what happens next (it renews, you buy it out, you hand it back). In that case, draw and label that step.
- Never give a percent change for a score that crosses zero. Give the change in points.

## A plan drawn to scale

Draw a place only from facts, meaning dimensions the inputs give or positions they state ("north fence", "east half"). If the inputs give neither, use a list or a table, because a guessed sketch misleads.

```js
// D.site = {w: 60, h: 30, unit: "ft", north: "up"}, D.areas = [{id: 1, name: "Check-in", x: 2, y: 1, w: 12, h: 6, c: 1}]
fit(document.getElementById("fig"), (w) => {
  const k = w / D.site.w,
    h = Math.round(D.site.h * k) + 24;
  let s = `<rect x="0" y="0" width="${w}" height="${D.site.h * k}" class="line" rx="4"/>`;
  for (const a of D.areas) {
    const X = a.x * k,
      Y = a.y * k,
      W = a.w * k,
      H = a.h * k;
    s += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" class="wash" data-c="${a.c}" rx="3"/><rect x="${X}" y="${Y}" width="${W}" height="${H}" class="outline" data-c="${a.c}" rx="3"/>`;
    const label = tw(a.name, 13) < W - 10 && H > 22 ? a.name : String(a.id);
    s += `<text x="${X + 6}" y="${Y + 17}" font-size="13" font-weight="600">${esc(label)}</text>`;
  }
  s += `<text x="0" y="${h - 6}" font-size="12" class="muted">${D.site.w} ${D.site.unit} wide · north is up</text>`;
  return { h, svg: s };
});
```

- Leave room for the label above anything you draw inside an area.
- When a name doesn't fit, show the area's number instead, and list the numbers in an HTML key right under the drawing (an `ol` with the same numbers), so a phone reader still gets every name.
- To show change over time, draw two or three small snapshots side by side (`.grid style="--min:16rem"`), each titled with its dates, instead of adding arrows and notes to one drawing.
- Draw the surroundings (doors, windows, a street, a parking lot) once around the whole site, on the side where the inputs put them.

## A month or week grid

Write the days as HTML, so the page reads without script and you can edit a single day. Wide screens get seven columns. On a phone, each week becomes a list of the days that have something on them. Seven columns need the room, so this grid takes `.bleed`.

```html
<style>
  .month {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    border-top: 1px solid var(--line);
  }
  .month > div {
    min-height: 6rem;
    padding: 0.35rem;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--tone-wash);
  }
  .month .d {
    font: 600 0.8rem var(--body-font);
    color: var(--muted);
  }
  @media (max-width: 40rem) {
    .month {
      grid-template-columns: 1fr;
    }
    .month > div {
      min-height: 0;
      display: grid;
      grid-template-columns: 4rem 1fr;
    }
    .month > .quiet,
    .month .dow {
      display: none;
    }
  }
</style>
<div class="month bleed hero">
  <div class="dow label">Mon</div>
  ...
  <!-- seven -->
  <div data-c="1" data-date="2026-10-01">
    <span class="d">Thu 1</span> <span class="tag">Swim 4pm</span>
  </div>
</div>
```

Color each cell by who it belongs to (`data-c`), show events as `.tag`s, and give days with nothing on them `class="quiet"`. Generate the cells with a script (see the last recipe), so the weekdays are computed.

## A timeline

A vertical list works best on a phone, and often on a desktop too.

```html
<style>
  .tl {
    list-style: none;
    padding: 0;
    border-left: 2px solid var(--line-2);
    margin-left: 4.6rem;
  }
  .tl li {
    position: relative;
    padding: 0 0 0.9rem 1rem;
  }
  .tl time {
    position: absolute;
    left: -5.4rem;
    width: 4.5rem;
    text-align: right;
    font: 600 0.82rem var(--mono);
    color: var(--muted);
  }
  .tl li::before {
    content: "";
    position: absolute;
    left: -0.42rem;
    top: 0.4rem;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: var(--pill);
    background: var(--tone);
  }
</style>
<ol class="tl">
  <li data-tone="bad">
    <time>14:02</time> A config push shrinks the connection pool from 50 to 5.
  </li>
</ol>
```

For a horizontal strip (days across, with a row for each person, vehicle or system), draw it with `fit` from the first recipe, and switch to this list when `w < 560`. Lanes, with one row for each thing whose state changes on a shared clock, make a natural hero for an incident. Color the span where each lane goes wrong, and put the readings under them on the same x axis.

- Tone the one or two events that explain the rest (`data-tone="bad"` on the `li`) and leave the others plain. When the order itself is the point, say it in the `h1` or the lede, and keep the section heading a label, such as Timeline.
- Mark what is estimated or reconstructed (`<small>approx.</small>`) and what is still ahead, as a dashed segment (`li.ahead { border-left: 2px dashed var(--line-2); margin-left: -2px; }`). Write today's date on the page, so a reader a month from now knows where the line stood.
- Show a long gap as a break instead of stretching the line to scale: `<li class="gap"><time>...</time> 14 months, nothing relevant</li>`, styled muted.

## A comparison matrix

Put the options across the top and the attributes down the side, or the other way round when there are more options than attributes. Include only the attributes the reader's decision depends on, rather than every spec the makers publish, and put the deciding row first.

```html
<div class="scroll hero">
  <table class="cards">
    <thead>
      <tr>
        <th scope="col">Desk</th>
        <th scope="col">Height range</th>
        <th scope="col">Wobble at full height</th>
        <th scope="col">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr data-tone="accent">
        <th scope="row">
          <a href="https://www.upliftdesk.com/">Uplift V2</a>
          <span class="tag" data-tone="accent">Pick</span>
        </th>
        <td data-label="Height range">25.3 to 50.8 in</td>
        <td data-label="Wobble">
          <span class="tag" data-tone="good">Low</span>
        </td>
        <td data-label="Price" class="n">$599</td>
      </tr>
      <tr>
        <th scope="row"><a href="https://www.ikea.com/">IKEA Bekant</a></th>
        <td data-label="Height range">25 to 49 in</td>
        <td data-label="Wobble">
          <span class="tag" data-tone="warn">Some</span>
        </td>
        <td data-label="Price" class="n">$449</td>
      </tr>
    </tbody>
  </table>
</div>
```

- `table.cards` turns each row into a card on a phone, with each `td`'s `data-label` as its label and the row header (`th scope="row"`) as the card's name.
- Give a judged cell a word on a coarse scale (`Low / Some / High`, a letter, or two or three dots), toned by what it means, with the evidence a click away in a footnote or a `details` row. Never use a decimal.
- When nobody could fill a cell, write "not published" in it. A dash reads as zero.
- Highlight the row or column that decides the comparison, and the pick if there is one, with a single tone. Leave everything else plain, so the eye goes to the difference.
- With more than about seven options or ten attributes, you have a data table rather than a matrix. Sort it by the attribute that matters, put the shortlist in the hero, and put the full table in the evidence.

## A ranked pick with one chosen

When the reader asked which one to choose, the hero is the answer with its reasons, followed by the others in order, each with the one thing that put it in that place.

```html
<ol class="plain stack hero">
  <li class="panel" data-tone="accent">
    <p class="label">Our pick</p>
    <h3><a href="https://www.upliftdesk.com/">Uplift V2</a></h3>
    <p>
      It's the steadiest at standing height, which is the problem you started
      with, and it costs $150 more than the next one.
    </p>
    <p><small>It loses on price and a three-week lead time.</small></p>
  </li>
  <li class="panel">
    <h3>2. <a href="https://www.ikea.com/">IKEA Bekant</a></h3>
    <p>
      It fixes about half the wobble for $450. Buy it if the budget is fixed.
    </p>
  </li>
</ol>
```

- Say why the pick won, in the reader's terms, and what it loses on. A pick with no downside reads like an ad.
- Say what would change the answer ("if you need it under $500, get the Bekant"), so a reader who weighs things differently can still use the page.
- When the honest answer combines two options, such as a NAS plus an offsite backup, give the combination its own row and pick it.
- If two options are close, say so and pick one anyway, or say plainly that there's no winner and what to check to break the tie. Never invent a margin.
- The order is your judgment. If there are scores, keep them coarse, and put every input behind them on the page.

## Steps and a checklist

Use `ol.steps` for things to do in order, and `ul.todo` for things to have or check in any order, each drawn as an empty box. Start each item with a verb, put any warning on the step it applies to instead of in a section at the end, and say how the reader knows the step is done.

```html
<ol class="steps hero">
  <li>
    <span
      ><b>Shut the water off at the stop valve.</b> It's under the kitchen sink;
      turn it clockwise.
      <small>You're done when the cold tap runs dry.</small></span
    >
  </li>
  <li data-tone="warn">
    <span
      ><b>Drain the tank before you lift it.</b> It holds about 3 gallons and
      cracks if you drop it.</span
    >
  </li>
</ol>
<ul class="todo">
  <li>Adjustable wrench</li>
  <li>Two towels</li>
</ul>
```

- When there are more than about eight steps, group them by phase, with an `h2` for each phase and its time if the inputs give one.
- A checklist the reader will tick on screen gets real checkboxes (`<label><input type="checkbox"> Item</label>`). Remembering the ticks in `localStorage` is a convenience, so wrap it in try/catch. A checklist that will be printed stays `ul.todo`, which prints as empty boxes.
- Use `ul.ticks` for what is already done, proven or settled, with a check mark for each item. `data-tone="bad"` on an item draws a cross instead, for a drawback listed beside the strengths or a check that failed. Never draw a finished item as an empty box.
- Put what to have before starting at the top, and put what to do if something goes wrong in one `details` at the step it applies to.

## Screenshots and a walkthrough

When the evidence is what a screen looked like (a change you shipped, a bug you reproduced, the same flow on three systems), the screenshots are the hero and the words are captions. Lead with a contact sheet of the moments that prove the point, then give each claim a section with the screenshot that shows it.

```html
<section class="hero">
  <div class="frames">
    <figure>
      <img
        src="shots/1-saved.png"
        width="1600"
        height="1084"
        alt="A chat that saved a memory, with a line under the reply naming the file"
      />
      <figcaption>The line under the reply names the memory's file.</figcaption>
    </figure>
    <figure>
      <img
        src="shots/2-windows.png"
        width="1600"
        height="1086"
        alt="The same install on Windows, with the same two lines"
      />
      <figcaption>The same install on Windows.</figcaption>
    </figure>
  </div>
</section>
<section>
  <h2>Before and after</h2>
  <div class="pair">
    <figure>
      <img src="shots/before.png" width="1600" height="1000" alt="..." />
      <figcaption>Before the fix, the file showed as Missing.</figcaption>
    </figure>
    <figure>
      <img src="shots/after.png" width="1600" height="1000" alt="..." />
      <figcaption>After the fix, it opens beside the chat.</figcaption>
    </figure>
  </div>
</section>
```

- Capture the whole window and keep each screenshot up to 1600 pixels wide ([`references/images.md`](references/images.md)). Every one opens full size in the page's viewer, and the arrow keys step the reader through all of them in page order, so the page needs no zoom script and no hint to click.
- Never crop a screenshot to even out a grid. `.frames` numbers its cells and letterboxes pictures of different shapes into one shape, so set `--ratio` to the shape most of them share.
- A caption says what to look at in the picture, in one short sentence. The `alt` text describes what the picture shows, for a reader who can't see it.
- Show each screenshot once, and refer back to it by its number.

## Figures with a chart

Use this for "how did it go" and "what do the numbers say". Lead with one or two figures that carry the point, each with what it's compared against, then the chart that shows the comparison, then the table.

```html
<div class="row hero">
  <p class="stat">
    <b>11%</b
    ><span>of requests failed on Oct 2, against under 1% the week before</span>
  </p>
</div>
<figure id="fig">
  <svg role="img" aria-label="Failure rate by day, flat until Oct 2"></svg>
  <figcaption>
    Daily failure rate, Sep 25 to Oct 3, from the gateway logs.
  </figcaption>
</figure>
```

- A figure means little without its comparison (the last period, the target, the other option), so name the period and the source next to it.
- Set two figures big at most, and put the rest in the chart or a table. Nobody reads a row of six big numbers.
- Draw the chart from the page's JSON, and put the same data in a table under it or in a `details`, so the page says everything with scripts turned off. The chart recipe above shows how.
- Round only as far as the source supports, and say "about" when you round. Show a change as the change itself ("up 4 points") along with its base, never as a percent of a percent.

## Scores, sources and the pick

These rules apply to every page that judges anything, wherever the judging sits on the page.

- **Keep scores coarse.** Use letters, a word on a three-step scale, or a few dots, unless every input to the score is on the page and the arithmetic is shown. Never use a decimal like 7.8 out of 10, which suggests more precision than the research has.
- **Give every number a source.** It comes from the inputs, a named source with its date, or arithmetic over figures shown on the page. Say so wherever a figure is your estimate.
- **Link named things to their maker.** Link a product, vendor or place to its maker's or owner's own home page, which keeps working when someone copies the page. Don't link a deep product page, a search result or an affiliate link.
- **Make the pick honestly.** Pick the reader's best option under the constraints they gave, show what it loses on, name what would change the answer, and give a sponsored or default option no extra weight.

## Show my part

Mark everything that belongs to someone with `data-who`. Separate names with spaces for shared things, and use `data-who="all"` for things that should never dim. Then add the buttons. `page.html#who=leo` opens on Leo's view, so each person can get a link of their own.

```html
<nav class="row sticky" aria-label="Show one person">
  <span class="label">Show</span>
  <button data-show-who="maya" data-c="3">Maya</button>
  <button data-show-who="leo" data-c="5">Leo</button>
</nav>
```

To do more than dim, use `.only-leo { display: none } [data-showing="leo"] .only-leo { display: block }`.

## A slider that recomputes

When the answer depends on one number the reader knows better than you do (hours of use a week, headcount, price per unit), let them move it. The page still states the answer for the value in the inputs.

```html
<p class="row">
  <label for="yrs">Years of use</label>
  <input id="yrs" type="range" min="1" max="10" value="4" />
  <output id="yrsOut">4</output>
</p>
<p class="stat"><b id="gap">$0</b><span id="gapNote">difference</span></p>
<script>
  const yrs = document.getElementById("yrs");
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const update = () => {
    const n = +yrs.value;
    document.getElementById("yrsOut").textContent = n;
    const a = D.a.upfront + D.a.monthly * 12 * n,
      b = D.b.upfront + D.b.monthly * 12 * Math.min(n, D.b.years);
    document.getElementById("gap").textContent = money(Math.abs(a - b));
    document.getElementById("gapNote").textContent =
      (a < b ? "less for A" : "less for B") + " over " + n + " years";
  };
  yrs.addEventListener("input", update);
  update();
</script>
```

## A one-screen card

For a link you'll drop in chat, use the `column` layout with a kicker, a short `h1`, the hero, and at most three short lines under it. Put nothing else above the fold, and let the page end there if that's all it needs. Don't center it vertically. The hero can be one chart, one big figure with its sentence, or a short ranked list with the pick marked.

## A print sheet

The `wide` layout prints landscape. When one table or drawing in a `column` page needs landscape, put `.print-landscape` on `body`. Write anything that should appear only on paper as HTML, such as `<p class="print-only">Printed Oct 3. The link has the current version.</p>`. Use `ul.todo`, or empty table cells with some height, for blanks people fill in by hand. `.page-break` starts a new page. Make one sheet per person or per day if that's how people will use it.

## Evidence and drill-in

Put the evidence at the bottom. That's the table every figure came from, sorted by the number that matters, with its IDs and owners kept, wrapped as `table.cards` or in `.scroll` for phones. Put the arithmetic in one `<details>` whose summary says what's inside ("How we got to $632"). Use `<details>` for one or two optional layers of depth, and never for the point.

## Dense markup from a one-off script

When there are thirty days, eighty seats or a hundred rows, write a short script in the task folder that prints the HTML from the input files, and paste its output into the page. Keep the source data in the page's JSON block, so the next agent can regenerate it.

```js
// node days.mjs > days.html
const fmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
for (let d = 1; d <= 31; d++) {
  const iso = `2026-10-${String(d).padStart(2, "0")}`;
  console.log(
    `<div data-date="${iso}"><span class="d">${fmt.format(new Date(iso))} ${d}</span></div>`,
  );
}
```
