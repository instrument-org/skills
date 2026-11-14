// A snapshot of the page this runs in, for a wireframe to draw frames from.
// Evaluate it in your browser tool on the page as it should be drawn (the
// state clicked into, the viewport the frame's size):
//
//   agent-browser set viewport 1280 800
//   agent-browser eval --stdin < <skill>/snapshot.js > pricing.json
//
// It returns { snapshot, url, title, w, h, bg, html, kb, notes }. `html` is one
// self-contained document: the page's DOM as it is now, its stylesheets cut
// to the rules this page can use, and its pictures and the fonts it drew with
// inlined as data, so it renders with no network. `notes` says what it could
// not keep. add-snapshot.mjs puts it into a wireframe page. It changes
// nothing on the page and sends nothing anywhere: every request is a read of
// something the page already loaded.
(async () => {
  const notes = [];

  const toDataUrl = async (url) => {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  // ---- fonts ---------------------------------------------------------------
  // A face stays when the page loaded its family in its subset, so an edit
  // may still set a weight the page had not drawn with yet; the rest would
  // only reach for the network.
  const norm = (v) =>
    String(v ?? "")
      .replace(/["'\s]/g, "")
      .toUpperCase();
  // Each family's loaded subsets (unicode-range), so its other weights and
  // styles in those subsets stay and the scripts it never drew go.
  const loadedRanges = new Map();
  for (const f of document.fonts) {
    if (f.status !== "loaded") continue;
    const fam = norm(f.family);
    if (!loadedRanges.has(fam)) loadedRanges.set(fam, new Set());
    loadedRanges.get(fam).add(norm(f.unicodeRange || "U+0-10FFFF"));
  }

  // ---- rules this page can use -----------------------------------------------
  // A rule stays when its selector, with every state taken out (hover, focus,
  // open, checked, an attribute such as data-state), matches something on the
  // page: the states are what an edit or a later moment may switch on, and the
  // element is what it would switch them on for. A selector the browser can't
  // test stays too. At-rules that hold rules are cut the same way inside.
  const DYNAMIC =
    /(?<!\\)::?(?:-webkit-|-moz-)?(?:hover|focus|focus-visible|focus-within|active|visited|link|any-link|target|checked|indeterminate|disabled|enabled|placeholder-shown|autofill|open|closed|popover-open|modal|fullscreen|valid|invalid|user-valid|user-invalid|required|optional|read-only|read-write|default|playing|paused|defined|before|after|first-line|first-letter|placeholder|marker|selection|backdrop)(?![\w-])/g;
  const baseSelector = (sel) =>
    sel
      .replace(/(?<!\\)\[(?:[^\]\\]|\\.)*\]/g, "")
      .replace(/(?<!\\)::[\w-]+\((?:[^()]|\([^()]*\))*\)/g, "")
      .replace(DYNAMIC, "")
      .replace(/(?<!\\)::[\w-]+/g, "")
      .trim();
  const matches = (sel) => {
    for (const part of sel.split(/(?<!\\),(?![^(]*\))/)) {
      const base = baseSelector(part)
        .replace(/[>+~]\s*$/, "")
        .replace(/^\s*[>+~]/, "")
        .trim();
      if (!base || base === "*") return true;
      try {
        if (document.querySelector(base)) return true;
      } catch {
        return true;
      }
    }
    return false;
  };
  let kept = 0;
  let dropped = 0;
  const cut = (rules) => {
    const out = [];
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        if (matches(rule.selectorText)) {
          out.push(rule.cssText);
          kept++;
        } else dropped++;
      } else if (rule instanceof CSSFontFaceRule) {
        const ranges = loadedRanges.get(
          norm(rule.style.getPropertyValue("font-family")),
        );
        if (
          ranges?.has(
            norm(rule.style.getPropertyValue("unicode-range") || "U+0-10FFFF"),
          )
        )
          out.push(rule.cssText);
      } else if (rule instanceof CSSImportRule) {
        try {
          out.push(...cut(rule.styleSheet.cssRules));
        } catch {
          out.push(rule.cssText);
        }
      } else if ("cssRules" in rule && !(rule instanceof CSSKeyframesRule)) {
        const inner = cut(rule.cssRules);
        if (inner.length === 0) continue;
        const head = rule.cssText.slice(0, rule.cssText.indexOf("{")).trim();
        out.push(`${head} {\n${inner.join("\n")}\n}`);
      } else out.push(rule.cssText);
    }
    return out;
  };

  /** Every url() made absolute, and data for what this page could read. */
  const inlineCss = async (css, base, cache) => {
    let out = "";
    let last = 0;
    for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
      out += css.slice(last, m.index);
      last = m.index + m[0].length;
      const raw = m[2];
      if (raw.startsWith("data:") || raw.startsWith("#")) {
        out += m[0];
        continue;
      }
      const abs = new URL(raw, base).href;
      try {
        if (!cache.has(abs)) cache.set(abs, toDataUrl(abs));
        out += `url("${await cache.get(abs)}")`;
      } catch {
        out += `url("${abs}")`;
      }
    }
    return out + css.slice(last);
  };

  const cache = new Map();
  const sheets = [];
  for (const sheet of [
    ...document.styleSheets,
    ...(document.adoptedStyleSheets ?? []),
  ]) {
    const base = sheet.href ?? location.href;
    let rules = null;
    try {
      rules = sheet.cssRules;
    } catch {}
    if (!rules && sheet.href) {
      // Another site's stylesheet, linked without CORS: the page can't read
      // its rules, but the file itself may still allow a read.
      try {
        const res = await fetch(sheet.href);
        if (res.ok) {
          const probe = new CSSStyleSheet();
          probe.replaceSync((await res.text()).replace(/@import[^;]+;/g, ""));
          rules = probe.cssRules;
        }
      } catch {}
    }
    if (!rules) {
      notes.push(`kept as a link, so it draws only online: ${sheet.href}`);
      sheets.push(`<link rel="stylesheet" href="${sheet.href}">`);
      continue;
    }
    // A newer Chrome writes color-mix() in its default space with the space left
    // out, which an older browser viewing the wireframe drops, and with it every
    // see-through color; so the space is spelled out.
    const css = cut(rules)
      .join("\n")
      .replace(/color-mix\((?!\s*in\s)/g, "color-mix(in oklab, ");
    if (css.trim())
      sheets.push(`<style>${await inlineCss(css, base, cache)}</style>`);
  }

  // ---- the DOM ----------------------------------------------------------------
  const body = document.body.cloneNode(true);
  const live = document.body.querySelectorAll("*");
  const copy = body.querySelectorAll("*");
  let embeds = 0;
  let shadows = 0;
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    const b = copy[i];
    if (!b) break;
    if (a.shadowRoot) shadows++;
    if (a.scrollTop || a.scrollLeft)
      b.setAttribute("data-snapshot-scroll", `${a.scrollLeft},${a.scrollTop}`);
    if (a instanceof HTMLImageElement && a.currentSrc)
      b.setAttribute("data-snapshot-src", a.currentSrc);
    if (a instanceof HTMLInputElement) {
      if (a.type === "checkbox" || a.type === "radio")
        a.checked
          ? b.setAttribute("checked", "")
          : b.removeAttribute("checked");
      else if (a.type !== "password") b.setAttribute("value", a.value);
    } else if (a instanceof HTMLTextAreaElement) b.textContent = a.value;
    else if (a instanceof HTMLSelectElement) {
      for (const [k, o] of [...a.options].entries())
        b.options[k]?.toggleAttribute("selected", o.selected);
    } else if (a instanceof HTMLCanvasElement) {
      try {
        const img = document.createElement("img");
        img.src = a.toDataURL();
        img.className = a.className;
        img.style.cssText = a.style.cssText;
        img.style.width = `${a.getBoundingClientRect().width}px`;
        img.style.height = `${a.getBoundingClientRect().height}px`;
        b.replaceWith(img);
      } catch {}
    } else if (a instanceof HTMLIFrameElement || a.tagName === "WEBVIEW") {
      // Another document is out of reach: a box of its size stands in, named
      // by where it came from, which an edit can remove.
      const r = a.getBoundingClientRect();
      let host = "";
      try {
        host = new URL(a.getAttribute("src") ?? "", location.href).host;
      } catch {}
      const box = document.createElement("div");
      box.setAttribute("data-snapshot-embed", host || "embedded page");
      box.className = a.className;
      box.style.cssText = `${a.style.cssText};width:${r.width}px;height:${r.height}px;display:${r.width && r.height ? "grid" : "none"};place-items:center;background:#f4f4f5;color:#71717a;font:12px/1.4 system-ui,sans-serif;border-radius:4px`;
      box.textContent = host ? `Embedded from ${host}` : "Embedded page";
      b.replaceWith(box);
      if (r.width && r.height) embeds++;
    }
  }
  if (embeds)
    notes.push(
      `${embeds} embedded page${embeds > 1 ? "s" : ""} (another document) drawn as a gray box; each carries data-snapshot-embed`,
    );
  if (shadows)
    notes.push(
      `${shadows} element${shadows > 1 ? "s" : ""} with a shadow root kept without its insides`,
    );
  for (const el of body.querySelectorAll(
    "script, noscript, style, link[rel~=stylesheet], template",
  ))
    el.remove();
  // The picture the browser chose from srcset is the one to keep; the others
  // would point back at the server.
  for (const source of body.querySelectorAll("picture source")) source.remove();
  for (const img of body.querySelectorAll("img")) {
    const src =
      img.getAttribute("data-snapshot-src") ?? img.getAttribute("src");
    img.removeAttribute("data-snapshot-src");
    for (const attr of ["srcset", "sizes", "loading", "decoding"])
      img.removeAttribute(attr);
    if (!src || src.startsWith("data:")) continue;
    const abs = new URL(src, location.href).href;
    try {
      if (!cache.has(abs)) cache.set(abs, toDataUrl(abs));
      img.setAttribute("src", await cache.get(abs));
    } catch {
      img.setAttribute("src", abs);
      notes.push(
        `picture kept as a link, so it draws only online: ${abs.slice(0, 120)}`,
      );
    }
  }
  for (const el of body.querySelectorAll("[style*='url(']"))
    el.setAttribute(
      "style",
      await inlineCss(el.getAttribute("style"), location.href, cache),
    );

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const attrs = (el) =>
    [...el.attributes].map((a) => ` ${a.name}="${esc(a.value)}"`).join("");
  // Still: no motion, no caret. The page keeps its length; a frame shows its
  // first screen, and the scroll positions the page had come back on load.
  const freeze =
    "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
  const restore =
    "for(const el of document.querySelectorAll('[data-snapshot-scroll]')){const [x,y]=el.getAttribute('data-snapshot-scroll').split(',').map(Number);el.scrollLeft=x;el.scrollTop=y}";
  const w = innerWidth;
  const h = innerHeight;
  // What shows before a frame's document has drawn.
  const bg =
    [document.body, document.documentElement]
      .map((el) => getComputedStyle(el).backgroundColor)
      .find((c) => !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(c)) ?? "#fff";
  const html =
    `<!doctype html>\n<html${attrs(document.documentElement)}>\n<head>\n<meta charset="utf-8">\n` +
    `<meta name="wireframe-snapshot" content="${w}x${h}" data-url="${esc(location.href)}">\n` +
    `<title>${document.title.replace(/</g, "&lt;")}</title>\n` +
    sheets.join("\n") +
    `\n<style>${freeze}</style>\n</head>\n` +
    body.outerHTML +
    `\n<script>${restore}</script>\n</html>\n`;
  notes.push(`kept ${kept} style rules this page can use, cut ${dropped}`);
  return {
    snapshot: 1,
    url: location.href,
    title: document.title,
    w,
    h,
    bg,
    kb: Math.round(html.length / 1024),
    notes,
    html,
  };
})();
