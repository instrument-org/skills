// foundation.js: the few behaviors every page gets, all opt-in by attribute.
//   data-show-who="maya"   a button that dims everything not marked data-who~="maya"
//   data-copy="#id"        a button that copies that element's text (or the literal value)
//   data-date="2026-10-13" gets class "today" on that date, in the reader's clock
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
