// What a part's scripts call, run in the page and in Node alike. meta() names the page and
// its groups, and frame() adds one frame, each checking its fields, so a frame that lacks
// a note, a `groups` written as a list or a field the page doesn't read shows where it
// stands instead of being dropped. A script that throws or fails to parse costs only
// itself: an error tile stands in its place and the frames around it still draw.
(() => {
  const TONES = ["gray", "sky", "emerald", "amber", "rose", "indigo"];
  const FRAME_FIELDS = ["title", "note", "body", "w", "h", "group", "pick", "verdict", "dark", "measure"];
  const META_FIELDS = ["title", "line", "source", "groups", "slotH", "tileMin"];
  const GROUP_FIELDS = ["mark", "name", "note", "tone"];
  const wf = (globalThis.__wf ??= { meta: null, groups: {}, states: [], errors: [], partLine: 1, line: 0 });
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const kind = (v) => (Array.isArray(v) ? "a list" : v === null ? "null" : typeof v);
  const plain = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  const size = (v) => v === undefined || (typeof v === "number" && v > 0 && Number.isFinite(v));

  /** An error tile where a frame would have been, at the frame's size when it has one. */
  const fail = (title, why, { w, h, group, line = wf.line } = {}) => {
    wf.errors.push({ title, why, line });
    wf.states.push({
      title,
      note: `This frame didn't draw: ${esc(why)}`,
      ...(size(w) && w ? { w } : {}),
      ...(size(h) && h ? { h } : {}),
      ...(typeof group === "string" && Object.hasOwn(wf.groups, group) ? { group } : {}),
      error: true,
      body: `<div data-wf-error class="grid h-full place-items-center bg-[#fdf2f2] p-12 text-center text-[#9b1c1c]"><div class="max-w-[80%]"><p class="text-[22px] font-semibold">${esc(title)}</p><p class="mt-3 font-mono text-[18px] leading-7">${esc(why)}</p>${line ? `<p class="mt-2 font-mono text-[15px] opacity-70">line ${line} of the part</p>` : ""}</div></div>`,
    });
  };

  const unknown = (o, fields, what) =>
    Object.keys(o)
      .filter((k) => !fields.includes(k))
      .map((k) => `${what} has \`${k}\`, which the page doesn't read (it reads ${fields.join(", ")})`);

  /** The page: its title, the line under it, the source line, and the sets its frames fall into. */
  const meta = (m) => {
    if (!plain(m)) return fail("Page", `meta() takes an object, not ${kind(m)}`);
    const why = unknown(m, META_FIELDS, "meta()");
    for (const k of ["title", "line", "source"])
      if (typeof m[k] !== "string" || !m[k].trim()) why.push(`meta() needs \`${k}\` as words`);
    for (const k of ["slotH", "tileMin"]) if (!size(m[k])) why.push(`meta()'s \`${k}\` is a pixel count`);
    const groups = m.groups ?? {};
    if (!plain(groups))
      why.push(`\`groups\` is ${kind(groups)}; write it as an object keyed by the name frames give in \`group\`: { now: { mark: "Now", note: "…" }, A: { mark: "A", name: "…", note: "…" } }`);
    else
      for (const [key, g] of Object.entries(groups)) {
        if (!plain(g)) {
          why.push(`group \`${key}\` is ${kind(g)}, not { mark, name, note, tone }`);
          continue;
        }
        why.push(...unknown(g, GROUP_FIELDS, `group \`${key}\``));
        if (typeof g.mark !== "string") why.push(`group \`${key}\` needs a \`mark\`: a letter, a word such as "Now", or ""`);
        if (g.tone !== undefined && !TONES.includes(g.tone)) why.push(`group \`${key}\`'s tone is one of ${TONES.join(", ")}`);
      }
    wf.meta = { ...m };
    if (plain(groups)) wf.groups = groups;
    if (why.length) fail("Page", why.join("; "));
  };

  /** One frame: `title`, `note` and `body`, with `w`, `h`, `group`, `pick` and `dark` when it needs them. */
  const frame = (s) => {
    if (!plain(s)) return fail(`Frame ${wf.states.length + 1}`, `frame() takes an object, not ${kind(s)}`);
    const title = typeof s.title === "string" && s.title.trim() ? s.title : `Frame ${wf.states.length + 1}`;
    const why = unknown(s, FRAME_FIELDS, "the frame");
    if (typeof s.title !== "string" || !s.title.trim()) why.push("it has no `title`");
    if (typeof s.note !== "string" || !s.note.trim()) why.push("it has no `note`");
    if (typeof s.body !== "string") why.push(`its \`body\` is ${kind(s.body)}, not HTML`);
    if (!size(s.w) || !size(s.h)) why.push("`w` and `h` are pixel counts, or left out for 1280 by 800");
    for (const k of ["pick", "dark"]) if (s[k] !== undefined && typeof s[k] !== "boolean") why.push(`\`${k}\` is true or left out`);
    if (s.verdict !== undefined && !["skip", "later"].includes(s.verdict)) why.push("`verdict` is \"skip\" or \"later\", or left out");
    if (s.verdict && s.pick) why.push("a frame is the pick or has a verdict, not both");
    if (s.group !== undefined && !Object.hasOwn(wf.groups, s.group))
      why.push(`its group \`${s.group}\` isn't declared; meta({ groups }) declares ${Object.keys(wf.groups).join(", ") || "none"}`);
    if (s.pick && wf.states.some((t) => t.pick && t.group === s.group)) why.push(`another frame${s.group ? ` in group \`${s.group}\`` : ""} is already the pick; star one per group`);
    if (why.length) return fail(title, why.join("; "), s);
    const state = {};
    for (const k of FRAME_FIELDS) if (s[k] !== undefined) state[k] = s[k];
    wf.states.push(state);
  };

  // The part's own names may shadow a piece (`const card = ...`), but not these two.
  for (const [name, value] of [["meta", meta], ["frame", frame]])
    Object.defineProperty(globalThis, name, { value, enumerable: true, writable: false, configurable: false });
  wf.fail = fail;

  // In the page: a script that throws or doesn't parse while the page is read becomes a tile.
  // A timer's error has no current script; a snapshot frame that fails draws its own.
  if (typeof document !== "undefined" && typeof addEventListener === "function")
    addEventListener("error", (e) => {
      if (document.readyState !== "loading" || !(e instanceof ErrorEvent) || !document.currentScript) return;
      const line = e.lineno ? e.lineno - wf.partLine + 1 : 0;
      fail("Script error", String(e.message).replace(/^Uncaught /, ""), { line: line > 0 ? line : 0 });
    });
})();
