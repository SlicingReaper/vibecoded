// NOTE//PAD — notepad checklist widget for Übersicht
// Install: Übersicht menu-bar icon → "Open Widgets Folder" → copy this file in
//          (or double-click "Install STUDYTERM.command", which copies all four widgets).
// Backend: 00 — Meta/notepad.py · data: 00 — Meta/data/notepad.json (in the vault).
//
//   Bottom field: click, type, ⏎ → the note lands on the board as a checklist row. Esc leaves the field.
//   Tap a row     → ticked: struck through + a draining bar for 5 s, then it folds away into the bin.
//                   Tap it again during those 5 s to undo.
//   Notes expire 3 days after they were written → bin. The bin deletes them for good after 3 years.
//   Deadlines: put ONE token anywhere in the note (digits only, fewer digits = less specific):
//     t/DDHHMM        countdown   t/45 = 45 days · t/0012 = 12 h · t/000030 = 30 min
//     d/DDMMYY(HHMM)  date        d/05 = next 5th · d/0511 = next 5 Nov · d/0511261430 = 5 Nov 2026 14:30 (no time = 23:59)
//   The row then shows ⏱ time to the deadline (cyan → amber < 24 h → red LATE). Deadline notes expire 3 days AFTER the deadline.
//   A bad token (31 Feb, a past date…) keeps your text in the field and flashes the reason in red.
//   BIN ▸ (top right) → recently deleted (ticked ✓ and expired ⌛), newest first. ↺ puts one back on the board.
//
// Sits LEFT of the doubloons wallet: top 40, right 282 (= 40 + 230 wallet + 12 gap). Same 230 × 314 as 75 Hard.
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it).
// No JSX fragments (<>…</>): Übersicht has no global React, so they crash with "Can't find variable: React".
// Style: STUDY//TERM retro terminal (near-black navy, cyan glow, monospace, corner brackets).

import { run } from "uebersicht";

const V = `V="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/X's Second Brain"; [ -d "$V" ] || V="$HOME/Documents/Obsidian Vault/X's Second Brain"`;
const PY = `export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"; ${V}; python3 "$V/00 — Meta/notepad.py"`;

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in all five widgets: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "notepad";
const W_CFG = `cat "$HOME/Library/Application Support/STUDYTERM/widgets.json" 2>/dev/null | tr -d '\\n\\r'`;
// schemes = colours. c accent · blue/amber/red status · dim muted · bg panel rgb · inset field rgb · text body. cycle = rainbow hue drift
const W_SCHEMES = {
  cyan:    { c: "#3ef0ff", blue: "#1f8fff", amber: "#ffb84d", red: "#ff5f6d", dim: "#5d7a99", bg: "4,9,20",      inset: "10,24,48",    text: "#cfefff" },
  amber:   { c: "#ffb000", blue: "#ff7b29", amber: "#ffe066", red: "#ff4d3d", dim: "#8f7350", bg: "16,9,2",      inset: "40,22,6",     text: "#ffe9c4" },
  matrix:  { c: "#3dff7f", blue: "#19c25e", amber: "#d8ff47", red: "#ff4f6b", dim: "#4f8a62", bg: "2,13,6",      inset: "6,32,14",     text: "#d4ffe1" },
  vapor:   { c: "#ff5ad9", blue: "#8b6dff", amber: "#ffc857", red: "#ff4f7e", dim: "#8c6fa3", bg: "15,5,25",     inset: "38,14,56",    text: "#f7deff" },
  sunset:  { c: "#ff8c5a", blue: "#ffc06b", amber: "#ffe07a", red: "#ff4f6d", dim: "#9c7a72", bg: "22,9,10",     inset: "52,20,22",    text: "#ffe7dc" },
  ice:     { c: "#eaf6ff", blue: "#8ec9ff", amber: "#ffd38f", red: "#ff8f8f", dim: "#7e90a6", bg: "12,16,24",    inset: "30,38,52",    text: "#f3f8ff" },
  gold:    { c: "#e8c15a", blue: "#c9a227", amber: "#f5dc8c", red: "#d9534f", dim: "#8a7a4f", bg: "8,8,8",       inset: "26,24,18",    text: "#f3e6c0" },
  royal:   { c: "#ffffff", blue: "#d9c8ff", amber: "#ffd479", red: "#ff8fa3", dim: "#b9a3e6", bg: "74,32,140",   inset: "98,54,170",   text: "#f4eeff" },
  marble:  { c: "#2d2a26", blue: "#5b6b7a", amber: "#a07a2c", red: "#b0413e", dim: "#8d877e", bg: "243,240,234", inset: "228,224,216", text: "#3a3631" },
  pastel:  { c: "#8a6fd1", blue: "#5f9bd6", amber: "#d69a4a", red: "#d9707f", dim: "#a59bb4", bg: "251,245,252", inset: "240,232,246", text: "#4d4560" },
  rose:    { c: "#f2b5a7", blue: "#d79a8c", amber: "#f5d0a9", red: "#e0707a", dim: "#8f7471", bg: "26,17,19",    inset: "48,32,35",    text: "#f8e4df" },
  ink:     { c: "#111111", blue: "#3a3a3a", amber: "#8a6d1f", red: "#c0392b", dim: "#8a8a8a", bg: "255,255,255", inset: "240,240,240", text: "#1a1a1a" },
  forest:  { c: "#a8d5a2", blue: "#7fb7a4", amber: "#e3c77a", red: "#e08a7a", dim: "#6f8a6a", bg: "14,26,18",    inset: "26,44,32",    text: "#e2f1df" },
  ocean:   { c: "#7fdbff", blue: "#4aa3df", amber: "#ffd27f", red: "#ff7f8f", dim: "#5f86a3", bg: "6,28,48",     inset: "14,48,76",    text: "#e2f5ff" },
  rainbow: { c: "#ff4fd8", blue: "#4fa8ff", amber: "#ffd84f", red: "#ff4f6b", dim: "#9a7fb8", bg: "12,6,22",     inset: "34,18,52",    text: "#fbeaff", cycle: true },
};
// styles = finish. tex grid|scan|glass|marble|none · bw border px · hard = offset shadow · glow = neon text/edges
const W_STYLES = {
  terminal: { tex: "grid",   bin: true,  brackets: true,  radius: 0,  alpha: 0.88, blur: 22, glow: true,  edge: "55", bw: 1 },
  crt:      { tex: "scan",   bin: false, brackets: true,  radius: 4,  alpha: 0.92, blur: 16, glow: true,  edge: "77", bw: 1 },
  glass:    { tex: "glass",  bin: false, brackets: false, radius: 18, alpha: 0.5,  blur: 30, glow: true,  edge: "40", bw: 1 },
  minimal:  { tex: "none",   bin: false, brackets: false, radius: 8,  alpha: 0.95, blur: 10, glow: false, edge: "30", bw: 1 },
  marble:   { tex: "marble", bin: false, brackets: false, radius: 12, alpha: 0.97, blur: 8,  glow: false, edge: "44", bw: 1 },
  paper:    { tex: "none",   bin: false, brackets: false, radius: 14, alpha: 0.98, blur: 0,  glow: false, edge: "18", bw: 1, soft: true },
  bold:     { tex: "none",   bin: false, brackets: false, radius: 0,  alpha: 1,    blur: 0,  glow: false, edge: "",   bw: 2, hard: true },
};
let C, BLUE, AMBER, RED, DIM, T;
let W_LAST = null, W_POS = { position: "relative" };
const W_RGBA = (hex, a) => { const n = parseInt(String(hex).slice(1), 16) || 0; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const W_INSET = () => `rgba(${T.inset},0.55)`;
const W_APPLY = (style, scheme) => {
  const st = W_STYLES[style] ? style : "terminal", sc = W_SCHEMES[scheme] ? scheme : "cyan";
  T = { ...W_STYLES[st], ...W_SCHEMES[sc], name: st };
  C = T.c; BLUE = T.blue; AMBER = T.amber; RED = T.red; DIM = T.dim;
};
W_APPLY("terminal", "cyan");
const W_LOAD = (output) => {
  const m = /CFG:(\{.*\})/.exec(output || "");
  if (m) { try { W_LAST = JSON.parse(m[1]); } catch (e) {} }
  const cfg = W_LAST || {}, g = cfg.global || {}, w = (cfg.widgets || {})[W_ID] || {};
  W_APPLY(w.style || g.style, w.scheme || g.scheme);
  const ok = typeof w.x === "number" && typeof w.y === "number";
  W_POS = ok ? { position: "fixed", left: w.x, top: w.y } : { position: "relative" };
  return { unplaced: w.placed === false };
};
const W_TEX = () => {
  if (T.tex === "grid") return `linear-gradient(${W_RGBA(C, 0.045)} 1px, transparent 1px), linear-gradient(90deg, ${W_RGBA(C, 0.045)} 1px, transparent 1px)`;
  if (T.tex === "scan") return `repeating-linear-gradient(0deg, ${W_RGBA(C, 0.07)} 0px, ${W_RGBA(C, 0.07)} 1px, transparent 1px, transparent 3px)`;
  if (T.tex === "glass") return `linear-gradient(135deg, ${W_RGBA(C, 0.12)}, transparent 55%)`;
  if (T.tex === "marble") {
    const v = W_RGBA(T.dim, 0.38), v2 = W_RGBA(T.dim, 0.2);
    return [
      `linear-gradient(118deg, transparent 31%, ${v} 31.6%, transparent 33%)`,
      `linear-gradient(152deg, transparent 58%, ${v2} 58.5%, transparent 60.5%)`,
      `linear-gradient(28deg, transparent 69%, ${v2} 69.4%, transparent 70.6%)`,
      `linear-gradient(97deg, transparent 12%, ${v2} 12.3%, transparent 13.4%)`,
      `radial-gradient(ellipse at 78% 22%, ${W_RGBA(T.text, 0.06)}, transparent 55%)`,
      `radial-gradient(ellipse at 15% 85%, ${W_RGBA(T.dim, 0.12)}, transparent 50%)`,
    ].join(", ");
  }
  return "none";
};
// col = the widget's own frame colour (STUDY//TERM: dim at standby, amber paused). Flat styles only show
// it when it means something — standby dim would turn their solid border + hard shadow muddy, so they use the accent.
const W_PANEL = (c0) => { const col = !T.glow && c0 === DIM ? C : c0; return ({
  ...W_POS,
  background: `rgba(${T.bg},${T.alpha})`, backdropFilter: `blur(${T.blur}px)`, WebkitBackdropFilter: `blur(${T.blur}px)`,
  border: `${T.bw}px solid ${col}${T.edge}`, borderRadius: T.radius, color: T.text,
  boxShadow: T.hard ? `5px 5px 0 ${col}`
    : T.soft ? "0 10px 26px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18)"
    : (T.glow ? `0 8px 30px rgba(0,0,0,0.45), 0 0 18px ${col}22` : "0 6px 20px rgba(0,0,0,0.35)") + (T.tex === "scan" ? ", inset 0 0 40px rgba(0,0,0,0.55)" : ""),
  backgroundImage: W_TEX(),
  backgroundSize: T.tex === "grid" ? "12px 12px" : "auto",
  animation: T.cycle ? "wctlhue 16s linear infinite" : "none",
}); };
const W_CSS = `.wctl-noglow * { text-shadow: none !important; filter: none !important; }
@keyframes wctlhue { from { filter: hue-rotate(0deg) } to { filter: hue-rotate(360deg) } }`;
// ── end WIDGET//CTL block ──

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; ${PY} state`;

export const refreshFrequency = 2000; // 2 s

export const className = `
  top: 40px;
  right: 282px;
  font-family: "SF Mono", Menlo, ui-monospace, monospace;
  color: #cfefff;
`;

const GRACE = 5000;   // ms a ticked note stays on the board
const FOLD = 600;     // ms of the fold-away animation after that

export const initialState = { output: "", view: "board", ticks: {}, armed: "", flash: null };

export const updateState = (ev, prev) => {
  switch (ev.type) {
    case "UB/COMMAND_RAN":
    case "STATE":
      return { ...prev, output: ev.output || prev.output };
    case "VIEW":
      return { ...prev, view: ev.view, armed: "" };
    case "TICK":
      return { ...prev, ticks: { ...prev.ticks, [ev.id]: ev.t } };
    case "UNTICK": {
      const ticks = { ...prev.ticks };
      ticks[ev.id] = 0; // 0 = explicitly unticked, beats a stale done_at from the backend
      return { ...prev, ticks };
    }
    case "ARM":
      return { ...prev, armed: ev.id };
    case "FLASH":
      return { ...prev, flash: ev.text ? { text: ev.text, t: Date.now() } : null };
    default:
      return prev;
  }
};

const BIN = "0110100101110011 1000110101001011 0011101011000101 1101001010010110 0101110100101101 1010011101010010 0110101100101011 1001010111010010 0101101001110101 1100101011010010 0011010110101101 1001011010110100";
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
const act = (dispatch, c) => run(`${PY} ${c}`).then((out) => dispatch({ type: "STATE", output: out })).catch(() => {});

const left = (s) => {
  const h = Math.floor(s / 3600);
  if (h >= 24) return `${Math.floor(h / 24)}D ${h % 24}H`;
  if (h >= 1) return `${h}H`;
  return `${Math.max(1, Math.floor(s / 60))}M`;
};
const when = (ts) => {
  const d = new Date(ts * 1000);
  return `${String(d.getDate()).padStart(2, "0")} ${MON[d.getMonth()]}`;
};

const Bracket = ({ pos, color }) => {
  const p = {
    tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  }[pos];
  return <div style={{ position: "absolute", width: 10, height: 10, borderColor: color, borderStyle: "solid", borderWidth: 0, filter: `drop-shadow(0 0 3px ${color})`, ...p }} />;
};

const CSS = () => `
@keyframes npdrain { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@keyframes npfold  { 0% { opacity: 1; max-height: 60px; transform: translateX(0) }
                     100% { opacity: 0; max-height: 0; margin: 0; padding: 0; transform: translateX(24px) } }
@keyframes npin    { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes npblink { 0%,55% { opacity: 1 } 56%,100% { opacity: 0 } }
.np-list::-webkit-scrollbar { width: 3px }
.np-list::-webkit-scrollbar-thumb { background: ${W_RGBA(C, 0.35)} }
.np-in::placeholder { color: ${W_RGBA(DIM, 0.75)}; letter-spacing: 1.5px }
.np-in:focus { outline: none }
.np-row:hover .np-txt { color: ${T.text} }
.np-btn:hover { background: ${W_RGBA(C, 0.14)} !important }
`;

export const render = ({ output, view, ticks, armed, flash }, dispatch) => {
  if (/^HIDDEN/.test(output || "")) return <div />;
  const W_L = W_LOAD(output);
  if (W_L.unplaced) return <div />;
  let s = { board: [], bin: [] };
  try { s = JSON.parse((output || "").trim().split("\n").pop() || "{}"); } catch (e) { s = { board: [], bin: [], error: "BACKEND OFFLINE" }; }
  const board = s.board || [], bin = s.bin || [];
  const nowMs = Date.now();

  // tick time for a row: local tap wins, else the backend's done_at (only inside the grace window)
  const tickedAt = (it) => {
    if (ticks && it.id in ticks) return ticks[it.id] || null;
    return it.done_at ? it.done_at * 1000 : null;
  };
  const rows = board.filter((it) => {
    const t = tickedAt(it);
    return !t || nowMs - t < GRACE + FOLD;
  });
  // a tap the backend has already moved to the bin still shows from local state
  Object.keys(ticks || {}).forEach((id) => {
    const t = ticks[id];
    if (t && nowMs - t < GRACE + FOLD && !rows.find((r) => r.id === id)) {
      const b = bin.find((x) => x.id === id);
      if (b) rows.push({ id, text: b.text, left: 0, created: 0 });
    }
  });
  const open = rows.filter((it) => !tickedAt(it)).length;

  const tap = (it) => {
    const t = tickedAt(it);
    if (t) {
      if (nowMs - t >= GRACE) return;
      dispatch({ type: "UNTICK", id: it.id });
      act(dispatch, `untick ${it.id}`);
    } else {
      dispatch({ type: "TICK", id: it.id, t: Date.now() });
      act(dispatch, `tick ${it.id}`);
    }
  };
  const submit = (e) => {
    if (e.key === "Escape") { e.target.blur(); return; }
    if (e.key !== "Enter") return;
    const text = e.target.value.trim();
    if (!text) return;
    const field = e.target;
    field.value = "";
    run(`${PY} add ${b64(text)}`).then((out) => {
      dispatch({ type: "STATE", output: out });
      let r = {};
      try { r = JSON.parse((out || "").trim().split("\n").pop()); } catch (err) { r = {}; }
      if (r.error) {                       // bad deadline: give the text back and say why
        if (!field.value) field.value = text;
        field.focus();
        dispatch({ type: "FLASH", text: r.error });
      } else dispatch({ type: "FLASH", text: "" });
    }).catch(() => {});
  };
  const flashing = flash && nowMs - flash.t < 5000;
  const restore = (id) => {
    if (armed !== id) { dispatch({ type: "ARM", id }); return; }
    dispatch({ type: "ARM", id: "" });
    dispatch({ type: "UNTICK", id });
    act(dispatch, `restore ${id}`);
  };

  const isBin = view === "bin";
  const col = s.error ? RED : C;

  // plain functions, not components: keeps each row's DOM node (and its animation) alive across refreshes
  const Row = (it) => {
    const t = tickedAt(it);
    const done = !!t;
    const el = done ? Math.max(0, nowMs - t) : 0;
    const urgent = !done && it.left < 12 * 3600;
    const dueIn = it.due ? it.due - nowMs / 1000 : null;
    const late = dueIn !== null && dueIn <= 0;
    const label = done ? "DONE" : dueIn === null ? left(it.left) : late ? `LATE ${left(-dueIn)}` : `⏱ ${left(dueIn)}`;
    const labelCol = done ? C : dueIn === null ? (urgent ? AMBER : DIM) : late ? RED : dueIn < 86400 ? AMBER : C;
    return (
      <div key={it.id} className="np-row" onClick={() => tap(it)} style={{
        position: "relative", display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0 4px", marginBottom: 2,
        cursor: done && el >= GRACE ? "default" : "pointer", userSelect: "none", overflow: "hidden",
        animation: done ? `npfold ${FOLD}ms ease-in ${(GRACE - el) / 1000}s forwards` : "npin .35s ease-out",
      }}>
        <span style={{ fontSize: 10, lineHeight: "13px", width: 12, textAlign: "center", flexShrink: 0,
          color: done ? C : DIM, textShadow: done ? `0 0 6px ${C}` : "none" }}>{done ? "■" : "□"}</span>
        <span className="np-txt" style={{ flex: 1, fontSize: 9.5, lineHeight: "13px", letterSpacing: 0.4, wordBreak: "break-word",
          color: done ? `${C}aa` : T.text, textDecoration: done ? "line-through" : "none", textDecorationColor: `${C}aa`,
          transition: "color .25s" }}>{it.text}</span>
        <span style={{ fontSize: 7.5, lineHeight: "13px", letterSpacing: 1, flexShrink: 0,
          color: labelCol, opacity: done || dueIn !== null ? 0.95 : 0.8,
          textShadow: dueIn !== null && !done ? `0 0 5px ${labelCol}88` : "none" }}>{label}</span>
        {done && (
          <div style={{ position: "absolute", left: 20, right: 0, bottom: 0, height: 1.5, background: C, boxShadow: `0 0 6px ${C}`,
            transformOrigin: "left", animation: `npdrain ${GRACE}ms linear ${-el / 1000}s forwards` }} />
        )}
      </div>
    );
  };

  const BinRow = (it) => {
    const exp = it.reason === "expired";
    const hot = armed === it.id;
    return (
      <div key={it.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0 4px", marginBottom: 2 }}>
        <span style={{ fontSize: 9, lineHeight: "13px", width: 12, textAlign: "center", flexShrink: 0, color: exp ? AMBER : C }}>{exp ? "⌛" : "✓"}</span>
        <span style={{ flex: 1, fontSize: 9.5, lineHeight: "13px", letterSpacing: 0.4, wordBreak: "break-word", color: DIM,
          textDecoration: exp ? "none" : "line-through", textDecorationColor: `${DIM}aa` }}>{it.text}</span>
        <span style={{ fontSize: 7.5, lineHeight: "13px", letterSpacing: 1, color: DIM, flexShrink: 0 }}>{when(it.binned_at)}</span>
        <span className="np-btn" onClick={() => restore(it.id)} title="Put back on the board" style={{
          fontSize: hot ? 7.5 : 10, lineHeight: "13px", padding: "0 3px", flexShrink: 0, cursor: "pointer", userSelect: "none",
          color: hot ? AMBER : BLUE, border: `1px solid ${hot ? AMBER : BLUE}55`, letterSpacing: hot ? 1 : 0 }}>{hot ? "SURE?" : "↺"}</span>
      </div>
    );
  };

  return (
    <div className={"wctl-" + T.name + (T.glow ? "" : " wctl-noglow")} style={{
      width: 230, height: 314, padding: "16px 18px 14px", overflow: "hidden",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
      ...W_PANEL(col),
    }}>
      <style>{CSS()}</style>
      <style>{W_CSS}</style>
      {T.bin && <div style={{ position: "absolute", inset: 0, fontSize: 8, lineHeight: "10px", letterSpacing: 2, color: C, opacity: 0.06, wordBreak: "break-all", pointerEvents: "none" }}>{BIN}{BIN}</div>}
      {T.brackets && ["tl", "tr", "bl", "br"].map((p) => <Bracket key={p} pos={p} color={col} />)}

      {/* header */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, letterSpacing: 2, flexShrink: 0 }}>
        <span style={{ color: C, textShadow: `0 0 6px ${C}` }}>{isBin ? "NOTE//BIN" : "NOTE//PAD"}</span>
        <span className="np-btn" onClick={() => dispatch({ type: "VIEW", view: isBin ? "board" : "bin" })} style={{
          cursor: "pointer", userSelect: "none", padding: "1px 5px", fontSize: 8.5, letterSpacing: 1.5,
          color: isBin ? C : BLUE, border: `1px solid ${(isBin ? C : BLUE)}55` }}>
          {isBin ? "◂ BOARD" : `BIN ${bin.length} ▸`}
        </span>
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 8.5, letterSpacing: 1, color: DIM, marginTop: 6, flexShrink: 0 }}>
        {isBin
          ? [<span key="l">✓ DONE · ⌛ EXPIRED</span>, <span key="r">WIPE 3Y</span>]
          : flashing
            ? [<span key="e" style={{ color: RED, textShadow: `0 0 6px ${RED}88` }}>✕ {flash.text}</span>]
            : [<span key="l">{open} OPEN</span>, <span key="r">t/ d/ · EXPIRE 3D</span>]}
      </div>

      <div style={{ position: "relative", height: 1, background: `${C}33`, margin: "9px 0 8px", flexShrink: 0 }} />

      {/* list — column-reverse keeps the newest note next to the input and the scroll pinned to the bottom */}
      <div className="np-list" style={{ position: "relative", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        display: "flex", flexDirection: isBin ? "column" : "column-reverse", paddingRight: 2 }}>
        {isBin
          ? (bin.length
            ? bin.map(BinRow)
            : <div style={{ margin: "auto", fontSize: 8.5, letterSpacing: 1.5, color: DIM }}>BIN IS EMPTY</div>)
          : (rows.length
            ? rows.slice().reverse().map(Row)
            : <div style={{ margin: "auto", fontSize: 8.5, letterSpacing: 1.5, color: DIM }}>BOARD CLEAR ■</div>)}
      </div>

      {/* bottom: input on the board, status in the bin */}
      {isBin ? (
        <div style={{ position: "relative", flexShrink: 0, marginTop: 8, fontSize: 8.5, letterSpacing: 1.5, textAlign: "center",
          color: s.msg ? C : DIM, minHeight: 26, lineHeight: "26px", borderTop: `1px solid ${C}22` }}>
          {s.error || s.msg || `${bin.length} IN BIN · ↺ TO RESTORE`}
        </div>
      ) : (
        <div style={{ position: "relative", flexShrink: 0, marginTop: 8, display: "flex", alignItems: "center", gap: 6,
          height: 26, padding: "0 8px", border: `1px solid ${flashing ? RED : C}44`, background: W_INSET(),
          boxShadow: `inset 0 0 8px ${C}1a` }}>
          <span style={{ color: C, fontSize: 11, textShadow: `0 0 6px ${C}`, flexShrink: 0 }}>›</span>
          <input className="np-in" type="text" maxLength={280} placeholder={s.error && !flashing ? s.error : "NEW NOTE  t/ d/  ⏎"}
            onKeyDown={submit} onClick={(e) => e.target.focus()} spellCheck={false} autoComplete="off"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", color: T.text, caretColor: C,
              fontFamily: "inherit", fontSize: 10, letterSpacing: 0.5, padding: 0 }} />
        </div>
      )}
    </div>
  );
};
