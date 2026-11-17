// The pieces pages kept writing for themselves, in a neutral look: each takes what goes
// inside it first and its options second, so a page passes its own HTML in rather than
// copying the piece. A part may define a piece of the same name, and its own wins.
// Write class names out whole: Tailwind can't see one built by interpolation.

/** A desktop window: a title bar, then `children`. `side` puts a column at its left, `top` a bar under the title, `over` a layer over all of it. `win("Mail", inner)` works too. */
const win = (children = "", opts = {}) => {
  const o = typeof opts === "string" ? { title: children } : opts;
  const inner = typeof opts === "string" ? opts : children;
  const { title = "", side = "", top = "", over = "", lights = true, cls = "" } = o;
  const dot = `<span class="size-2.5 rounded-full bg-gray-300"></span>`;
  return `<div class="relative flex h-full flex-col overflow-hidden bg-card text-foreground ${cls}">
    <div class="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-background px-3">${lights ? dot + dot + dot : ""}<span class="ml-2 truncate text-xs text-muted-foreground">${title}</span></div>
    ${top}
    <div class="flex min-h-0 flex-1">${side}<div class="relative min-w-0 flex-1 overflow-hidden">${inner}</div></div>
    ${over}
  </div>`;
};

/** A row of controls: `children` from the left and `end` against the right edge, `h` pixels tall. */
const bar = (children = "", { end = "", h = 44, rule = true, cls = "" } = {}) =>
  `<div class="flex shrink-0 items-center gap-2 px-3 ${rule ? "border-b border-border" : ""} ${cls}" style="height:${h}px">${children}${end ? `<span class="min-w-0 flex-1"></span>${end}` : ""}</div>`;

/** A panel: `title`, an `icon` and a `line` head it, `end` sits at the head's right, `children` fill it and `foot` closes it. `w` in pixels. */
const card = (children = "", { title = "", line = "", icon = "", end = "", foot = "", w, pad = true, cls = "" } = {}) => {
  const head = title || line || end ? `<div class="flex items-start gap-2.5">${icon ? `<i class="ph ${icon} mt-0.5 text-base text-muted-foreground"></i>` : ""}<div class="min-w-0 flex-1">${title ? `<p class="text-sm font-medium">${title}</p>` : ""}${line ? `<p class="mt-0.5 text-xs leading-5 text-muted-foreground">${line}</p>` : ""}</div>${end}</div>` : "";
  return `<div class="rounded-xl border border-border bg-card ${pad ? "p-4" : ""} ${cls}"${w ? ` style="width:${w}px"` : ""}>${head}${children ? `<div class="${head ? "mt-3" : ""}">${children}</div>` : ""}${foot ? `<div class="mt-3 flex items-center gap-2">${foot}</div>` : ""}</div>`;
};

/** A small status label. `chip("Paused", "bg-warning-50 text-warning-800")` passes finished classes; `{ icon, on }` as options. */
const chip = (label, opts = {}) => {
  const { cls = "bg-accent text-muted-foreground", icon = "", on = false } = typeof opts === "string" ? { cls: opts } : opts;
  return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${on ? "bg-foreground text-background" : cls}">${icon ? `<i class="ph ${icon}"></i>` : ""}${label}</span>`;
};

/** A rounded label a person presses: a filter, a tag, a suggestion. `on` is pressed; `end` goes after the words (a count, an ×). */
const pill = (label, opts = {}) => {
  const { icon = "", on = false, end = "", cls = "" } = typeof opts === "string" ? { cls: opts } : opts;
  return `<span class="inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] ${on ? "bg-foreground text-background" : "bg-card text-foreground ring-1 ring-border"} ${cls}">${icon ? `<i class="ph ${icon} text-sm"></i>` : ""}${label}${end}</span>`;
};

/** Part of a true-size drawing: `w` by `h` of `html`, from its pixel `x`, `y`. Give the frame the same `w` and `h`; `size` is the drawing's own, 1280 by 800 unless said. */
const crop = (html, { x = 0, y = 0, w = 640, h = 400, size = [globalThis.W ?? 1280, globalThis.H ?? 800] } = {}) =>
  `<div class="relative overflow-hidden" style="width:${w}px;height:${h}px"><div class="absolute" style="left:${-x}px;top:${-y}px;width:${size[0]}px;height:${size[1]}px">${html}</div></div>`;

/** A grey block standing in for a picture, a map or anything incidental, sized by its classes. `children` sit inside it. */
const box = (cls = "h-24 w-full", children = "") => `<div class="rounded-lg bg-black/[0.07] ${cls}">${children}</div>`;

/** A box a person types into: `text` typed (with the caret when `focus`), or `ph` waiting; `chips` above the words, `start` and `end` at its ends. */
const composer = ({ text = "", ph = "Write a message", chips = "", start = "", end = `<span class="grid size-7 place-items-center rounded-full bg-foreground text-background"><i class="ph ph-arrow-up text-sm"></i></span>`, focus = false, w, cls = "" } = {}) =>
  `<div class="rounded-xl border ${focus ? "border-foreground/30 ring-2 ring-foreground/10" : "border-border"} bg-card p-2 ${cls}"${w ? ` style="width:${w}px"` : ""}>${chips ? `<div class="flex flex-wrap gap-1 px-1 pb-2">${chips}</div>` : ""}<div class="flex items-center gap-2">${start}<span class="min-w-0 flex-1 truncate px-1 text-[13px] ${text ? "" : "text-gray-400"}">${text}${focus ? `<span class="inline-block h-4 w-px translate-y-0.5 bg-foreground"></span>` : ""}${text ? "" : ph}</span>${end}</div></div>`;
