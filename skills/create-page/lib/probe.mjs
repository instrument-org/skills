// Runs inside the page in Chrome (sent as source by check.mjs). Measures what
// is drawn and returns plain data; check.mjs turns it into FAIL/WARN lines.
// Self-contained on purpose: no imports, no closures over Node values.
export function probe(opts) {
  // The layout viewport: on a phone, innerWidth grows to fit content that overflows.
  const W = document.documentElement.clientWidth,
    H = document.documentElement.clientHeight || innerHeight;
  const out = {
    W,
    H,
    scrollW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight,
    issues: [],
    blocks: [],
    hidden: "",
    devices: [],
    tokens: [],
  };
  const add = (rule, el, text, measure, extra = {}) =>
    out.issues.push({
      rule,
      where: sel(el),
      text: clip(text),
      measure,
      ...extra,
    });
  const clip = (t) => (t || "").replace(/\s+/g, " ").trim().slice(0, 48);
  const r1 = (n) => Math.round(n);

  function sel(el) {
    if (!el || el.nodeType !== 1) return "?";
    const parts = [];
    for (
      let e = el;
      e &&
      e !== document.body &&
      e !== document.documentElement &&
      parts.length < 4;
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
      else if (e.getAttribute("data-device"))
        s += `[data-device=${e.getAttribute("data-device")}]`;
      parts.unshift(s);
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  }

  const shown = (el) =>
    el.checkVisibility
      ? el.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
          checkOpacity: true,
          checkVisibilityCSS: true,
        })
      : true;
  const srOnly = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (e.nodeType !== 1 || e instanceof SVGElement) continue;
      const s = getComputedStyle(e);
      if (/rect\(0/.test(s.clip) || /inset\(50%/.test(s.clipPath)) return true;
      const r = e.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1 && s.overflow !== "visible")
        return true;
    }
    return false;
  };
  // The share widget and any page-level chrome injected by a host stay out of the measurements.
  const foreign = (el) =>
    !!el.closest(
      "[data-instrument-widget], instrument-share, #instrument-share",
    );

  // ---- color -------------------------------------------------------------
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => {
    if (!c || c === "none" || /^url\(/.test(c)) return null;
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "rgba(0,0,0,0)";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const over = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const m = (k) => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
    return { r: m("r"), g: m("g"), b: m("b"), a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const L1 = lum(a),
      L2 = lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  const opacityChain = (el) => {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement)
      o *= +getComputedStyle(e).opacity;
    return o;
  };
  const pageGround = () => {
    for (const e of [document.body, document.documentElement]) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) return over(c, { r: 255, g: 255, b: 255, a: 1 });
    }
    const dark =
      matchMedia("(prefers-color-scheme: dark)").matches &&
      /dark/.test(getComputedStyle(document.documentElement).colorScheme);
    return dark
      ? { r: 18, g: 18, b: 18, a: 1 }
      : { r: 255, g: 255, b: 255, a: 1 };
  };
  const GROUND = pageGround();
  const SHAPES = new Set([
    "rect",
    "circle",
    "ellipse",
    "path",
    "polygon",
    "polyline",
    "line",
    "use",
    "image",
  ]);
  // Background under a text element: the layers below it at its center, composited.
  function ancestorBackground(el) {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e instanceof SVGElement && e.tagName !== "svg") continue;
      const s = getComputedStyle(e);
      if (
        s.backgroundImage &&
        s.backgroundImage !== "none" &&
        !/gradient/.test(s.backgroundImage)
      )
        return null;
      const c = rgba(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a > 0.95) break;
      }
    }
    let bg = GROUND;
    for (let k = layers.length - 1; k >= 0; k--) bg = over(layers[k], bg);
    return bg;
  }
  // Background under SVG text: the topmost filled shape drawn before it whose
  // fill contains the text's center (by geometry, so pointer-events do not matter).
  function svgBackground(t) {
    const svg = t.ownerSVGElement;
    const r = t.getBoundingClientRect();
    const cx0 = (r.left + r.right) / 2,
      cy0 = (r.top + r.bottom) / 2;
    let hit = null;
    for (const sh of svg.querySelectorAll(
      "rect, circle, ellipse, path, polygon",
    )) {
      if (
        !(sh.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) ||
        sh.contains(t) ||
        !shown(sh)
      )
        continue;
      const b = sh.getBoundingClientRect();
      if (cx0 < b.left || cx0 > b.right || cy0 < b.top || cy0 > b.bottom)
        continue;
      const st = getComputedStyle(sh);
      if (/^url\(/.test(st.fill)) return null;
      const f = rgba(st.fill);
      if (!f || f.a === 0) continue;
      try {
        const m = sh.getScreenCTM()?.inverse();
        if (
          m &&
          sh.isPointInFill &&
          !sh.isPointInFill(new DOMPoint(cx0, cy0).matrixTransform(m))
        )
          continue;
      } catch {
        // Older engines: the bounding box test stands.
      }
      f.a *= +st.fillOpacity * opacityChain(sh);
      hit = f;
    }
    const base = ancestorBackground(svg);
    if (!base) return null;
    return hit ? over(hit, base) : base;
  }
  function backgroundAt(el, x, y) {
    if (el instanceof SVGElement)
      return svgBackground(el.closest("text") || el);
    const sy = Math.max(0, y - H / 2);
    if (Math.abs(scrollY - sy) > 2) scrollTo(0, sy);
    const stack = document.elementsFromPoint(x, y - scrollY);
    const i = stack.indexOf(el);
    if (i < 0) return ancestorBackground(el);
    const layers = [];
    for (let k = i; k < stack.length; k++) {
      const e = stack[k];
      if (e instanceof SVGElement) {
        if (!SHAPES.has(e.tagName)) continue;
        if (e.tagName === "image") return null;
        const s = getComputedStyle(e);
        if (/^url\(/.test(s.fill)) return null;
        const f = rgba(s.fill);
        if (!f || f.a === 0) continue;
        f.a *= +s.fillOpacity * opacityChain(e);
        layers.push(f);
      } else {
        if (k > i && !e.contains(el) && el.contains(e)) continue;
        const s = getComputedStyle(e);
        if (s.backgroundImage && s.backgroundImage !== "none") {
          if (/gradient/.test(s.backgroundImage)) {
            const m = s.backgroundImage.match(
              /(rgba?\([^)]*\)|oklab\([^)]*\)|color\([^)]*\))/,
            );
            if (m) {
              const c = rgba(m[1]);
              if (c) {
                layers.push(c);
                if (c.a > 0.95) break;
              }
            }
            continue;
          }
          return null;
        }
        if (
          e.tagName === "IMG" ||
          e.tagName === "VIDEO" ||
          e.tagName === "CANVAS"
        )
          return null;
        const c = rgba(s.backgroundColor);
        if (c && c.a > 0) {
          c.a *= +s.opacity;
          layers.push(c);
        }
      }
      if (layers.length && layers[layers.length - 1].a > 0.95) break;
    }
    let bg = GROUND;
    for (let k = layers.length - 1; k >= 0; k--) bg = over(layers[k], bg);
    return bg;
  }

  // ---- text leaves ---------------------------------------------------------
  const clipCache = new Map();
  function clipOf(el) {
    if (clipCache.has(el)) return clipCache.get(el);
    // Inclusive: the element's own overflow clips its text too.
    let box = null;
    const p = el;
    if (p && p !== document.documentElement) {
      box = p.parentElement ? clipOf(p.parentElement) : null;
      const s = getComputedStyle(p);
      const tag = p.tagName.toLowerCase();
      const clips =
        (s.overflowX !== "visible" || s.overflowY !== "visible") &&
        !(p instanceof SVGElement && tag !== "svg");
      if (clips && p !== document.body) {
        const r = p.getBoundingClientRect();
        const own =
          tag === "svg"
            ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
            : {
                left: r.left + p.clientLeft,
                top: r.top + p.clientTop,
                right: r.left + p.clientLeft + p.clientWidth,
                bottom: r.top + p.clientTop + p.clientHeight,
              };
        box = box
          ? {
              left: Math.max(box.left, own.left),
              top: Math.max(box.top, own.top),
              right: Math.min(box.right, own.right),
              bottom: Math.min(box.bottom, own.bottom),
            }
          : own;
      }
    }
    clipCache.set(el, box);
    return box;
  }
  const leaves = [];
  const readable = []; // text a reader can reach by scrolling a box, though none of it shows now
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode()) && leaves.length < 5000;) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const el = n.parentElement;
    if (
      !el ||
      /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE|OPTION|DESC)$/i.test(
        el.tagName,
      ) ||
      el.closest("svg title, svg desc, script, style, template")
    )
      continue;
    if (foreign(el) || !shown(el) || srOnly(el)) continue;
    const svg = el instanceof SVGElement;
    let rects;
    if (svg) {
      // A tspan is one line of a multi-line label: measure the line, not the whole label.
      const tEl =
        el.tagName.toLowerCase() === "tspan" ? el : el.closest("text") || el;
      const r = tEl.getBoundingClientRect();
      rects = r.width > 0.5 && r.height > 0.5 ? [r] : [];
    } else {
      const rg = document.createRange();
      rg.selectNodeContents(n);
      rects = [...rg.getClientRects()].filter(
        (r) => r.width > 1 && r.height > 1,
      );
    }
    if (!rects.length) continue;
    // What actually shows: clip to every ancestor that clips its overflow.
    const full = rects.reduce(
      (a, r) => ({
        left: Math.min(a.left, r.left),
        top: Math.min(a.top, r.top),
        right: Math.max(a.right, r.right),
        bottom: Math.max(a.bottom, r.bottom),
      }),
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
    );
    const clipBox = clipOf(svg ? el.closest("text") || el : el);
    if (clipBox) {
      rects = rects
        .map((r) => ({
          left: Math.max(r.left, clipBox.left),
          right: Math.min(r.right, clipBox.right),
          top: Math.max(r.top, clipBox.top),
          bottom: Math.min(r.bottom, clipBox.bottom),
          full: r,
        }))
        .filter((r) => r.right - r.left > 1 && r.bottom - r.top > 1)
        .map((r) => ({
          ...r,
          width: r.right - r.left,
          height: r.bottom - r.top,
        }));
      if (!rects.length) {
        readable.push({ el, svg, full, t });
        continue;
      }
    }
    const box = rects.reduce(
      (a, r) => ({
        left: Math.min(a.left, r.left),
        top: Math.min(a.top, r.top),
        right: Math.max(a.right, r.right),
        bottom: Math.max(a.bottom, r.bottom),
      }),
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
    );
    const cs = getComputedStyle(el);
    let fs = parseFloat(cs.fontSize);
    if (svg) {
      const ctm = (el.closest("text") || el).getScreenCTM();
      if (ctm) fs *= Math.hypot(ctm.a, ctm.b);
    }
    leaves.push({
      n,
      el,
      t,
      svg,
      rects,
      box,
      full,
      fs,
      y: box.top + scrollY,
      x: box.left,
    });
  }

  // ---- blocks: visible text by block, for coverage and number checks ------
  if (opts.collect) {
    const seen = new Set();
    for (const L of [...leaves, ...readable]) {
      let b = L.el;
      if (L.svg) b = L.el.closest("text") || L.el;
      else
        while (
          b.parentElement &&
          b !== document.body &&
          /^inline/.test(getComputedStyle(b).display)
        )
          b = b.parentElement;
      if (seen.has(b)) continue;
      seen.add(b);
      out.blocks.push({
        where: sel(b),
        text: (L.svg
          ? [...b.childNodes].map((c) => c.textContent).join(" ")
          : b.innerText
        )
          .replace(/[ \t]+/g, " ")
          .trim()
          .slice(0, 4000),
        tag: b.tagName.toLowerCase(),
        ill: !!b.closest("[data-illustrative]"),
        dv: !!b.closest("[data-device]"),
      });
    }
    out.hidden = [...document.querySelectorAll("details:not([open])")]
      .map((d) => d.textContent)
      .join("\n")
      .replace(/\s+/g, " ")
      .slice(0, 20000);
    for (const host of document.querySelectorAll("[data-device]")) {
      out.devices.push({
        name: host.getAttribute("data-device"),
        where: sel(host),
        missing: [...host.querySelectorAll("[data-dv-missing]")].map((m) =>
          m.getAttribute("data-dv-missing"),
        ),
        h: r1(host.getBoundingClientRect().height),
      });
    }
    const root = getComputedStyle(document.documentElement);
    out.tokens = (opts.tokens || []).filter(
      (t) => !root.getPropertyValue(t).trim(),
    );
  }

  // ---- overlap ---------------------------------------------------------------
  const L = leaves.slice(0, 3000);
  const pairs = new Set();
  for (let i = 0; i < L.length; i++) {
    const a = L[i];
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j];
      if (b.box.top > a.box.bottom + 40 && !a.svg && !b.svg) continue;
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // Lines of one SVG label are placed by the device together; they cannot collide by accident.
      if (
        a.svg &&
        b.svg &&
        a.el.closest("text") &&
        a.el.closest("text") === b.el.closest("text")
      )
        continue;
      if (
        b.box.left > a.box.right ||
        b.box.right < a.box.left ||
        b.box.top > a.box.bottom ||
        b.box.bottom < a.box.top
      )
        continue;
      let hit = null;
      for (const ra0 of a.rects)
        for (const rb0 of b.rects) {
          // Glyph boxes run from ascender to descender; letters ink a band inside that.
          const ra = {
            left: ra0.left,
            right: ra0.right,
            top: ra0.top + ra0.height * 0.18,
            bottom: ra0.bottom - ra0.height * 0.1,
            width: ra0.width,
            height: ra0.height * 0.72,
          };
          const rb = {
            left: rb0.left,
            right: rb0.right,
            top: rb0.top + rb0.height * 0.18,
            bottom: rb0.bottom - rb0.height * 0.1,
            width: rb0.width,
            height: rb0.height * 0.72,
          };
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (
            x > 2 &&
            y > 3 &&
            x * y > 0.12 * Math.min(ra.width * ra.height, rb.width * rb.height)
          )
            hit = { x, y };
        }
      if (!hit) continue;
      const key = sel(a.el) + "|" + a.t + "|" + b.t;
      if (pairs.has(key)) continue;
      pairs.add(key);
      add(
        "overlap",
        a.el,
        a.t,
        `overlaps "${clip(b.t)}" (${sel(b.el)}) by ${r1(hit.x)}x${r1(hit.y)}px`,
        { other: clip(b.t) },
      );
    }
  }

  // ---- clipped, off-screen, in a scroller --------------------------------------
  const scrollerOf = (el) => {
    for (
      let a = el.parentElement;
      a && a !== document.body && a !== document.documentElement;
      a = a.parentElement
    ) {
      const s = getComputedStyle(a);
      if (
        /(auto|scroll)/.test(s.overflowX) &&
        a.scrollWidth > a.clientWidth + 2
      )
        return a;
    }
    return null;
  };
  for (const lf of [...leaves, ...readable]) {
    if (lf.svg) continue;
    for (
      let a = lf.el;
      a && a !== document.body && a !== document.documentElement;
      a = a.parentElement
    ) {
      const s = getComputedStyle(a);
      const ox = s.overflowX,
        oy = s.overflowY;
      if (ox === "visible" && oy === "visible") continue;
      const r = a.getBoundingClientRect();
      const left = r.left + a.clientLeft,
        top = r.top + a.clientTop,
        right = left + a.clientWidth,
        bottom = top + a.clientHeight;
      const scrollsX = /(auto|scroll)/.test(ox),
        scrollsY = /(auto|scroll)/.test(oy);
      const bx = lf.full;
      const cutX = !scrollsX && (bx.right > right + 2 || bx.left < left - 2);
      const cutY = !scrollsY && (bx.bottom > bottom + 2 || bx.top < top - 2);
      if (cutX || cutY) {
        const by = cutX
          ? Math.max(bx.right - right, left - bx.left)
          : Math.max(bx.bottom - bottom, top - bx.top);
        add(
          "clipped",
          a,
          lf.t,
          `text is cut off by ${r1(by)}px (${cutX ? "width" : "height"} ${r1(cutX ? a.clientWidth : a.clientHeight)}px, overflow ${cutX ? ox : oy}${s.textOverflow === "ellipsis" ? ", ellipsis" : ""})`,
        );
        break;
      }
      if (scrollsX || scrollsY) break;
    }
    if (
      (lf.full.right > W + 2 || lf.full.left < -2) &&
      !scrollerOf(lf.el) &&
      !clipOf(lf.el)
    )
      add(
        "offscreen",
        lf.el,
        lf.t,
        `text spans x ${r1(lf.full.left)}..${r1(lf.full.right)} in a ${W}px window`,
      );
  }

  // ---- SVG: labels outside the drawing, leaving their box, under pins -----------
  for (const t of document.querySelectorAll("svg text")) {
    if (!shown(t) || foreign(t) || !t.textContent.trim()) continue;
    const svg = t.ownerSVGElement;
    if (!svg) continue;
    const a = t.getBoundingClientRect(),
      s = svg.getBoundingClientRect();
    if (!a.width) continue;
    const outBy = Math.max(
      s.left - a.left,
      a.right - s.right,
      s.top - a.top,
      a.bottom - s.bottom,
    );
    if (outBy > 2) {
      add(
        "svg-outside",
        t,
        t.textContent,
        `label sticks ${r1(outBy)}px outside its drawing`,
      );
      continue;
    }
    const cx0 = (a.left + a.right) / 2,
      cy0 = (a.top + a.bottom) / 2,
      ta = a.width * a.height,
      sa = s.width * s.height;
    let best = null;
    for (const sh of svg.querySelectorAll(
      "rect, polygon, path, circle, ellipse",
    )) {
      if (!shown(sh)) continue;
      // A circle counts as a box only as a backdrop drawn before the label (a badge); one drawn after is the covered rule's.
      if (
        /^(circle|ellipse)$/i.test(sh.tagName) &&
        !(sh.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)
      )
        continue;
      const st = getComputedStyle(sh);
      if (
        (st.fill === "none" || rgba(st.fill)?.a === 0) &&
        st.stroke === "none"
      )
        continue;
      const b = sh.getBoundingClientRect();
      const ba = b.width * b.height;
      if (ba < ta * 1.05 || ba > sa * 0.8 || b.width < 4 || b.height < 4)
        continue;
      if (/^(circle|ellipse)$/i.test(sh.tagName) && ba > ta * 6) continue; // a dial or ring, not a badge
      // The box a label sits in holds its center, or its first letters when it runs out the side.
      const sx = a.left + Math.min(6, a.width / 4);
      const inC =
        cx0 >= b.left && cx0 <= b.right && cy0 >= b.top && cy0 <= b.bottom;
      const inS =
        sx >= b.left && sx <= b.right && cy0 >= b.top && cy0 <= b.bottom;
      if (!inC && !inS) continue;
      if (!best || ba < best.ba) best = { sh, b, ba };
    }
    if (best) {
      const b = best.b;
      const by = Math.max(
        b.left - a.left,
        a.right - b.right,
        b.top - a.top,
        a.bottom - b.bottom,
      );
      if (by > 2)
        add(
          "leaves-box",
          t,
          t.textContent,
          `label is ${r1(a.width)}x${r1(a.height)}px, its ${best.sh.tagName} is ${r1(b.width)}x${r1(b.height)}px; it sticks out ${r1(by)}px`,
        );
    }
    // A filled dot drawn after the label, on top of it.
    for (const c of svg.querySelectorAll("circle, ellipse")) {
      if (
        !(t.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) ||
        !shown(c)
      )
        continue;
      const st = getComputedStyle(c);
      const f = rgba(st.fill);
      if (!f || f.a < 0.5) continue;
      const b = c.getBoundingClientRect();
      if (
        cx0 > b.left &&
        cx0 < b.right &&
        cy0 > b.top &&
        cy0 < b.bottom &&
        b.width * b.height > ta
      )
        continue;
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left),
        y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 2 && y > 2 && x * y > 0.2 * Math.min(ta, b.width * b.height)) {
        add(
          "covered",
          t,
          t.textContent,
          `a filled ${c.tagName} drawn on top covers ${r1(x)}x${r1(y)}px of it`,
        );
        break;
      }
    }
  }

  // ---- tiny text -------------------------------------------------------------
  // A canvas the reader pans and zooms (a board, a map: data-zoom) sets its own text size; the reader zooms in.
  if (opts.tiny)
    for (const lf of leaves)
      if (lf.fs < opts.tiny - 0.05 && !lf.el.closest("[data-zoom]"))
        add("tiny", lf.el, lf.t, `${lf.fs.toFixed(1)}px`, {
          fs: lf.fs,
          svg: lf.svg,
          group: sel(
            lf.el.closest("figure, svg, table, .dv, section") || lf.el,
          ),
        });

  // ---- contrast --------------------------------------------------------------
  if (opts.contrast) {
    const savedY = scrollY;
    const done = new Set();
    for (const lf of leaves) {
      if (done.has(lf.el)) continue;
      done.add(lf.el);
      const s = getComputedStyle(lf.el);
      const fg = rgba(lf.svg ? s.fill : s.color);
      if (!fg) continue;
      fg.a *= opacityChain(lf.el) * (lf.svg ? +s.fillOpacity : 1);
      const cxp = (lf.rects[0].left + lf.rects[0].right) / 2,
        cyp = (lf.rects[0].top + lf.rects[0].bottom) / 2 + scrollY;
      const bg = backgroundAt(lf.el, cxp, cyp);
      if (!bg) continue;
      const shownFg = over(fg, bg);
      const cr = ratio(shownFg, bg);
      if (cr < 3)
        add("contrast", lf.el, lf.t, `contrast ${cr.toFixed(2)}:1`, { cr });
    }
    scrollTo(0, savedY);
  }

  // ---- width: sideways scroll and scrollers holding drawings ---------------------------
  {
    if (opts.phone && out.scrollW > W + 1) {
      const wide = [];
      for (const el of document.body.querySelectorAll("*")) {
        if (el instanceof SVGElement && el.tagName !== "svg") continue;
        if (!shown(el) || foreign(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right <= W + 1 || scrollerOf(el)) continue;
        const p = el.parentElement;
        if (p && p !== document.body && p.getBoundingClientRect().right > W + 1)
          continue;
        const s = getComputedStyle(el);
        wide.push({
          el,
          right: r.right,
          why: [
            s.minWidth !== "0px" && s.minWidth !== "auto"
              ? "min-width " + s.minWidth
              : "",
            s.whiteSpace === "nowrap" ? "white-space nowrap" : "",
            "width " + r1(r.width) + "px",
          ]
            .filter(Boolean)
            .join(", "),
        });
      }
      wide.sort((a, b) => b.right - a.right);
      if (!wide.length)
        add(
          "hscroll",
          document.body,
          "",
          `page is ${out.scrollW}px wide in a ${W}px phone`,
        );
      for (const w of wide.slice(0, 3))
        add(
          "hscroll",
          w.el,
          w.el.innerText || w.el.textContent || "",
          `page is ${out.scrollW}px wide in a ${W}px phone; this element reaches x=${r1(w.right)} (${w.why})`,
        );
    }
    for (const el of document.body.querySelectorAll("*")) {
      if (el instanceof SVGElement || !shown(el)) continue;
      const s = getComputedStyle(el);
      if (
        !/(auto|scroll)/.test(s.overflowX) ||
        el.scrollWidth <= el.clientWidth + 4
      )
        continue;
      if (s.scrollSnapType && s.scrollSnapType !== "none") continue;
      if (el.tagName === "PRE" || el.closest("pre")) continue;
      const hidden = el.scrollWidth - el.clientWidth;
      const drawing = el.querySelector("svg, img, canvas, video");
      const kind = drawing
        ? "drawing"
        : el.querySelector("table") || el.tagName === "TABLE"
          ? "table"
          : "content";
      add(
        "scroller",
        el,
        el.innerText || drawing?.getAttribute("aria-label") || "",
        `${kind} is ${el.scrollWidth}px wide in a ${el.clientWidth}px box; ${hidden}px start off-screen`,
        { kind },
      );
    }
  }

  // ---- h1 length -------------------------------------------------------------
  for (const h of document.querySelectorAll("h1")) {
    if (!shown(h)) continue;
    const lh =
      parseFloat(getComputedStyle(h).lineHeight) ||
      parseFloat(getComputedStyle(h).fontSize) * 1.1;
    const lines = Math.round(h.getBoundingClientRect().height / lh);
    if (lines > (opts.phone ? 5 : 3))
      add("long-h1", h, h.innerText, `${lines} lines`);
  }

  if (opts.desktop) {
    // ---- first screen --------------------------------------------------------
    const F = 630;
    let chars = 0;
    let lower = 0;
    for (const lf of leaves)
      if (lf.y < F && lf.y + (lf.box.bottom - lf.box.top) > 0) {
        chars += lf.t.length;
        if (lf.y > F / 2) lower += lf.t.length;
      }
    let drawn = 0,
      drawnLower = 0;
    for (const m of document.querySelectorAll(
      "svg, img, canvas, video, [data-device]",
    )) {
      if (!shown(m) || (m.closest("a") && m.getBoundingClientRect().width < 40))
        continue;
      const r = m.getBoundingClientRect();
      const top = r.top + scrollY,
        h = Math.max(0, Math.min(F, top + r.height) - Math.max(0, top));
      if (r.width * h > 30000) {
        drawn += r.width * h;
        if (top + r.height > F / 2) drawnLower += 1;
      }
    }
    out.firstScreen = { chars, drawn: r1(drawn) };
    const h1 = document.querySelector("h1");
    if (chars < 60 && !drawn)
      add(
        "first-screen",
        document.body,
        "",
        `top ${F}px hold ${chars} characters of text and no drawing`,
      );
    else if (!lower && !drawnLower && out.docH > F + 100)
      add(
        "first-screen-half",
        document.body,
        "",
        `nothing in the lower half (y ${F / 2}..${F}) of the first screen`,
      );
    if (!h1) add("no-h1", document.body, "", "no <h1> on the page");
    else if (h1.getBoundingClientRect().top + scrollY > F - 40)
      add(
        "h1-low",
        h1,
        h1.innerText,
        `h1 starts at y=${r1(h1.getBoundingClientRect().top + scrollY)}, below the ${F}px link preview`,
      );

    // ---- blank stretches -----------------------------------------------------
    const ink = [];
    for (const lf of leaves)
      ink.push([lf.y, lf.y + lf.box.bottom - lf.box.top, lf.t]);
    const label = (m) =>
      typeof m === "string"
        ? m
        : (m.textContent || m.tagName)
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 60) || m.tagName.toLowerCase();
    for (const m of document.body.querySelectorAll(
      "svg, img, canvas, video, hr, *",
    )) {
      if (m instanceof SVGElement && m.tagName !== "svg") continue;
      const isMedia = /^(svg|IMG|CANVAS|VIDEO|HR)$/.test(m.tagName);
      if (!isMedia) {
        const s = getComputedStyle(m);
        const c = rgba(s.backgroundColor);
        const hasBox =
          (c && c.a > 0.1) ||
          parseFloat(s.borderTopWidth) > 0 ||
          s.boxShadow !== "none";
        if (!hasBox || m === document.body) continue;
      }
      if (!shown(m) || foreign(m)) continue;
      const r = m.getBoundingClientRect();
      if (r.width < 8 || r.height < 1) continue;
      ink.push([r.top + scrollY, r.bottom + scrollY, m]);
    }
    ink.sort((a, b) => a[0] - b[0]);
    let reach = 0,
      last = "";
    for (const [top, bottom, t] of ink) {
      if (top - reach > 480 && reach > 0)
        add(
          "blank",
          document.body,
          "",
          `${r1(top - reach)}px of empty page between "${clip(label(last))}" (y=${r1(reach)}) and "${clip(label(t))}"`,
        );
      if (bottom > reach) {
        reach = bottom;
        last = t;
      }
    }
    if (out.docH - reach > 600)
      add(
        "blank",
        document.body,
        "",
        `the page ends with ${r1(out.docH - reach)}px of nothing after "${clip(label(last))}"`,
      );

    // ---- markers ---------------------------------------------------------------
    const hasPseudo = (el, p) => {
      const c = getComputedStyle(el, p).content;
      return c && c !== "none" && c !== "normal";
    };
    for (const list of document.querySelectorAll("ul, ol")) {
      if (
        !shown(list) ||
        list.closest("nav, [role=tablist], [role=menu]") ||
        foreign(list)
      )
        continue;
      const items = [...list.children].filter(
        (c) => c.tagName === "LI" && shown(c),
      );
      if (items.length < 2) continue;
      const tops = items.map((i) => i.getBoundingClientRect().top);
      if (new Set(tops.map((t) => Math.round(t / 4))).size < items.length)
        continue;
      const words =
        items.reduce((n, i) => n + i.innerText.trim().split(/\s+/).length, 0) /
        items.length;
      if (words < 3) continue;
      const marked = items.some((li) => {
        const s = getComputedStyle(li);
        if (s.display === "list-item" && s.listStyleType !== "none")
          return true;
        if (s.display === "list-item" && s.listStyleImage !== "none")
          return true;
        if (hasPseudo(li, "::before") || hasPseudo(li, "::after")) return true;
        const first = li.firstElementChild;
        if (
          first &&
          /^(svg|IMG|I|INPUT|TIME|STRONG|B)$/.test(first.tagName) &&
          li.innerText.trim().indexOf(first.innerText?.trim() || "\u0000") <= 0
        )
          return true;
        if (
          first &&
          (/(dot|icon|tag|num|badge|step|pill|chip)/.test(
            first.className?.baseVal ?? first.className,
          ) ||
            hasPseudo(first, "::before"))
        )
          return true;
        const c = rgba(s.backgroundColor);
        if (
          (c && c.a > 0.1) ||
          parseFloat(s.borderLeftWidth) > 0 ||
          parseFloat(s.borderTopWidth) > 0 ||
          parseFloat(s.borderBottomWidth) > 0 ||
          s.boxShadow !== "none"
        )
          return true;
        if (/(grid|flex)/.test(s.display) && li.children.length >= 2)
          return true;
        for (const k of li.querySelectorAll("*")) {
          const ks = getComputedStyle(k);
          if (
            ks.position === "absolute" &&
            k.getBoundingClientRect().width <= 28
          )
            return true;
        }
        const links = li.querySelectorAll("a");
        if (
          links.length === 1 &&
          links[0].innerText.trim().length > li.innerText.trim().length * 0.6
        )
          return true;
        return false;
      });
      if (!marked)
        add(
          "no-markers",
          list,
          items[0].innerText,
          `${items.length} stacked items with no bullet, number, icon or box`,
        );
    }
    for (const s of document.querySelectorAll("summary")) {
      if (!shown(s)) continue;
      const cs = getComputedStyle(s);
      if (
        (cs.display === "list-item" && cs.listStyleType !== "none") ||
        hasPseudo(s, "::before") ||
        hasPseudo(s, "::after") ||
        s.querySelector("svg, img, i, .ph")
      )
        continue;
      add(
        "no-summary-marker",
        s,
        s.innerText,
        `display ${cs.display}, list-style ${cs.listStyleType}: nothing shows it opens`,
      );
    }

    // ---- lone last card ---------------------------------------------------------
    for (const g of document.body.querySelectorAll("*")) {
      const s = getComputedStyle(g);
      if (
        !(
          s.display === "grid" ||
          (s.display === "flex" && s.flexWrap === "wrap")
        )
      )
        continue;
      // A device lays out its own grids (a calendar week, a checklist); a short last row there is the data.
      if (g.closest("[data-device]")) continue;
      // Never read the computed grid-template-columns here: on some pages Chrome hangs resolving it.
      const kids = [...g.children].filter(
        (c) => shown(c) && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName),
      );
      if (kids.length < 4) continue;
      const rows = new Map();
      for (const k of kids) {
        const t = Math.round(k.getBoundingClientRect().top / 6);
        rows.set(t, (rows.get(t) || 0) + 1);
      }
      const counts = [...rows.entries()]
        .sort((a, b) => a[0] - b[0])
        .map((e) => e[1]);
      if (
        counts.length >= 2 &&
        counts[counts.length - 1] === 1 &&
        Math.max(...counts) >= 3
      )
        add(
          "orphan",
          g,
          kids[kids.length - 1].innerText,
          `${kids.length} items in rows of ${counts.join(", ")}; the last sits alone`,
        );
    }

    // ---- repeated text inside one card -----------------------------------------------
    const byBox = new Map();
    for (const lf of leaves) {
      if (lf.t.length < 14) continue;
      const box = lf.el.closest(
        "li, article, tr, .panel, .inset, .card, [class*=card]",
      );
      if (!box || box.textContent.length > 500 || box.querySelector("svg"))
        continue;
      if (!byBox.has(box)) byBox.set(box, []);
      byBox.get(box).push(lf);
    }
    for (const [box, list] of byBox) {
      let hit = null;
      for (let i = 0; i < list.length && !hit; i++)
        for (let j = 0; j < list.length && !hit; j++) {
          const a = list[i],
            b = list[j];
          if (
            i === j ||
            a.el === b.el ||
            a.el.contains(b.el) ||
            b.el.contains(a.el)
          )
            continue;
          if (
            b.t.toLowerCase().includes(a.t.toLowerCase()) &&
            (a.t.length < b.t.length || i < j)
          )
            hit = a;
        }
      if (hit)
        add("repeat", box, hit.t, "this text appears twice in the same item");
    }
  }
  return out;
}
