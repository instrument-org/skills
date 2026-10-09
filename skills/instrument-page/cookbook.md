# Cookbook

Techniques, not components: change anything. Read only the recipe your hero needs.

## Drawing at true size from data

Every chart, plan and strip on a page uses this. The data sits in the page as JSON; a small script draws the SVG at the pixel width of its box, so a 12px label is 12px on a phone and on a desktop, and nothing scales into unreadable text. It redraws when the box resizes.

```html
<figure class="hero bleed" id="fig">
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

- Labels are 12 to 14px; `font-weight="600"` for the ones that matter. A label on a colored fill uses `class="paper"`. Put long names in HTML beside the drawing (a key or a list), not in it.
- Use `width < 560` inside `draw` for the phone answer: fewer ticks, labels moved under the drawing, a taller and narrower layout.
- Colors come from classes and attributes (`class="muted"`, `data-c="2"`, `data-tone="bad"`, `class="outline"` for a stroke), never hex, so dark mode and print work.

## A chart that carries the headline

The chart should show the point, not just the data. If the headline says the night shift caused it, the night shift is the colored line and everything else is grey.

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

- One colored series, the rest muted. Name lines at their ends, not in a legend; on a phone, name them in the caption or a `.row` of `.dot` labels under the chart.
- At most three event marks, each a short label.
- Bars comparing a few things are often better as HTML: rows of `<div class="bar" style="--v:62%">` with the label and the value as text. They reflow on phones for free.
- Over time, draw each option only as far as it really runs. A contract or subscription that ends at month 24 stops at month 24 unless the inputs say what happens next (renew, buy out, hand back), and that step is drawn and labeled.
- Never percent-change a score that crosses zero; give the point change.

## A plan drawn to scale

Draw a place only from facts: given dimensions, or positions the inputs state ("north fence", "east half"). If the inputs give neither, use a list or table instead; a guessed sketch misleads.

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

- Leave headroom for the label above anything drawn inside an area.
- Whatever does not fit as a name becomes its number, and the numbers are listed in an HTML key right under the drawing (`ol` with the same numbers), so a phone reader gets every name.
- Draw what changes over time as two or three small snapshots side by side (`.grid style="--min:16rem"`), each titled with its dates, rather than arrows and notes on one drawing.
- Surroundings (doors, windows, a street, a parking lot) are drawn once around the whole site, at the side the inputs put them.

## A month or week grid

Write the days as HTML so the page reads without script and one day can be edited. Seven columns on wide screens; on a phone each week becomes a list of the days that have something.

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

Color a cell by who has it (`data-c`); events are `.tag`s; days with nothing get `class="quiet"`. Generate the cells with a script (see the last recipe) so weekdays are computed.

## A timeline

A vertical list is the phone answer and often the desktop one too.

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
    border-radius: 50%;
    background: var(--tone);
  }
</style>
<ol class="tl">
  <li data-tone="bad">
    <time>14:02</time> Config push lands. <small>pool 50 to 5</small>
  </li>
</ol>
```

For a horizontal strip (days across, rows per person, vehicle or system), draw it with `fit` from the first recipe and switch to this list when `w < 560`. Lanes (one row per thing whose state changes, on one clock) are the natural hero for an incident: color the span where each lane is wrong, and put the readings under them on the same x axis.

- Order is the argument: say in the heading what the order explains ("Every delay traces to the March vendor switch"), and tone the one or two events that carry it (`data-tone="bad"` on the `li`); the rest stay plain.
- Mark what is estimated or reconstructed (`<small>approx.</small>`) and what is still ahead (a dashed segment: `li.ahead { border-left: 2px dashed var(--line-2); margin-left: -2px; }`), and write the date of "now" on the page so a reader in a month knows where the line stood.
- Long gaps get a break rather than false proportion: `<li class="gap"><time>...</time> 14 months, nothing relevant</li>` styled muted.

## A comparison matrix

Options across, attributes down, or the reverse when there are more options than attributes. The attributes are the ones the reader's decision turns on, not every spec the makers publish; the row that decides it goes first.

```html
<div class="scroll bleed hero">
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

- `table.cards` turns each row into a card on a phone, with each `td`'s `data-label` as its label; the row header (`th scope="row"`) is the card's name.
- A judged cell is a word on a coarse scale (`Low / Some / High`, a letter, two or three dots), toned by meaning, with the evidence a click away (a footnote or a `details` row), never a decimal.
- A cell nobody could fill says "not published", not a dash that reads as zero.
- Highlight the row or column that decides it, and the pick if there is one, with one tone. Everything else stays plain, so the eye goes to the difference.
- More than about seven options or ten attributes is a data table, not a matrix: sort it by the attribute that matters, put the shortlist in the hero, and the full table in the evidence.

## A ranked pick with one chosen

When the reader asked "which one", the hero is the answer with its reasons, then the others in order, each with the one thing that put it there.

```html
<ol class="plain stack hero">
  <li class="panel" data-tone="accent">
    <p class="label">Our pick</p>
    <h3><a href="https://www.upliftdesk.com/">Uplift V2</a></h3>
    <p>
      Steadiest at standing height, which is the complaint you started with.
      Costs $150 more than the next.
    </p>
    <p><small>Loses on: price, and a three-week lead time.</small></p>
  </li>
  <li class="panel">
    <h3>2. <a href="https://www.ikea.com/">IKEA Bekant</a></h3>
    <p>
      Half the wobble problem solved for $450; buy it if the budget is fixed.
    </p>
  </li>
</ol>
```

- Say why the pick won in the reader's terms, and what it loses on. A pick with no downside reads as an ad.
- Say what would change the answer ("if you need it under $500, the Bekant") so a reader with different weights can still use the page.
- When the honest answer combines two options (a NAS plus an offsite backup), make the combination its own row and pick it.
- If two are close, say so and pick anyway, or say plainly there is no winner and what to check to break the tie. Never fake a margin.
- The order is a judgment; the scores, if any, are coarse and every input behind them is on the page.

## Steps and a checklist

`ol.steps` for doing things in order, `ul.ticks` for things to have or check, in any order. Each item starts with a verb, carries its own warning where it applies (not in a section at the end), and says how the reader knows it is done.

```html
<ol class="steps hero">
  <li>
    <span
      ><b>Shut the water at the stop valve.</b> Under the kitchen sink, turned
      clockwise. <small>Done when the cold tap runs dry.</small></span
    >
  </li>
  <li data-tone="warn">
    <span
      ><b>Drain the tank before you lift it.</b> It holds about 3 gallons and
      cracks if dropped.</span
    >
  </li>
</ol>
<ul class="ticks">
  <li>Adjustable wrench</li>
  <li>Two towels</li>
</ul>
```

- Group by phase when there are more than about eight steps (`h2` per phase), each phase with its time if the inputs give one.
- A checklist the reader will tick on screen gets real checkboxes (`<label><input type="checkbox"> Item</label>`); remembering ticks in `localStorage` is a convenience, so wrap it in try/catch. One that will be printed stays `ul.ticks`, which prints as empty boxes.
- What to have before starting goes first; what to do if it goes wrong goes in one `details` at the step it applies to.

## Figures with a chart

For "how did it go" and "what do the numbers say": one or two figures that carry the point, each with what it is compared against, then the chart that shows the comparison, then the table.

```html
<div class="row hero">
  <p class="stat">
    <b>11%</b
    ><span>of requests failed on Oct 2, against under 1% the week before</span>
  </p>
</div>
<figure id="fig" class="bleed">
  <svg role="img" aria-label="Failure rate by day, flat until Oct 2"></svg>
  <figcaption>
    Daily failure rate, Sep 25 to Oct 3. From the gateway logs.
  </figcaption>
</figure>
```

- A figure without its comparison (last period, target, the other option) is a number, not a finding. Name the period and the source next to it.
- At most two big figures; the rest go in the chart or a table. A row of six big numbers is a dashboard nobody reads.
- The chart draws from the page's JSON and the same data is in a table under it or in a `details`, so the page says everything with scripts off. See the chart recipe above.
- Round to what the source supports and say "about" when you rounded. A change is shown as the change ("up 4 points"), with the base, never a percent of a percent.

## Scores, sources and the pick

The rules every judging page keeps, wherever the judging sits.

- **Scores are coarse.** Letters, a word on a three-step scale, or a few dots, unless every input to the score is on the page and the arithmetic is shown. Never a decimal (7.8 out of 10) that implies precision the research does not have.
- **Every number has a home**: the inputs, a named source with its date, or arithmetic over figures shown on the page. A figure you estimated says so where it appears.
- **Named things link to their maker.** A product, vendor or place is a link to its maker's or owner's own home page, which survives being copied; not a deep product page, a search result, or an affiliate link.
- **The pick is honest.** It is the reader's best option under their stated constraints, it shows what it loses on, it names what would flip it, and a sponsored or default option gets no thumb on the scale.

## Show my part

Mark everything that belongs to someone with `data-who` (space-separated for shared things, `data-who="all"` for things that never dim), then add the buttons. `page.html#who=leo` opens on Leo's view, so each person can get their own link.

```html
<nav class="row sticky" aria-label="Show one person">
  <span class="label">Show</span>
  <button data-show-who="maya" data-c="3">Maya</button>
  <button data-show-who="leo" data-c="5">Leo</button>
</nav>
```

For more than dimming: `.only-leo { display: none } [data-showing="leo"] .only-leo { display: block }`.

## A slider that recomputes

When the answer depends on one number the reader knows better than you (hours of use a week, headcount, price per unit), let them move it. The page still states the answer for the inputs' own value.

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

For a link dropped in chat (`data-shape="card"`): kicker, a short h1, the hero, and at most three short lines under it. Nothing else above the fold, and the page may end there. Do not center it vertically. The hero can be one chart, one big figure with its sentence, or a short ranked list with the pick marked.

## A print sheet

`sheet` and `wall` print landscape. Print-only furniture is HTML: `<p class="print-only">Printed Oct 3. The link has the current version.</p>`. Blanks to fill by hand are `ul.ticks` or empty table cells with height. `.page-break` starts a new page. One sheet per person or per day if that is how it will be used.

## Evidence and drill-in

The evidence goes at the bottom: the table every figure came from, sorted by the number that matters, IDs and owners kept, wrapped as `table.cards` or in `.scroll` for phones. The arithmetic goes in one `<details>` whose summary says what is inside ("How the $632 was worked out"). Use `<details>` for one or two optional depths; never for the point.

## Dense markup from a one-off script

Thirty days, eighty seats, a hundred rows: write a short script in the task folder that prints the HTML from the input files, paste its output into the page, and keep the source data in the page's JSON block so the next agent can regenerate it.

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
