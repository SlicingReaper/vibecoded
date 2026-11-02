// 75 Hard desktop widget — for Übersicht
// Install: 1) Get Übersicht from https://tracesof.net/uebersicht/
//          2) Menu bar icon → "Open Widgets Folder"
//          3) Copy this file there. Done — updates every 5s.
//
// Reads today's row straight out of the Attempt 2 log table in
// "03 — Fitness & Health/75 Hard.md". No extra sync point to maintain:
// log the day in that table and the widget follows.
// The day rolls at 04:00 (same rule as the ledger) — it always looks up TODAY's date row.
// Self-heal: if today's row still reads "—" (page not rebuilt since midnight), the widget runs build.py once per day by itself (stamp file h75build-<date>).
// Tap a box to tick/untick it: writes hard75.csv (+ the 🏋️/📖 Ð ledger row) and runs build.py
// via studyterm.py tick. A ❌ is never set from here — misses go through chat.
//
// Sits directly under the doubloons widget (doubloons 40 (h 176) · this 228 (h 314) · STUDY//TERM 554, fixed heights, 12 px gaps).
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it).
// Style: STUDY//TERM retro terminal (near-black navy, cyan glow, monospace, corner brackets).

import { run } from "uebersicht";

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in all five widgets: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "hard75";
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

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; V="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/X's Second Brain"; [ -d "$V" ] || V="$HOME/Documents/Obsidian Vault/X's Second Brain"; F="$V/03 — Fitness & Health/75 Hard.md"; D=$(date -v-4H "+%a %-d %b"); echo "MSG:$(cat "$HOME/Library/Application Support/STUDYTERM/hard75.json" 2>/dev/null)"; R=$(grep -F "| $D" "$F" | tail -1); case "$R" in *"| —"*) S="$HOME/Library/Application Support/STUDYTERM/h75build-$(date -v-4H +%F)"; if [ ! -f "$S" ]; then touch "$S"; export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"; (cd "$V" && python3 "00 — Meta/build.py" >/dev/null 2>&1 &) ; find "$HOME/Library/Application Support/STUDYTERM" -name "h75build-*" -mtime +7 -delete 2>/dev/null; fi;; esac; echo "ROW:$R"; echo "DONE:$(awk -F'|' '/^. *[0-9]+ *. (Mon|Tue|Wed|Thu|Fri|Sat|Sun) /{v=$(NF-1); gsub(/ /,"",v); if(v=="✅") c++} END{print c+0}' "$F")"`;

export const refreshFrequency = 5000; // 5 s

export const className = `
  top: 228px;
  right: 40px;
  font-family: "SF Mono", Menlo, ui-monospace, monospace;
  color: #cfefff;
`;

const TASKS = [
  { icon: "🏃", label: "OUTDOOR 45" },
  { icon: "🏋️", label: "INDOOR 45" },
  { icon: "💧", label: "3.8L WATER" },
  { icon: "📖", label: "10 PAGES" },
  { icon: "📸", label: "PROGRESS PHOTO" },
  { icon: "🍽️", label: "MEAL 1 + PROTEIN" },
  { icon: "🍽️", label: "MEAL 2 + FRUIT" }
];

const TOTAL = 75;
const COLS = ["w1", "w2", "water", "read", "photo", "meal1", "meal2"];

const PY = `export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"; V="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/X's Second Brain"; [ -d "$V" ] || V="$HOME/Documents/Obsidian Vault/X's Second Brain"; python3 "$V/00 — Meta/studyterm.py"`;

export const initialState = { output: "", opt: {} };
export const updateState = (ev, prev) => {
  if (ev.type === "UB/COMMAND_RAN") return { ...prev, output: ev.output || "" };
  if (ev.type === "OPT") return { ...prev, opt: { ...prev.opt, [ev.i]: { v: ev.v, t: Date.now() } } };
  return prev;
};
const BIN = "0110100101110011 1000110101001011 0011101011000101 1101001010010110 0101110100101101 1010011101010010 0110101100101011 1001010111010010 0101101001110101 1100101011010010 0011010110101101 1001011010110100";

const Bracket = ({ pos, color }) => {
  const p = {
    tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  }[pos];
  return <div style={{ position: "absolute", width: 10, height: 10, borderColor: color, borderStyle: "solid", borderWidth: 0, filter: `drop-shadow(0 0 3px ${color})`, ...p }} />;
};

export const render = ({ output, opt }, dispatch) => {
  if (/^HIDDEN/.test(output || "")) return <div />;
  const W_L = W_LOAD(output);
  if (W_L.unplaced) return <div />;
  const out = output || "";
  const row = ((/ROW:(.*)/.exec(out) || [])[1] || "").trim();
  const done = parseInt(((/DONE:(-?\d+)/.exec(out) || [])[1] || "0"), 10);

  // "| 10  | Sat 29 Aug | ✅ | ✅ | ... | ✅ |"
  const cells = row.split("|").map((c) => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
  const day = cells.length ? cells[0] : "—";
  const fresh = (i) => opt && opt[i] && Date.now() - opt[i].t < 12000;
  const marks = cells.slice(2, 9).map((m, i) => (fresh(i) ? opt[i].v : m));
  let note = {};
  try { note = JSON.parse(((/MSG:(.*)/.exec(out) || [])[1]) || "{}"); } catch (e) { note = {}; }
  const showNote = note.t && Date.now() / 1000 - note.t < 8 && (note.error || note.msg);
  const tap = (i) => {
    if (!cells.length || marks[i] === "❌") return; // "—" on today's row = page not rebuilt since midnight; tick works from hard75.csv, so allow it
    dispatch({ type: "OPT", i, v: marks[i] === "✅" ? "⬜" : "✅" });
    run(`${PY} tick ${COLS[i]}`);
  };
  const state = (i) => {
    const m = marks[i];
    if (m === "✅") return "done";
    if (m === "❌") return "miss";
    return "todo";
  };

  const inLog = cells.length > 0;
  const failed = marks.some((m) => m === "❌");
  const doneCount = marks.filter((m) => m === "✅").length;
  const remaining = TASKS.length - doneCount;
  const pct = Math.max(0, Math.min(100, (done / TOTAL) * 100));
  const col = failed ? RED : C;

  const COLOR = { done: C, miss: RED, todo: DIM };
  const GLYPH = { done: "■", miss: "✕", todo: "□" };
  const TEXT = { done: T.text, miss: RED, todo: DIM };

  return (
    <div className={"wctl-" + T.name + (T.glow ? "" : " wctl-noglow")} style={{
      width: 230, padding: "16px 18px 14px", overflow: "hidden",
      boxSizing: "border-box", height: 314,
      ...W_PANEL(col),
    }}>
      <style>{W_CSS}</style>
      {T.bin && <div style={{ position: "absolute", inset: 0, fontSize: 8, lineHeight: "10px", letterSpacing: 2, color: C, opacity: 0.06, wordBreak: "break-all", pointerEvents: "none" }}>{BIN}{BIN}</div>}
      {T.brackets && ["tl", "tr", "bl", "br"].map((p) => <Bracket key={p} pos={p} color={col} />)}

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: 2 }}>
        <span style={{ color: C, textShadow: `0 0 6px ${C}` }}>75//HARD</span>
        <span style={{ color: DIM }}>DAY</span>
      </div>

      <div style={{
        position: "relative", fontSize: 44, fontWeight: 600, textAlign: "center", margin: "6px 0 10px",
        fontVariantNumeric: "tabular-nums", color: col, textShadow: `0 0 14px ${col}aa`,
      }}>{day}</div>

      <div style={{ position: "relative", height: 5, background: `${C}18`, border: `1px solid ${C}40` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C, boxShadow: `0 0 8px ${C}` }} />
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 8.5, letterSpacing: 1, color: DIM, marginTop: 5 }}>
        <span>{done}/{TOTAL} CLEAN</span>
        <span>{Math.max(0, TOTAL - done)} TO GO</span>
      </div>

      <div style={{ position: "relative", height: 1, background: `${C}33`, margin: "12px 0 10px" }} />

      <div style={{ position: "relative" }}>
        {TASKS.map((t, i) => {
          const s = state(i);
          return (
            <div key={i} onClick={() => tap(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", marginBottom: i === TASKS.length - 1 ? 0 : 3, cursor: s === "miss" || !inLog ? "default" : "pointer", userSelect: "none" }}>
              <span style={{ fontSize: 10, color: COLOR[s], width: 12, textAlign: "center", flexShrink: 0, textShadow: s === "done" ? `0 0 6px ${C}` : "none" }}>{GLYPH[s]}</span>
              <span style={{ fontSize: 10, opacity: s === "todo" ? 0.45 : 1, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ fontSize: 9.5, letterSpacing: 1, color: TEXT[s], textDecoration: s === "done" ? "line-through" : "none", textDecorationColor: `${C}66` }}>{t.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "relative", fontSize: 8.5, letterSpacing: 1.5, marginTop: 12, textAlign: "center",
        color: !inLog ? DIM : failed ? RED : remaining === 0 ? C : AMBER,
        textShadow: inLog && remaining === 0 && !failed ? `0 0 6px ${C}` : "none",
      }}>
        {showNote
          ? <span style={{ color: note.error ? RED : C }}>{note.error || note.msg}</span>
          : !inLog
          ? "NO ROW FOR TODAY"
          : failed
            ? "RULE MISSED — RESTART AT DAY 1"
            : remaining === 0
              ? "DAY COMPLETE ■"
              : `${remaining} LEFT TODAY`}
      </div>
    </div>
  );
};
