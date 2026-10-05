// Runs inside the page in Chrome (sent as source by check.mjs). Measures the
// reading rules: headline, hero in the first screen, paragraph length, how
// much of the top of the page is prose, quotes. Returns plain data.
// Self-contained on purpose: no imports, no closures over Node values.
export function spec(opts) {
  const H = opts.H,
    W = document.documentElement.clientWidth;
  const out = {
    W,
    H,
    h1: null,
    title: document.title,
    hero: null,
    blocks: [],
    quotes: [],
    dvFails: [],
    share: null,
    aboveHero: 0,
    aboveHeroText: "",
  };
  const clip = (t, n = 60) => (t || "").replace(/\s+/g, " ").trim().slice(0, n);
  const words = (t) =>
    (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,:/%$€£-]*/gu) || []).length;
  const r0 = (n) => Math.round(n);
  const sel = (el) => {
    const parts = [];
    for (
      let e = el;
      e && e !== document.body && parts.length < 3;
      e = e.parentElement
    ) {
      if (e.id) {
        parts.unshift("#" + e.id);
        break;
      }
      let s = e.tagName.toLowerCase();
      const cls = [...e.classList]
        .filter((c) => !/^(dim|match|today|on)$/.test(c))
        .slice(0, 2);
      if (cls.length) s += "." + cls.join(".");
      parts.unshift(s);
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  };
  const shown = (el) =>
    el.checkVisibility
      ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      : true;
  const y = scrollY;

  // Headline.
  const h1 = document.querySelector("h1");
  if (h1) {
    const r = h1.getBoundingClientRect();
    out.h1 = {
      text: clip(h1.innerText, 160),
      words: words(h1.innerText),
      top: r0(r.top + y),
      bottom: r0(r.bottom + y),
      shown: shown(h1),
    };
  }

  // Hero: the first element marked .hero (or data-hero) that is shown.
  const heroEl = [...document.querySelectorAll(".hero, [data-hero]")].find(
    shown,
  );
  if (heroEl) {
    const r = heroEl.getBoundingClientRect();
    out.hero = {
      where: sel(heroEl),
      top: r0(r.top + y),
      bottom: r0(r.bottom + y),
      height: r0(r.height),
      containsH1: !!(h1 && heroEl.contains(h1)),
    };
  }

  // Text blocks: every text node belongs to its nearest ancestor that is not
  // laid out inline. Words are counted for every block, shown or not, so a
  // long paragraph folded into a <details> still counts.
  const blockOf = (n) => {
    let e = n.parentElement;
    while (e && e !== document.body) {
      if (e instanceof SVGElement) return null;
      const d = getComputedStyle(e).display;
      if (
        !/^(inline|contents)/.test(d) ||
        /^inline-(block|flex|grid|table)$/.test(d)
      )
        return e;
      e = e.parentElement;
    }
    return e;
  };
  const skip = (el) =>
    el.closest(
      "script, style, template, noscript, svg, pre, code, [aria-hidden=true]",
    );
  const map = new Map();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.textContent.trim() || !n.parentElement || skip(n.parentElement))
      continue;
    const b = blockOf(n);
    if (!b || b === document.body) continue;
    if (!map.has(b)) map.set(b, { nodes: [], text: "" });
    const m = map.get(b);
    m.nodes.push(n);
    m.text += n.textContent;
  }
  const range = document.createRange();
  for (const [el, m] of map) {
    const text = m.text.replace(/\s+/g, " ").trim();
    const w = words(text);
    let box = null;
    if (shown(el)) {
      for (const n of m.nodes) {
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.height < 1) continue;
          box = box
            ? {
                l: Math.min(box.l, r.left),
                t: Math.min(box.t, r.top + y),
                r: Math.max(box.r, r.right),
                b: Math.max(box.b, r.bottom + y),
              }
            : { l: r.left, t: r.top + y, r: r.right, b: r.bottom + y };
        }
      }
    }
    const tag = el.tagName.toLowerCase();
    const heading = /^h[1-6]$/.test(tag);
    const inHero = !!(heroEl && heroEl.contains(el));
    const inFooter = !!el.closest("footer");
    out.blocks.push({
      where: sel(el),
      tag,
      words: w,
      text: clip(text, 70),
      box,
      prose: !heading && (tag === "li" || tag === "td" ? w >= 30 : w >= 15),
      inHero,
      inFooter,
      heading,
    });
  }

  // Share of the first two screens taken by prose. Content area is the boxes
  // of every text block plus every drawing; prose is blocks of 15+ words.
  {
    const top = 0,
      bottom = 2 * H;
    const area = (b) =>
      b
        ? Math.max(0, b.r - b.l) *
          Math.max(0, Math.min(b.b, bottom) - Math.max(b.t, top))
        : 0;
    let prose = 0,
      other = 0;
    for (const b of out.blocks) {
      const a = area(b.box);
      if (!a) continue;
      if (b.prose && !b.inFooter) prose += a;
      else other += a;
    }
    for (const m of document.querySelectorAll(
      "svg, img, canvas, video, iframe",
    )) {
      if (m.parentElement && m.parentElement.closest("svg")) continue;
      if (!shown(m)) continue;
      const r = m.getBoundingClientRect();
      if (r.width < 40 || r.height < 24) continue;
      other += area({ l: r.left, t: r.top + y, r: r.right, b: r.bottom + y });
    }
    out.share = {
      prose: r0(prose),
      other: r0(other),
      pct: prose + other ? Math.round((100 * prose) / (prose + other)) : 0,
    };
  }

  // Words above the hero: what a reader must get through before the point is shown.
  if (out.hero && !out.hero.containsH1) {
    const above = out.blocks.filter(
      (b) => b.box && !b.inHero && b.box.b <= out.hero.top + 4,
    );
    out.aboveHero = above.reduce((n, b) => n + b.words, 0);
    out.aboveHeroText = above
      .map((b) => b.text)
      .join(" / ")
      .slice(0, 120);
  }

  // Text spilling out of a visible box (a border or a background) that does not clip it.
  out.spills = [];
  const boxed = (e) => {
    for (
      let a = e;
      a && a !== document.body && a !== document.documentElement;
      a = a.parentElement
    ) {
      if (a instanceof SVGElement) return null;
      const cs = getComputedStyle(a);
      const bg = cs.backgroundColor.match(/[\d.]+/g);
      if (cs.display === "contents") continue;
      const framed =
        parseFloat(cs.borderLeftWidth) > 0 &&
        parseFloat(cs.borderRightWidth) > 0;
      const filled =
        bg &&
        (bg.length < 4 || +bg[3] > 0.1) &&
        cs.backgroundColor !== "rgba(0, 0, 0, 0)";
      if ((framed || filled) && a.getBoundingClientRect().width >= 60) return a;
    }
    return null;
  };
  for (const [el, m] of map) {
    if (!shown(el)) continue;
    const a = boxed(el);
    if (!a) continue;
    const ar = a.getBoundingClientRect();
    if (ar.width >= W - 4) continue;
    for (const n of m.nodes) {
      range.selectNodeContents(n);
      const rs = [...range.getClientRects()].filter((r) => r.width > 1);
      const by = Math.max(
        0,
        ...rs.map((r) => Math.max(r.right - ar.right, ar.left - r.left)),
      );
      if (by > 3) {
        out.spills.push({
          where: sel(el),
          text: clip(n.textContent, 40),
          by: r0(by),
          box: sel(a),
        });
        break;
      }
    }
  }

  // Big figures: numerals set at 36px or more (not the h1), in the first two screens.
  out.bigFigures = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("h1, svg, script, style") || !shown(el)) continue;
    const own = [...el.childNodes]
      .filter((c) => c.nodeType === 3)
      .map((c) => c.textContent)
      .join("")
      .trim();
    if (!/\d/.test(own)) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 36) continue;
    const r = el.getBoundingClientRect();
    if (r.top + y < 2 * H) out.bigFigures.push(clip(el.innerText, 24));
  }

  // Quotes: blockquote, q and anything marked data-quote, with the speaker
  // from data-src or a <cite> inside.
  for (const q of document.querySelectorAll("blockquote, q, [data-quote]")) {
    if (
      q.parentElement &&
      q.parentElement.closest("blockquote, q, [data-quote]")
    )
      continue;
    const c = q.cloneNode(true);
    for (const x of c.querySelectorAll(
      "cite, footer, figcaption, small, .who, [data-src-label]",
    ))
      x.remove();
    const text = (c.textContent || "").replace(/\s+/g, " ").trim();
    const cite =
      q.getAttribute("data-src") ||
      q.querySelector("cite")?.textContent ||
      q.closest("figure")?.querySelector("figcaption cite")?.textContent ||
      "";
    if (text)
      out.quotes.push({
        where: sel(q),
        text,
        src: cite.replace(/\s+/g, " ").trim(),
        device: !!q.closest("[data-device]"),
      });
  }

  // Truth guards a device raised while drawing.
  for (const f of document.querySelectorAll("[data-dv-fail]")) {
    const host = f.closest("[data-device]");
    out.dvFails.push({
      device: host ? host.getAttribute("data-device") : "?",
      where: host ? sel(host) : sel(f),
      msg: f.getAttribute("data-dv-fail"),
    });
  }
  return out;
}
