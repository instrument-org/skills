// lab.js: a switcher for trying any lab page in every feel, layout and theme.
// Lab only; real pages never carry it. The URL keeps the choice, so a reload
// after editing foundation.css stays where you were:
//   ?feel=bold&layout=wide&theme=dark    set from the URL
//   ?bare                                 no panel (feels.html's frames)
// Keys: f next feel, l next layout, t next theme, 0 back to the page's own.
(() => {
  const root = document.documentElement;
  const FEELS = ["minimal", "editorial", "bold", "dense"];
  const LAYOUTS = ["column", "wide"];
  const THEMES = ["auto", "light", "dark"];
  const own = {
    feel: root.dataset.feel || "minimal",
    layout: root.dataset.layout || "column",
    theme: "auto",
  };
  let panel;
  const now = () => ({
    feel: root.dataset.feel || "minimal",
    layout: root.dataset.layout || "column",
    theme: root.dataset.theme || "auto",
  });

  function set(key, value, quiet) {
    if (key === "theme") {
      if (window.__instrumentTheme)
        window.__instrumentTheme(value === "auto" ? "" : value);
      else if (value === "auto") delete root.dataset.theme;
      else root.dataset.theme = value;
    } else root.dataset[key] = value;
    if (quiet) return;
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(now()))
      if (v === own[k]) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    history.replaceState(null, "", url);
    document.dispatchEvent(new CustomEvent("lab:change", { detail: now() }));
    draw();
  }

  const q = new URLSearchParams(location.search);
  for (const k of ["feel", "layout", "theme"])
    if (q.get(k)) set(k, q.get(k), true);
  document.dispatchEvent(new CustomEvent("lab:change", { detail: now() }));
  if (q.has("bare")) return;

  const host = document.createElement("div");
  host.setAttribute("data-lab", "");
  const shadow = host.attachShadow({ mode: "open" });
  const icon = (d) =>
    `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="${d}"/></svg>`;
  const HOME = "M2.5 7.5 8 3l5.5 4.5M4 6.5V13h3V9.5h2V13h3V6.5";
  const DOWN = "M4 6l4 4 4-4";
  const UP = "M4 10l4-4 4 4";
  shadow.innerHTML = `<style>
    :host { all: initial; }
    .lab { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647;
      font: 500 12px/1.2 "Inter", ui-sans-serif, system-ui, sans-serif; color: #f1ede9;
      background: rgb(23 20 18 / 0.96); border: 1px solid rgb(255 255 255 / 0.12);
      padding: 0; box-shadow: 0 8px 24px rgb(0 0 0 / 0.35); display: grid;
      max-width: calc(100vw - 24px); }
    .top { display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 4px; border-bottom: 1px solid rgb(255 255 255 / 0.12); }
    .lab.min .top { border-bottom: 0; }
    .top b { font-weight: 600; letter-spacing: -0.005em; margin-right: auto; }
    .top { justify-content: flex-start; gap: 6px; }
    .tools { display: flex; gap: 2px; }
    .body { display: grid; gap: 2px; padding: 6px 8px 8px; }
    .lab.min .body { display: none; }
    .row { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
    .row > span { width: 52px; color: #9a918a; }
    .pages { max-width: 440px; padding-bottom: 6px; margin-bottom: 4px;
      border-bottom: 1px solid rgb(255 255 255 / 0.08); }
    button, a { all: unset; cursor: pointer; padding: 4px 6px; border-radius: 0; color: #d0c8c1; }
    .tools :is(a, button) { display: grid; place-items: center; padding: 4px; }
    :is(button, a):hover { background: rgb(255 255 255 / 0.1); color: #f1ede9; }
    :is(button[aria-pressed="true"], a[aria-current="page"]) { background: #f1ede9; color: #171412; }
    button.own::after { content: "*"; margin-left: 2px; opacity: 0.6; }
    :is(button, a):focus-visible { outline: 1px solid #f1ede9; outline-offset: -1px; }
  </style><div class="lab"><div class="top"><span class="tools"><a data-home title="Home: the specimen" aria-label="Home">${icon(HOME)}</a></span><b>Instrument Pages design lab</b><span class="tools"><button data-min title="Hide" aria-label="Hide">${icon(DOWN)}</button></span></div><div class="body"></div></div>`;
  panel = shadow.querySelector(".lab");
  const body = shadow.querySelector(".body");
  const homeHref = new URL(base() + "index.html");
  const home = shadow.querySelector("[data-home]");
  home.href = homeHref.pathname;
  if (
    location.pathname === homeHref.pathname ||
    location.pathname === homeHref.pathname.replace(/index\.html$/, "")
  )
    home.setAttribute("aria-current", "page");
  // Every lab page, one click away; the theme you picked comes along.
  const PAGES = [
    ["onboarding", "samples/onboarding-emails.html"],
    ["outage", "samples/checkout-outage.html"],
    ["bus", "samples/bus-quotes.html"],
    ["roster", "samples/crew-roster.html"],
    ["accounting", "samples/accounting-tools.html"],
    ["launch", "samples/launch-thanks.html"],
  ];
  const carry = (a, path) => () => {
    const theme = now().theme;
    if (theme !== "auto") a.href = `${path}?theme=${theme}`;
  };
  home.onclick = carry(home, homeHref.pathname);
  const pages = document.createElement("div");
  pages.className = "row pages";
  pages.innerHTML = `<span>pages</span>`;
  for (const [label, path] of PAGES) {
    const a = document.createElement("a");
    a.textContent = label;
    const href = new URL(base() + path);
    a.href = href.pathname;
    if (location.pathname === href.pathname)
      a.setAttribute("aria-current", "page");
    a.onclick = carry(a, href.pathname);
    pages.append(a);
  }
  body.append(pages);
  const rows = { feel: FEELS, layout: LAYOUTS, theme: THEMES };
  for (const [key, values] of Object.entries(rows)) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span>${key}</span>`;
    for (const v of values) {
      const b = document.createElement("button");
      b.textContent = v;
      b.dataset.key = key;
      b.dataset.value = v;
      if (own[key] === v && key !== "theme") b.className = "own";
      b.title = own[key] === v ? "this page's own" : "";
      b.onclick = () => set(key, v);
      row.append(b);
    }
    body.append(row);
  }
  const min = shadow.querySelector("[data-min]");
  min.onclick = () => {
    const hidden = panel.classList.toggle("min");
    min.innerHTML = icon(hidden ? UP : DOWN);
    min.title = hidden ? "Show" : "Hide";
    min.setAttribute("aria-label", min.title);
  };
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]"))
      return;
    const cycle = (key) => {
      const list = rows[key];
      set(key, list[(list.indexOf(now()[key]) + 1) % list.length]);
    };
    if (e.key === "f") cycle("feel");
    else if (e.key === "l") cycle("layout");
    else if (e.key === "t") cycle("theme");
    else if (e.key === "0") for (const k of Object.keys(own)) set(k, own[k]);
  });
  const mount = () => document.body.append(host);
  if (document.body) mount();
  else addEventListener("DOMContentLoaded", mount);
  draw();

  function draw() {
    if (!panel) return;
    const state = now();
    for (const b of shadow.querySelectorAll("button[data-key]"))
      b.setAttribute(
        "aria-pressed",
        String(state[b.dataset.key] === b.dataset.value),
      );
  }
  function base() {
    const src = document.currentScript?.src || "";
    return src.slice(0, src.lastIndexOf("/") + 1);
  }
})();
