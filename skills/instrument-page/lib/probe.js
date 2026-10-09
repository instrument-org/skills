// The layout check for a page page.mjs built, run inside the page by the
// agent's own browser tool, for example:
//
//   agent-browser open page.html
//   agent-browser eval --stdin < <skill>/lib/probe.js
//
// It loads the page into hidden frames of its own at 1280x900 (light, then
// dark), at the 1104x590 link preview and at a 390x844 phone, measures each,
// removes them, and returns the report as text, also logged to the console:
// one `FAIL rule: where: measurement -> fix` line per problem, then `pass` or
// a count. The window the reader sees is not resized, rethemed or scrolled.
// It starts no process, sends nothing anywhere and stores nothing.
//
// A file:// page cannot reach into a frame of its own URL, so the frames are
// written from the page as page.mjs built it (window.__instrumentSource, kept
// by foundation.js before any script ran). Over http(s) they load the URL.
(async () => {
  const LIMITS = { firstDesk: 260, firstPreview: 150, tiny: 11 };
  const FIX = {
    overlap:
      "give each label its own space: move one, wrap it, or shorten it; hiding it or shrinking it under 11px fails other rules",
    clipped:
      "let the box grow or the text wrap (drop the fixed width or height, nowrap, ellipsis, line-clamp), or shorten the words",
    offscreen:
      "find the fixed width, min-width or nowrap that pushes it out and make it fluid",
    "svg-outside":
      "move or shorten the label, or widen the viewBox so the label sits inside the drawing",
    "leaves-box":
      "shorten the label, break it into two lines, or put a number in the box and the name in a key beside the drawing",
    covered: "move the dot or the label so both show",
    tiny: "make it render at 11px or more on a 390px phone. Inside an SVG that scales down, put the words in HTML beside the drawing (a key or list), or give phones their own simpler version (.phone-only)",
    contrast:
      'color text with --ink, --ink-2 or --muted on --paper or --ground, and with --paper (SVG class="paper") on a colored fill; a fixed color or a faded opacity fails in one of the two themes',
    hscroll:
      "make that element fluid (max-width:100%, minmax(0,1fr), flex-wrap, no px min-width); overflow-x:hidden on body only cuts it off",
    "scroller-drawing":
      "a drawing must fit the phone: drop the min-width so it scales, and give phones a stacked or listed version of whatever is then too small",
  };

  function probe(win, opts) {
    const { document, Node, NodeFilter, SVGElement, DOMPoint } = win;
    // The layout viewport: on a phone, innerWidth grows to fit content that overflows.
    const W = document.documentElement.clientWidth,
      H = document.documentElement.clientHeight || win.innerHeight;
    const out = {
      W,
      H,
      scrollW: document.documentElement.scrollWidth,
      docH: document.documentElement.scrollHeight,
      issues: [],
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
        const s = win.getComputedStyle(e);
        if (/rect\(0/.test(s.clip) || /inset\(50%/.test(s.clipPath))
          return true;
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
      const m = (k) =>
        (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
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
        o *= +win.getComputedStyle(e).opacity;
      return o;
    };
    const pageGround = () => {
      for (const e of [document.body, document.documentElement]) {
        const c = rgba(win.getComputedStyle(e).backgroundColor);
        if (c && c.a > 0) return over(c, { r: 255, g: 255, b: 255, a: 1 });
      }
      const dark =
        win.matchMedia("(prefers-color-scheme: dark)").matches &&
        /dark/.test(win.getComputedStyle(document.documentElement).colorScheme);
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
        const s = win.getComputedStyle(e);
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
        const st = win.getComputedStyle(sh);
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
      if (Math.abs(win.scrollY - sy) > 2) win.scrollTo(0, sy);
      const stack = document.elementsFromPoint(x, y - win.scrollY);
      const i = stack.indexOf(el);
      if (i < 0) return ancestorBackground(el);
      const layers = [];
      for (let k = i; k < stack.length; k++) {
        const e = stack[k];
        if (e instanceof SVGElement) {
          if (!SHAPES.has(e.tagName)) continue;
          if (e.tagName === "image") return null;
          const s = win.getComputedStyle(e);
          if (/^url\(/.test(s.fill)) return null;
          const f = rgba(s.fill);
          if (!f || f.a === 0) continue;
          f.a *= +s.fillOpacity * opacityChain(e);
          layers.push(f);
        } else {
          if (k > i && !e.contains(el) && el.contains(e)) continue;
          const s = win.getComputedStyle(e);
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
        const s = win.getComputedStyle(p);
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
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
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
      const cs = win.getComputedStyle(el);
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
        y: box.top + win.scrollY,
        x: box.left,
      });
    }

    // ---- overlap ---------------------------------------------------------------
    const L = leaves.slice(0, 3000);
    const pairs = new Set();
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j];
        if (b.box.top > a.box.bottom + 40 && !a.svg && !b.svg) continue;
        if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el))
          continue;
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
              x * y >
                0.12 * Math.min(ra.width * ra.height, rb.width * rb.height)
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
        const s = win.getComputedStyle(a);
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
        const s = win.getComputedStyle(a);
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
        const st = win.getComputedStyle(sh);
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
        const st = win.getComputedStyle(c);
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
      const savedY = win.scrollY;
      const done = new Set();
      for (const lf of leaves) {
        if (done.has(lf.el)) continue;
        done.add(lf.el);
        const s = win.getComputedStyle(lf.el);
        const fg = rgba(lf.svg ? s.fill : s.color);
        if (!fg) continue;
        fg.a *= opacityChain(lf.el) * (lf.svg ? +s.fillOpacity : 1);
        const cxp = (lf.rects[0].left + lf.rects[0].right) / 2,
          cyp = (lf.rects[0].top + lf.rects[0].bottom) / 2 + win.scrollY;
        const bg = backgroundAt(lf.el, cxp, cyp);
        if (!bg) continue;
        const shownFg = over(fg, bg);
        const cr = ratio(shownFg, bg);
        if (cr < 3)
          add("contrast", lf.el, lf.t, `contrast ${cr.toFixed(2)}:1`, { cr });
      }
      win.scrollTo(0, savedY);
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
          if (
            p &&
            p !== document.body &&
            p.getBoundingClientRect().right > W + 1
          )
            continue;
          const s = win.getComputedStyle(el);
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
        const s = win.getComputedStyle(el);
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

    return out;
  }

  function spec(win, opts) {
    const { document, Node, NodeFilter, SVGElement, DOMPoint } = win;
    const H = opts.H,
      W = document.documentElement.clientWidth;
    const out = {
      W,
      H,
      h1: null,
      hero: null,
    };
    const clip = (t, n = 60) =>
      (t || "").replace(/\s+/g, " ").trim().slice(0, n);
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
    const y = win.scrollY;

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
        const d = win.getComputedStyle(e).display;
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
    // Text spilling out of a visible box (a border or a background) that does not clip it.
    out.spills = [];
    const boxed = (e) => {
      for (
        let a = e;
        a && a !== document.body && a !== document.documentElement;
        a = a.parentElement
      ) {
        if (a instanceof SVGElement) return null;
        const cs = win.getComputedStyle(a);
        const bg = cs.backgroundColor.match(/[\d.]+/g);
        if (cs.display === "contents") continue;
        const framed =
          parseFloat(cs.borderLeftWidth) > 0 &&
          parseFloat(cs.borderRightWidth) > 0;
        const filled =
          bg &&
          (bg.length < 4 || +bg[3] > 0.1) &&
          cs.backgroundColor !== "rgba(0, 0, 0, 0)";
        if ((framed || filled) && a.getBoundingClientRect().width >= 60)
          return a;
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
      if (parseFloat(win.getComputedStyle(el).fontSize) < 36) continue;
      const r = el.getBoundingClientRect();
      if (r.top + y < 2 * H) out.bigFigures.push(clip(el.innerText, 24));
    }

    return out;
  }

  // ---- frames ----------------------------------------------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = (win) =>
    Promise.race([win.document.fonts.ready, sleep(2500)])
      .then(
        () =>
          new Promise((r) =>
            win.requestAnimationFrame(() => win.requestAnimationFrame(r)),
          ),
      )
      .then(() => sleep(250));
  const source = window.__instrumentSource;
  const byUrl = /^https?:$/.test(location.protocol);
  // Loads the page into a hidden frame of w x h in the given theme and returns
  // its window, or null when the page cannot be framed.
  async function open(w, h, theme) {
    if (!byUrl && !source) return null;
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    const loaded = new Promise((r) => {
      f.onload = r;
      setTimeout(r, 10000);
    });
    if (byUrl) f.src = location.href.replace(/#.*$/, "");
    else f.srcdoc = source;
    document.documentElement.append(f);
    await loaded;
    let win = null;
    try {
      if (f.contentDocument?.body) win = f.contentWindow;
    } catch {
      // A cross-origin frame: nothing to measure through it.
    }
    if (!win) {
      f.remove();
      return null;
    }
    const root = win.document.documentElement;
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
      // Let color transitions on a theme change finish, or contrast is read mid-fade.
      await sleep(600);
    }
    await settle(win);
    return { win, close: () => f.remove() };
  }

  // ---- report ----------------------------------------------------------------
  const fails = [];
  const push = (rule, where, measure, fix) =>
    fails.push({ rule, where, measure, fix });
  const notes = [];
  const runs = [];

  const desk = await open(1280, 900, "light");
  if (desk) {
    runs.push(["1280", probe(desk.win, { contrast: true })]);
    const deskSpec = spec(desk.win, { H: 900 });
    desk.win.document.documentElement.dataset.theme = "dark";
    await sleep(600);
    await settle(desk.win);
    runs.push(["1280 dark", probe(desk.win, { contrast: true })]);
    desk.close();
    const prev = await open(1104, 590, "light");
    const prevSpec = prev && spec(prev.win, { H: 590 });
    prev?.close();
    const phone = await open(390, 844, "light");
    if (phone) {
      runs.push(["390", probe(phone.win, { phone: true, tiny: LIMITS.tiny })]);
      firstLook(spec(phone.win, { H: 844 }), null);
      phone.close();
    }
    firstLook(deskSpec, prevSpec);
  } else {
    // Measured in this window only, at whatever size it is.
    const W = document.documentElement.clientWidth;
    const narrow = W < 600;
    notes.push(
      `NOTE probe: measured this ${W}px window only; the ${narrow ? "desktop, preview" : "phone, preview"} and dark checks did not run because the page could not be framed (build it with page.mjs, then reopen it)`,
    );
    runs.push([
      String(W),
      probe(window, {
        contrast: true,
        phone: narrow,
        tiny: narrow ? LIMITS.tiny : 0,
      }),
    ]);
    firstLook(spec(window, { H: innerHeight }), null);
  }

  // Layout findings, merged across the sizes they show at.
  const merged = new Map(),
    tiny = new Map();
  for (const [label, res] of runs) {
    for (const is of res.issues) {
      if (is.rule === "tiny") {
        const t = tiny.get(is.group) ?? { n: 0, min: 99, ex: [] };
        t.n++;
        t.min = Math.min(t.min, is.fs);
        if (t.ex.length < 3 && !t.ex.includes(is.text)) t.ex.push(is.text);
        tiny.set(is.group, t);
        continue;
      }
      const rule =
        is.rule === "scroller"
          ? is.kind === "drawing"
            ? "scroller-drawing"
            : null
          : is.rule;
      if (!rule || !FIX[rule]) continue;
      if (label.endsWith("dark") && rule !== "contrast") continue;
      const key = `${rule}|${is.where}|${is.text}|${is.other ?? ""}`;
      if (!merged.has(key)) merged.set(key, { rule, is, at: [] });
      if (!merged.get(key).at.includes(label)) merged.get(key).at.push(label);
    }
  }
  for (const { rule, is, at } of merged.values())
    push(
      rule,
      `${is.where}${is.text ? ` "${is.text}"` : ""}`,
      `${is.measure} at ${at.join(" and ")}`,
      FIX[rule],
    );
  for (const [g, t] of tiny)
    push(
      "tiny",
      g,
      `${t.n} text(s) under ${LIMITS.tiny}px at 390 (smallest ${t.min.toFixed(1)}px): ${t.ex.map((x) => `"${x}"`).join(", ")}`,
      FIX.tiny,
    );

  // The headline and the top of the hero in the first screen and the link
  // preview; text spilling out of its box; a wall of big figures.
  function firstLook(s, preview) {
    const label = s.W < 600 ? "390" : String(s.W);
    for (const [name, sp, need, what] of [
      s.W < 600
        ? [null]
        : [
            "first-screen",
            s,
            LIMITS.firstDesk,
            `the ${s.W}x${s.H} first screen`,
          ],
      preview
        ? ["preview", preview, LIMITS.firstPreview, "the 1104x590 link preview"]
        : [null],
    ]) {
      if (!name || !sp.h1 || !sp.hero) continue;
      const miss = [];
      if (sp.h1.bottom > sp.H) miss.push(`the h1 ends at y=${sp.h1.bottom}`);
      const vis = Math.max(
        0,
        Math.min(sp.hero.bottom, sp.H) - Math.max(sp.hero.top, 0),
      );
      if (!sp.hero.containsH1 && vis < Math.min(need, sp.hero.height))
        miss.push(
          `only ${vis}px of the hero (${sp.hero.where}, starts at y=${sp.hero.top}) shows`,
        );
      if (miss.length)
        push(
          name,
          what,
          miss.join("; "),
          "shorten the header (kicker, a short headline, a lede of one or two short sentences) and put the hero right after it, or make the hero itself shorter at the top",
        );
    }
    for (const x of (s.spills || []).slice(0, 4))
      push(
        "spills",
        `${x.where} "${x.text}"`,
        `runs ${x.by}px outside its box (${x.box}) at ${label}`,
        "let it wrap or set it smaller so it fits its box (a long figure in a narrow card is the usual cause), or give the box more width",
      );
    if (s.W >= 600 && (s.bigFigures || []).length > 2)
      push(
        "figure-wall",
        "the first two screens",
        `${s.bigFigures.length} figures set big: ${s.bigFigures
          .slice(0, 5)
          .map((t) => `"${t}"`)
          .join(", ")}`,
        "a row of big numbers is a dashboard, not an answer: keep at most two big figures and show the comparison they make as a chart, bars on one scale, or a short table",
      );
  }

  const out = [...notes];
  const per = new Map();
  for (const f of fails) {
    per.set(f.rule, (per.get(f.rule) || 0) + 1);
    if (per.get(f.rule) <= 6)
      out.push(`FAIL ${f.rule}: ${f.where}: ${f.measure} -> ${f.fix}`);
  }
  for (const [r, n] of per)
    if (n > 6) out.push(`FAIL ${r}: ${n - 6} more like the above -> same fix`);
  out.push(
    fails.length
      ? `${fails.length} FAIL. Fix each by fixing what it names, rebuild with page.mjs, reopen the page and run this again.`
      : "pass",
  );
  const report = out.join("\n");
  console.log(report);
  return report;
})();
