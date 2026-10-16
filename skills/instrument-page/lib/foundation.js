// foundation.js: the few behaviors every page gets, all opt-in by attribute.
//   data-show-who="maya"   a button that dims everything not marked data-who~="maya"
//   data-copy="#id"        a button that copies that element's text (or the literal value)
//   data-date="2026-10-13" gets class "today" on that date, in the reader's clock
//   <pre>                  Copy and Wrap; data-file="path" labels it; data-wrap="off" starts unwrapped
//   <code class="language-ts"> inside a pre is highlighted, once page.mjs's highlight.js loads
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
      i.onerror = () => i.remove();
      i.onload = () => {
        if (i.naturalWidth <= 16) i.remove();
      };
      i.src =
        "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=" +
        encodeURIComponent(new URL(a.href).origin);
      a.prepend(i);
    }
  });
})();
