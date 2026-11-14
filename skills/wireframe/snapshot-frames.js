// Snapshot frames, put into a wireframe page by add-snapshot.mjs with the
// snapshots it draws from. A snapshot is one page kept whole by snapshot.js:
// its DOM, its stylesheets and its pictures. snap(name, edit) edits a copy of
// it by what a person reads and draws it in an iframe at true size, so the
// page's styles reach only that frame and its own width is its viewport. A
// mark an edit makes is a marker laid over the iframe on the element it names,
// so the page's callouts ring it like any other. Each stylesheet is stored
// once in the page and put back into a frame only when its iframe is made.
(() => {
  const data = JSON.parse(
    document.getElementById("wireframe-snapshots")?.textContent ??
      '{"sheets":{},"pages":{}}',
  );

  const ROLES = {
    button: "button,[role=button]",
    link: "a[href],[role=link]",
    textbox:
      "textarea,input:not([type=checkbox]):not([type=radio]),[role=textbox],[contenteditable=true]",
    heading: "h1,h2,h3,h4,h5,h6,[role=heading]",
    listitem: "li,[role=listitem]",
    navigation: "nav,[role=navigation]",
    dialog: "dialog,[role=dialog],[role=alertdialog]",
    image: "img,svg[role=img],[role=img]",
  };
  const VOID =
    /^(img|input|textarea|select|br|hr|svg|use|path|video|canvas|iframe)$/i;

  /** The words a person would find an element by: its label, placeholder, alt, or text. */
  const nameOf = (el) =>
    String(
      el.getAttribute?.("aria-label") ||
        el.getAttribute?.("placeholder") ||
        el.getAttribute?.("alt") ||
        el.textContent ||
        "",
    )
      .replace(/\s+/g, " ")
      .trim();
  /** Its words with a space between each element's, as the margin quotes them. */
  const spaced = (el) => {
    const label = el.getAttribute("aria-label") || el.getAttribute("alt");
    const words = [];
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    for (let n = walker.nextNode(); n; n = walker.nextNode())
      words.push(n.nodeValue);
    return (label || words.join(" ")).replace(/\s+/g, " ").trim();
  };
  const describe = (el) => {
    const name = nameOf(el);
    return `${el.getAttribute("role") || el.tagName.toLowerCase()} "${name.length > 60 ? `${name.slice(0, 60)}…` : name}"`;
  };

  /** Exactly one element for a target, or an error naming what is close. */
  const find = (scope, target, state) => {
    const t = typeof target === "string" ? { text: target } : target;
    const where = t.within ? find(scope, t.within, state) : scope;
    let els = [...where.querySelectorAll(t.selector ?? "*")].filter(
      (el) => !el.closest("head,script,style"),
    );
    if (t.role)
      els = els.filter(
        (el) =>
          el.getAttribute("role") === t.role ||
          (ROLES[t.role] && el.matches(ROLES[t.role])),
      );
    if (t.label !== undefined)
      els = els.filter((el) => el.getAttribute("aria-label") === t.label);
    if (t.text !== undefined)
      els = els.filter(
        (el) =>
          nameOf(el) === t.text || el.getAttribute("aria-label") === t.text,
      );
    if (t.contains !== undefined)
      els = els.filter((el) => nameOf(el).includes(t.contains));
    // Of nested matches (a button and the span holding its words), words alone
    // find the innermost and a role or selector the outermost; `.up()` climbs.
    els =
      !t.role && !t.selector
        ? els.filter((el) => !els.some((o) => o !== el && el.contains(o)))
        : els.filter((el) => !els.some((o) => o !== el && o.contains(el)));
    const asked = JSON.stringify(target);
    if (els.length === 0) {
      // The longest word asked for, so spacing and punctuation the page
      // writes differently still find it.
      const word =
        String(t.text ?? t.contains ?? t.label ?? "")
          .toLowerCase()
          .split(/[^\p{L}\p{N}]+/u)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const near = word
        ? [
            ...where.querySelectorAll(
              "button,a,[role],input,label,h1,h2,h3,h4,li,span,p",
            ),
          ]
            .filter(
              (el) =>
                !el.closest("head") && nameOf(el).toLowerCase().includes(word),
            )
            .slice(0, 8)
            .map(describe)
        : [];
      throw new Error(
        `snap("${state}"): nothing matches ${asked}.${near.length ? ` Close: ${near.join("; ")}.` : ""}`,
      );
    }
    if (t.nth !== undefined) {
      const el = els[t.nth - 1];
      if (!el)
        throw new Error(
          `snap("${state}"): ${asked} has ${els.length} matches, not ${t.nth}`,
        );
      return el;
    }
    if (els.length > 1)
      throw new Error(
        `snap("${state}"): ${asked} matches ${els.length} elements (${els.slice(0, 6).map(describe).join("; ")}). Add a role, { within }, or { nth }.`,
      );
    return els[0];
  };

  const page = (name) => {
    const p = data.pages[name];
    if (!p)
      throw new Error(
        `snap("${name}"): this page has no such snapshot. It has: ${Object.keys(data.pages).join(", ") || "none; add one with add-snapshot.mjs"}`,
      );
    return p;
  };

  // A picture or font inlined as data becomes one blob URL for the whole
  // page, so every frame that draws it shares one decoded copy instead of
  // each frame's document holding and decoding its own.
  const blobs = new Map();
  const hoist = (text) =>
    text.replace(
      /data:([\w/+.-]+);base64,([A-Za-z0-9+/=]{2000,})/g,
      (all, type, b64) => {
        let url = blobs.get(all);
        if (!url) {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          url = URL.createObjectURL(new Blob([bytes], { type }));
          blobs.set(all, url);
        }
        return url;
      },
    );
  const hoisted = new Map();
  const htmlOf = (name) => {
    if (!hoisted.has(name)) hoisted.set(name, hoist(page(name).html));
    return hoisted.get(name);
  };
  const sheetOf = (h) => {
    if (!hoisted.has(`sheet:${h}`))
      hoisted.set(`sheet:${h}`, hoist(data.sheets[h] ?? ""));
    return hoisted.get(`sheet:${h}`);
  };

  /** Each frame snap() drew: its document with the shared sheets left out, its size and its marks. */
  const frames = [];

  /**
   * A frame from the snapshot `name`, edited by `edit($)`. `$(target)` finds
   * exactly one element by what a person reads and hands back its edits; a
   * target that matches nothing, or several, throws, which stops the page.
   * Every edit marks what it changed NEW unless it ends with `{ quiet: true }`.
   */
  const snap = (name, edit) => {
    const p = page(name);
    const doc = new DOMParser().parseFromString(htmlOf(name), "text/html");
    const marks = [];
    const markOn = (el, label = "new") => {
      const host = VOID.test(el.tagName) ? el.parentElement : el;
      if (!host || marks.some((m) => m.el === host && m.label === label))
        return;
      const id = String(marks.length);
      marks.push({
        el: host,
        label,
        tone: label === "new" ? "new" : "click",
        words: spaced(host).slice(0, 60),
      });
      host.setAttribute(
        "data-snap-mark",
        `${host.getAttribute("data-snap-mark") ?? ""} ${id}`.trim(),
      );
    };
    const parse = (html) => {
      const tpl = doc.createElement("template");
      tpl.innerHTML = html;
      return [...tpl.content.childNodes];
    };
    const nodesOf = (x) => (typeof x === "string" ? parse(x) : [x.el]);
    /** Inserted nodes are marked, words alone wrapped so the mark has a box. */
    const placed = (nodes, o) => {
      if (o?.quiet) return;
      for (const n of nodes) {
        if (n.nodeType === 1) markOn(n);
        else if (n.nodeType === 3 && n.nodeValue.trim()) {
          const span = doc.createElement("span");
          n.replaceWith(span);
          span.append(n);
          markOn(span);
        }
      }
    };
    const wrap = (el, detached = false) => {
      const changed = (o) => {
        if (!detached && !o?.quiet) markOn(el);
      };
      const insert = (how) => (x, o) => {
        const nodes = nodesOf(x);
        el[how](...nodes);
        placed(nodes, o);
        return w;
      };
      const w = {
        el,
        /** One element inside this one. */
        find: (t) => wrap(find(el, t, name), detached),
        /** The nearest element around this one matching a selector or a role ("button", "row"). */
        up: (sel) => {
          let a = el.parentElement;
          const hit = (x) => {
            if (
              x.getAttribute("role") === sel ||
              (ROLES[sel] && x.matches(ROLES[sel]))
            )
              return true;
            try {
              return !ROLES[sel] && x.matches(sel);
            } catch {
              return false;
            }
          };
          while (a && !hit(a)) a = a.parentElement;
          if (!a)
            throw new Error(
              `snap("${name}"): no ${sel} around ${describe(el)}`,
            );
          return wrap(a, detached);
        },
        /** `.text(to)` sets the one piece of words inside; `.text(from, to)` replaces those words. */
        text: (a, b, c) => {
          const [from, to, o] =
            typeof b === "string" ? [a, b, c] : [undefined, a, b];
          const walker = doc.createTreeWalker(el, 4);
          const nodes = [];
          for (let n = walker.nextNode(); n; n = walker.nextNode())
            if (n.nodeValue.trim()) nodes.push(n);
          if (from === undefined) {
            if (nodes.length === 1)
              nodes[0].nodeValue = nodes[0].nodeValue.replace(
                nodes[0].nodeValue.trim(),
                to,
              );
            else if (nodes.length === 0) el.append(doc.createTextNode(to));
            else
              throw new Error(
                `snap("${name}"): ${describe(el)} holds ${nodes.length} pieces of words (${nodes
                  .slice(0, 5)
                  .map((n) => JSON.stringify(n.nodeValue.trim()))
                  .join(", ")}); say which with .text(from, to)`,
              );
          } else if (
            !nodes.some(
              (n) =>
                n.nodeValue.includes(from) &&
                ((n.nodeValue = n.nodeValue.replace(from, to)), true),
            )
          )
            throw new Error(
              `snap("${name}"): ${describe(el)} has no words "${from}"`,
            );
          const label = el.getAttribute("aria-label");
          if (label && from && label.includes(from))
            el.setAttribute("aria-label", label.replace(from, to));
          changed(o);
          return w;
        },
        /** New insides. */
        html: (html, o) => {
          el.innerHTML = html;
          changed(o);
          return w;
        },
        /** HTML, or a clone, in this element's place. */
        replace: (x, o) => {
          const nodes = nodesOf(x);
          el.replaceWith(...nodes);
          placed(nodes, o);
          return nodes[0]?.nodeType === 1 ? wrap(nodes[0], detached) : w;
        },
        before: insert("before"),
        after: insert("after"),
        append: insert("append"),
        prepend: insert("prepend"),
        /** A copy to change and then place with before, after, append or replace; marked once placed. */
        clone: () => wrap(el.cloneNode(true), true),
        remove: () => {
          el.remove();
          return w;
        },
        /** Keeps its room and draws nothing. */
        hide: () => {
          el.setAttribute(
            "style",
            `${el.getAttribute("style") ?? ""};visibility:hidden`,
          );
          return w;
        },
        attr: (n, v, o) => {
          if (v === null) el.removeAttribute(n);
          else el.setAttribute(n, v);
          changed(o);
          return w;
        },
        addClass: (c, o) => {
          el.classList.add(...c.split(/\s+/).filter(Boolean));
          changed(o);
          return w;
        },
        removeClass: (c, o) => {
          el.classList.remove(...c.split(/\s+/).filter(Boolean));
          changed(o);
          return w;
        },
        /** Takes another element's look: its classes, and its variant and size as a button's. */
        look: (t, o) => {
          const src = find(doc, t, name);
          el.setAttribute("class", src.getAttribute("class") ?? "");
          for (const a of ["data-variant", "data-size"]) {
            const v = src.getAttribute(a);
            if (v === null) el.removeAttribute(a);
            else el.setAttribute(a, v);
          }
          changed(o);
          return w;
        },
        /** Adds inline style, as "left: 40px; width: 320px". */
        css: (s, o) => {
          el.setAttribute("style", `${el.getAttribute("style") ?? ""};${s}`);
          changed(o);
          return w;
        },
        /** A callout of a few words on this element, like noted(). */
        note: (words) => {
          markOn(el, words);
          return w;
        },
        /** NEW on this element, like fresh(), for a change no edit marked. */
        fresh: () => {
          markOn(el, "new");
          return w;
        },
        /** `.mark()` is NEW and `.mark("words")` a callout, as #note and #fresh. */
        mark: (label = "new") => {
          markOn(el, label);
          return w;
        },
        /** Draws nothing, like clickable(): a button already reads as clickable. */
        click: () => w,
      };
      return w;
    };
    const $ = Object.assign((t) => wrap(find(doc, t, name)), {
      root: wrap(doc.body),
    });
    if (edit) edit($);
    const id = frames.length;
    frames.push({
      name,
      w: p.w,
      h: p.h,
      html: `<!doctype html>${doc.documentElement.outerHTML}`,
    });
    const esc = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    // The marker holds the element's words where the page's callouts read
    // them, clipped to nothing so only the ring shows.
    const markers = marks
      .map(
        (m, i) =>
          `<div data-snap-marker="${i}" style="position:absolute;left:0;top:0;width:0;height:0;pointer-events:none"><i class="mark" data-label="${esc(m.label)}" data-tone="${m.tone}"></i><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">${esc(m.words)}</span></div>`,
      )
      .join("");
    return `<div class="snap" data-snap="${esc(name)}" data-snap-frame="${id}" style="position:relative;width:${p.w}px;height:${p.h}px;overflow:hidden;background:${esc(p.bg ?? "#fff")}">${markers}</div>`;
  };
  /** The address a snapshot was taken at, for `web(snap.url("pricing"), snap("pricing"))`. */
  snap.url = (name) => page(name).url ?? "";
  /** A snapshot's size, for a frame's `w` and `h`: `{ ...snap.size("pricing"), body: snap("pricing") }`. */
  snap.size = (name) => ({ w: page(name).w, h: page(name).h });

  // ---- frames on the page -----------------------------------------------------
  const source = (f) =>
    f.html.replace(
      /<style data-sheet="(\w+)"><\/style>/g,
      (_, h) => `<style>${sheetOf(h)}</style>`,
    );

  /** Sets every copy's markers on the elements they name, measured in one copy, and has the page redraw its callouts. */
  const place = (id, d) => {
    const rects = {};
    for (const el of d.querySelectorAll("[data-snap-mark]")) {
      const r = el.getBoundingClientRect();
      for (const i of el.getAttribute("data-snap-mark").split(" "))
        rects[i] = r;
    }
    const roots = new Set();
    for (const m of document.querySelectorAll(
      `.snap[data-snap-frame="${id}"] > [data-snap-marker]`,
    )) {
      const r = rects[m.dataset.snapMarker];
      if (r)
        Object.assign(m.style, {
          left: `${r.left}px`,
          top: `${r.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
        });
      const root = m.closest(".frame")?.firstElementChild;
      if (root) roots.add(root);
    }
    // The frames whose callouts moved, for the page to measure again.
    if (roots.size)
      document.dispatchEvent(
        new CustomEvent("wireframe:remark", { detail: [...roots] }),
      );
  };

  /** Nothing in a frame keeps focus or a key: they belong to the page and its viewer. */
  const guard = (iframe) => {
    const d = iframe.contentDocument;
    if (!d || d.__snapGuarded) return;
    d.__snapGuarded = true;
    d.addEventListener("focusin", (e) => e.target.blur?.(), true);
    for (const type of ["keydown", "keyup"])
      d.addEventListener(type, (e) => {
        if (!document.dispatchEvent(new KeyboardEvent(type, e)))
          e.preventDefault();
        // A dialog's Escape is the browser's own, which a copied event never reaches.
        if (type === "keydown" && e.key === "Escape") {
          const open = [...document.querySelectorAll("dialog[open]")].at(-1);
          if (open) open.requestClose ? open.requestClose() : open.close();
        }
      });
    const id = Number(iframe.parentElement?.dataset.snapFrame);
    const settle = () => place(id, d);
    settle();
    d.fonts?.ready.then(settle);
  };

  const mount = (box) => {
    const f = frames[Number(box.dataset.snapFrame)];
    if (!f) return;
    let iframe = box.querySelector(":scope > iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.title = f.name;
      iframe.tabIndex = -1;
      iframe.inert = true;
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText = `position:absolute;inset:0;width:${f.w}px;height:${f.h}px;border:0;pointer-events:none;color-scheme:normal`;
      iframe.srcdoc = source(f);
      box.prepend(iframe);
    }
    // A copy of a frame (the enlarged view, its thumbnail) brings its iframe
    // along, which loads its own document.
    iframe.addEventListener("load", () => guard(iframe));
    if (
      iframe.contentDocument?.readyState === "complete" &&
      iframe.contentDocument.body?.childElementCount
    )
      guard(iframe);
  };

  // A frame's document is made when its tile comes near the screen and let go
  // when it is far away, so a page of many frames holds only the few in
  // reach: each one parses its own copy of its stylesheets. Copies in the
  // enlarged view are made at once. Printing makes them all and keeps them,
  // which is also how a full-page screenshot gets every frame drawn:
  // dispatchEvent(new Event("beforeprint")) first.
  let keepAll = false;
  const unmount = (box) =>
    keepAll || box.querySelector(":scope > iframe")?.remove();
  const near = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && mount(e.target)),
    { rootMargin: "50% 0px" },
  );
  const far = new IntersectionObserver(
    (entries) => entries.forEach((e) => !e.isIntersecting && unmount(e.target)),
    {
      rootMargin: "100% 0px",
    },
  );
  const scan = (root) => {
    if (!(root instanceof Element)) return;
    const boxes = root.matches(".snap[data-snap-frame]")
      ? [root]
      : [...root.querySelectorAll(".snap[data-snap-frame]")];
    for (const box of boxes) {
      if (box.closest("dialog")) mount(box);
      else {
        near.observe(box);
        far.observe(box);
      }
    }
  };
  new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) scan(n);
  }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("beforeprint", () => {
    keepAll = true;
    document.querySelectorAll(".snap[data-snap-frame]").forEach(mount);
  });

  window.snap = snap;
})();
