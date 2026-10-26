// foundation.js: the few behaviors every page gets, all opt-in by attribute.
//   data-show-who="maya"   a button that dims everything not marked data-who~="maya"
//   data-copy="#id"        a button that copies that element's text (or the literal value)
//   data-date="2026-10-13" gets class "today" on that date, in the reader's clock
//   <pre>                  Copy and Wrap; data-file="path" labels it; data-wrap="off" starts unwrapped
//   <code class="language-ts"> inside a pre is highlighted, once page.mjs's highlight.js loads
//   <img> in a figure or on its own line, shown smaller than it is: opens full size,
//                          the arrow keys step through the rest; data-gallery="off" opts one out
// And, on a page of five or more top-level sections with an h2, a sticky strip of them.
// Plus the house contracts: the theme switch the share widget calls, and the
// page as written, kept for the share widget before any script changes it.
(function () {
  const root = document.documentElement;
  const KEY = "instrument:theme";
  const theme = () => {
    const s = getComputedStyle(root).colorScheme;
    if (!s.includes("dark")) return "light";
    if (!s.includes("light")) return "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };
  const announce = () =>
    document.dispatchEvent(
      new CustomEvent("instrument:theme", { detail: theme() }),
    );
  window.__instrumentTheme = (choice) => {
    if (choice !== undefined) {
      if (choice) root.dataset.theme = choice;
      else delete root.dataset.theme;
      try {
        choice
          ? localStorage.setItem(KEY, choice)
          : localStorage.removeItem(KEY);
      } catch {}
      announce();
    }
    return theme();
  };
  try {
    const k = localStorage.getItem(KEY);
    if (k === "light" || k === "dark") root.dataset.theme = k;
  } catch {}
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!root.dataset.theme) announce();
  });

  // Called from a one-line script page.mjs places just before the page's own
  // scripts: the markup so far, plus whatever follows it, as the file had it.
  window.__instrumentSnap = (here) => {
    const copy = root.cloneNode(true);
    delete copy.dataset.theme;
    document.addEventListener("DOMContentLoaded", () => {
      const body = copy.querySelector("body");
      for (let n = here.nextSibling; n; n = n.nextSibling)
        body.append(n.cloneNode(true));
      window.__instrumentSource = "<!doctype html>\n" + copy.outerHTML;
    });
  };

  const ready = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();
  ready(() => {
    // Show me my part.
    const whoButtons = [...document.querySelectorAll("[data-show-who]")];
    const show = (who) => {
      for (const b of whoButtons)
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.showWho === who && !!who),
        );
      for (const el of document.querySelectorAll("[data-who]")) {
        const hit = who && el.dataset.who.split(/\s+/).includes(who);
        el.classList.toggle("match", !!hit);
        el.classList.toggle("dim", !!who && !hit && el.dataset.who !== "all");
      }
      if (who) root.dataset.showing = who;
      else delete root.dataset.showing;
      history.replaceState(
        null,
        "",
        who ? "#who=" + who : location.pathname + location.search,
      );
    };
    for (const b of whoButtons)
      b.addEventListener("click", () =>
        show(
          b.getAttribute("aria-pressed") === "true" ? "" : b.dataset.showWho,
        ),
      );
    const fromHash = location.hash.match(/^#who=([\w-]+)/);
    if (fromHash) show(fromHash[1]);

    // Copy.
    for (const b of document.querySelectorAll("[data-copy]")) {
      b.addEventListener("click", async () => {
        const v = b.dataset.copy;
        const target = v.startsWith("#") ? document.querySelector(v) : null;
        const text = target ? target.innerText.trim() : v;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          return;
        }
        const was = b.innerHTML;
        b.textContent = "Copied";
        setTimeout(() => (b.innerHTML = was), 1400);
      });
    }

    // Code blocks: Copy and Wrap on every pre, the file it came from above it.
    const ICON = {
      copy: '<path d="M5.5 5.5V3.25c0-.97.78-1.75 1.75-1.75h5.5c.97 0 1.75.78 1.75 1.75v5.5c0 .97-.78 1.75-1.75 1.75H10.5"/><rect x="1.5" y="5.5" width="9" height="9" rx="1.75"/>',
      wrap: '<path d="M2 3.5h9.25a3 3 0 0 1 0 6H4.5"/><path d="m6.5 7.25-2.25 2.25 2.25 2.25"/><path d="M2 13h4"/>',
      check: '<path d="m3 8.5 3.25 3.25L13 5"/>',
    };
    const icon = (name) =>
      `<svg viewBox="0 0 16 16" aria-hidden="true">${ICON[name]}</svg>`;
    const copyText = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Not every engine grants the clipboard API to a file:// page.
        const ta = document.body.appendChild(
          document.createElement("textarea"),
        );
        ta.value = text;
        ta.style.cssText = "position:fixed;top:0;opacity:0";
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      }
    };
    for (const pre of document.querySelectorAll("pre")) {
      if (pre.closest(".code, [data-zoom], svg") || pre.dataset.tools === "off")
        continue;
      const block = document.createElement("div");
      block.className = "code";
      block.dataset.wrap = pre.dataset.wrap === "off" ? "off" : "on";
      pre.replaceWith(block);
      if (pre.dataset.file) {
        const file = document.createElement("div");
        file.className = "code-file";
        file.textContent = pre.dataset.file;
        block.append(file);
      }
      block.append(pre);
      const tools = document.createElement("div");
      tools.className = "code-tools";
      tools.innerHTML =
        `<button type="button" title="Wrap long lines">${icon("wrap")}Wrap</button>` +
        `<button type="button" title="Copy to clipboard">${icon("copy")}Copy</button>`;
      const [wrap, copy] = tools.children;
      wrap.setAttribute("aria-pressed", String(block.dataset.wrap === "on"));
      wrap.addEventListener("click", () => {
        const on = block.dataset.wrap !== "on";
        block.dataset.wrap = on ? "on" : "off";
        wrap.setAttribute("aria-pressed", String(on));
      });
      let settle;
      copy.addEventListener("click", async () => {
        const ok = await copyText(pre.textContent.replace(/\s+$/, ""));
        copy.innerHTML = ok ? `${icon("check")}Copied` : "Select to copy";
        clearTimeout(settle);
        settle = setTimeout(
          () => (copy.innerHTML = `${icon("copy")}Copy`),
          1600,
        );
      });
      block.append(tools);
    }

    // Highlighting. A block with markup of its own was marked by hand and stays as written.
    const code = [
      ...document.querySelectorAll("pre > code[class*='language-']"),
    ].filter((el) => !el.children.length);
    const highlight = () => {
      if (!window.hljs) return;
      window.hljs.configure({ ignoreUnescapedHTML: true });
      for (const el of code) window.hljs.highlightElement(el);
    };
    if (code.length) {
      if (window.hljs) highlight();
      else
        document
          .querySelector("script[data-highlight]")
          ?.addEventListener("load", highlight);
    }

    // Flow connectors: a node on one box's edge, a fine line, an arrowhead that
    // touches the next box. Where the next box starts a new row, the line drops
    // from the bottom of one box, runs along the gap and turns down into the next.
    const NS = "http://www.w3.org/2000/svg";
    const drawFlow = (ol) => {
      ol.querySelector(":scope > svg.flow-lines")?.remove();
      const boxes = [...ol.children].filter((el) => el.tagName === "LI");
      if (boxes.length < 2 || !ol.offsetParent) return;
      const o = ol.getBoundingClientRect();
      const r = boxes.map((li) => {
        const b = li.getBoundingClientRect();
        return {
          l: b.left - o.left,
          r: b.right - o.left,
          t: b.top - o.top,
          b: b.bottom - o.top,
          cx: (b.left + b.right) / 2 - o.left,
          cy: (b.top + b.bottom) / 2 - o.top,
        };
      });
      let d = "";
      const dots = [];
      for (let i = 1; i < r.length; i++) {
        const a = r[i - 1];
        const b = r[i];
        if (b.t < a.b - 2 && b.l >= a.r - 2) {
          const y = a.cy;
          d += `M${a.r} ${y}H${b.l}M${b.l - 5} ${y - 3.5}L${b.l} ${y}L${b.l - 5} ${y + 3.5}`;
          dots.push([a.r, y]);
        } else {
          const mid = (a.b + b.t) / 2;
          const turn = Math.min(
            10,
            (b.t - a.b) / 2 - 1,
            Math.abs(b.cx - a.cx) / 2,
          );
          const s = Math.sign(b.cx - a.cx);
          d += `M${a.cx} ${a.b}`;
          d += s
            ? `V${mid - turn}Q${a.cx} ${mid} ${a.cx + s * turn} ${mid}H${b.cx - s * turn}Q${b.cx} ${mid} ${b.cx} ${mid + turn}V${b.t}`
            : `V${b.t}`;
          d += `M${b.cx - 3.5} ${b.t - 5}L${b.cx} ${b.t}L${b.cx + 3.5} ${b.t - 5}`;
          dots.push([a.cx, a.b]);
        }
      }
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "flow-lines");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("fill", "none");
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      svg.append(path);
      for (const [x, y] of dots) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", x);
        c.setAttribute("cy", y);
        c.setAttribute("r", 2.25);
        svg.append(c);
      }
      ol.append(svg);
      ol.classList.add("drawn");
    };
    const flows = [...document.querySelectorAll("ol.flow")];
    if (flows.length) {
      const redraw = () => flows.forEach(drawFlow);
      redraw();
      document.fonts?.ready.then(redraw);
      if (window.ResizeObserver) {
        const watch = new ResizeObserver(() => requestAnimationFrame(redraw));
        for (const ol of flows) watch.observe(ol);
      }
    }

    // The section strip: one link per top-level section, the one in view marked.
    const sections = [
      ...document.querySelectorAll(
        "body > :is(section, article), body > main > :is(section, article)",
      ),
    ].filter((sec) => sec.querySelector(":scope > h2"));
    if (sections.length >= 5 && root.dataset.strip !== "off") {
      const taken = new Set(
        [...document.querySelectorAll("[id]")].map((el) => el.id),
      );
      const nav = document.createElement("nav");
      nav.className = "strip";
      nav.setAttribute("aria-label", "Sections");
      const row = nav.appendChild(document.createElement("div"));
      const links = sections.map((sec) => {
        const h2 = sec.querySelector(":scope > h2");
        const label = (h2.dataset.short || h2.textContent).trim();
        if (!sec.id) {
          let id =
            h2.id ||
            h2.textContent
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 48) ||
            "section";
          if (!h2.id) {
            for (let n = 2, base = id; taken.has(id); n++) id = `${base}-${n}`;
            taken.add(id);
          } else h2.removeAttribute("id");
          sec.id = id;
        }
        const a = row.appendChild(document.createElement("a"));
        a.href = "#" + sec.id;
        a.textContent = label;
        a.title = h2.textContent.trim();
        return a;
      });
      document.body.prepend(nav);
      let marked = -2;
      const mark = () => {
        let at = -1;
        sections.forEach((sec, i) => {
          if (sec.getBoundingClientRect().top < innerHeight * 0.3) at = i;
        });
        if (
          scrollY > 0 &&
          innerHeight + scrollY >= document.documentElement.scrollHeight - 8
        )
          at = sections.length - 1;
        if (at === marked) return;
        marked = at;
        links.forEach((a, i) =>
          i === at
            ? a.setAttribute("aria-current", "true")
            : a.removeAttribute("aria-current"),
        );
        if (links[at])
          row.scrollTo({
            left: links[at].offsetLeft - row.offsetLeft - row.clientWidth / 3,
            behavior: "smooth",
          });
      };
      addEventListener("scroll", mark, { passive: true });
      mark();
    }

    {
      // The viewer: a picture shown smaller than it is opens full size, and the
      // arrow keys step through every other such picture on the page. A picture
      // inside a link, a control or a line of text, or marked alt="", is not one,
      // and a page that brings its own picture dialog keeps it.
      const NOT_SHOT =
        "a, button, label, summary, nav, svg, [data-zoom], [data-gallery='off'], .site-icon";
      const blockImage = (img) =>
        img.closest("figure") ||
        ![...img.parentNode.childNodes].some(
          (n) => n.nodeType === 3 && n.data.trim(),
        );
      const shots = [...document.querySelectorAll("img")].filter(
        (img) =>
          root.dataset.gallery !== "off" &&
          !document.querySelector("dialog img") &&
          img.getAttribute("alt") !== "" &&
          !img.closest(NOT_SHOT) &&
          blockImage(img),
      );
      // Worth opening: at least 160px wide on the page, with a quarter more
      // pixels in the file than the page shows.
      const worth = (img) => {
        const r = img.getBoundingClientRect();
        return r.width >= 160 && img.naturalWidth >= r.width * 1.25;
      };
      const mark = (img) => {
        const on = img.complete && img.naturalWidth > 0 && worth(img);
        img.classList.toggle("zoomable", on);
        if (on) {
          img.tabIndex = 0;
          img.setAttribute("role", "button");
        } else {
          img.removeAttribute("tabindex");
          img.removeAttribute("role");
        }
      };
      // Sizes change with the window, a details opening, or a late load.
      const resized = new ResizeObserver((entries) =>
        entries.forEach((e) => mark(e.target)),
      );
      for (const img of shots) {
        resized.observe(img);
        img.addEventListener("load", () => mark(img));
      }
      let viewer, at, list, opener;
      const caption = (img) =>
        img
          .closest("figure")
          ?.querySelector("figcaption")
          ?.textContent.trim() || img.alt;
      // Built on first use, so the page as written never carries it.
      const build = () => {
        viewer = document.createElement("dialog");
        viewer.className = "viewer";
        viewer.setAttribute("aria-label", "Picture viewer");
        const arrow = (d) =>
          `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
        viewer.innerHTML =
          '<figure tabindex="-1" autofocus><img alt=""><figcaption><span class="viewer-count"></span><span class="viewer-caption"></span></figcaption></figure>' +
          `<button type="button" class="viewer-prev" aria-label="Previous picture">${arrow("m10 3-5 5 5 5")}</button>` +
          `<button type="button" class="viewer-next" aria-label="Next picture">${arrow("m6 3 5 5-5 5")}</button>` +
          `<button type="button" class="viewer-close" aria-label="Close">${arrow("m4 4 8 8M12 4l-8 8")}</button>`;
        document.body.append(viewer);
        viewer.querySelector("img").draggable = false;
        viewer.querySelector(".viewer-prev").onclick = () => step(-1);
        viewer.querySelector(".viewer-next").onclick = () => step(1);
        viewer.querySelector(".viewer-close").onclick = () => viewer.close();
        let swiped = false;
        viewer.addEventListener("click", (e) => {
          if (swiped) swiped = false;
          else if (!e.target.closest("button")) viewer.close();
        });
        viewer.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") step(1);
          else if (e.key === "ArrowLeft") step(-1);
          else return;
          e.preventDefault();
        });
        let x0, y0;
        viewer.addEventListener("pointerdown", (e) => {
          x0 = e.clientX;
          y0 = e.clientY;
        });
        viewer.addEventListener("pointerup", (e) => {
          const dx = e.clientX - x0,
            dy = e.clientY - y0;
          if (Math.abs(dx) >= 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
            step(dx < 0 ? 1 : -1);
            swiped = true;
          }
        });
        viewer.addEventListener("close", () => opener?.focus());
      };
      const show = () => {
        const img = list[at];
        const big = viewer.querySelector("img");
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        big.classList.toggle("tall", img.naturalHeight > 2 * img.naturalWidth);
        viewer.querySelector(".viewer-caption").textContent = caption(img);
        viewer.querySelector(".viewer-count").textContent =
          list.length > 1 ? `${at + 1} / ${list.length}` : "";
        viewer.classList.toggle("single", list.length < 2);
        viewer.scrollTop = 0;
        const next = list[(at + 1) % list.length];
        if (next !== img) new Image().src = next.currentSrc || next.src;
      };
      const step = (by) => {
        at = (at + by + list.length) % list.length;
        show();
      };
      const open = (img) => {
        if (!viewer) build();
        const seen = new Set();
        list = shots.filter(
          (s) =>
            s.classList.contains("zoomable") &&
            !seen.has(s.src) &&
            seen.add(s.src),
        );
        at = Math.max(
          0,
          list.findIndex((s) => s.src === img.src),
        );
        opener = img;
        show();
        viewer.showModal();
      };
      document.addEventListener("click", (e) => {
        const img = e.target.closest?.("img.zoomable");
        if (img && !e.defaultPrevented) open(img);
      });
      document.addEventListener("keydown", (e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target.matches?.("img.zoomable")
        ) {
          e.preventDefault();
          open(e.target);
        }
      });
    }

    // Today.
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (const el of document.querySelectorAll(`[data-date="${today}"]`))
      el.classList.add("today");

    // A link wears the icon of the site it goes to. Only the origin is sent.
    for (const a of document.querySelectorAll(
      'a[href^="https://"]:not(.no-icon)',
    )) {
      if (a.querySelector("img, svg")) continue;
      const i = new Image();
      i.alt = "";
      i.className = "site-icon";
      i.src =
        "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=" +
        encodeURIComponent(new URL(a.href).origin);
      // A line may break between an image and the text beside it, so the icon
      // and the first word it leads go in a span that cannot break.
      const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.data.trim()) text = walker.nextNode();
      let host = a;
      if (text) {
        const at = text.data.search(/\S/);
        const word = at > 0 ? text.splitText(at) : text;
        const space = word.data.search(/\s/);
        if (space > 0) word.splitText(space);
        host = document.createElement("span");
        host.className = "site-icon-word";
        word.replaceWith(host);
        host.append(word);
      }
      const drop = () => {
        i.remove();
        if (host !== a) host.replaceWith(...host.childNodes);
      };
      i.onerror = drop;
      // The service answers an unknown host with its own 16px globe.
      i.onload = () => {
        if (i.naturalWidth <= 16) drop();
      };
      host.prepend(i);
    }
  });
})();
