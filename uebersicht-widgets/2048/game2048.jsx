// 2048//TILE — 2048 for Übersicht, same 230 × 314 panel as NOTE//PAD and TETRIS//GRID
// Install: run install.command in the uebersicht-widgets folder (or copy this one file into Übersicht's widgets folder).
// No backend: the game runs entirely in the widget. Saved in ~/Library/Application Support/STUDYTERM/:
//   2048-state.json (the board — survives reloads, sleep and reboot) · 2048-best (best score)
//
//   Click the board → play (keys only reach the widget while it has focus; clicking elsewhere pauses it).
//   ← → ↑ ↓ / WASD / HJKL slide · or press on the board and drag · U undo (one step) · P / Esc pause · R new game
//   Spawns 90 % 2 / 10 % 4. Reach 2048 → win screen, click to keep going. Score = sum of every merged tile.
//
// Sits UNDER PONG//SOLO: WIDGET//CTL col 2 row 7 → fallback top 366 (= 40 + 314 pong + 12 gap), right 524.
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it) — the game pauses.
// No JSX fragments (<>…</>): Übersicht has no global React, so they crash with "Can't find variable: React".
// Style: STUDY//TERM retro terminal (near-black navy, cyan glow, monospace, corner brackets), themed by WIDGET//CTL.

import { run } from "uebersicht";

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in every widget: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "g2048";
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
  vice:    { c: "#ff4fa3", blue: "#2de2e6", amber: "#ffb347", red: "#ff3f5e", dim: "#a07ab8", bg: "24,8,40",     inset: "52,16,72",    text: "#ffe6f3" },
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
  vice:     { tex: "vice",   bin: false, brackets: false, radius: 10, alpha: 0.9,  blur: 20, glow: true,  edge: "88", bw: 1 },
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
  if (T.tex === "vice") return [
    `radial-gradient(ellipse at 88% 118%, ${W_RGBA(T.amber, 0.42)}, transparent 58%)`,
    `radial-gradient(ellipse at 8% -12%, ${W_RGBA(C, 0.30)}, transparent 60%)`,
    `repeating-linear-gradient(0deg, ${W_RGBA(T.blue, 0.07)} 0px, ${W_RGBA(T.blue, 0.07)} 1px, transparent 1px, transparent 9px)`,
    `linear-gradient(160deg, ${W_RGBA(C, 0.10)}, ${W_RGBA(T.blue, 0.08)})`,
  ].join(", ");
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

const BEST_F = `"$HOME/Library/Application Support/STUDYTERM/2048-best"`;
const SAVE_F = `"$HOME/Library/Application Support/STUDYTERM/2048-state.json"`;

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; echo "BEST:$(cat ${BEST_F} 2>/dev/null)"; echo "SAVE:$(cat ${SAVE_F} 2>/dev/null | tr -d '\\n\\r')"`;

export const refreshFrequency = 2000; // 2 s — only for theme/position/hidden; the game reacts to keys itself

export const className = `
  top: 366px;
  right: 524px;
  font-family: "SF Mono", Menlo, ui-monospace, monospace;
  color: #cfefff;
`;

export const initialState = { output: "", f: 0 };

export const updateState = (ev, prev) => {
  switch (ev.type) {
    case "UB/COMMAND_RAN":
      return { ...prev, output: ev.output || prev.output };
    case "FRAME":
      return { ...prev, f: ev.f };
    default:
      return prev;
  }
};

// ───────── game engine (module scope: survives re-renders; the board itself is saved to Application Support) ─────────
const N = 4, BOARD = 186, GAP = 6, CELL = (BOARD - GAP * (N + 1)) / N, SLIDE_MS = 110, WIN = 2048;
const posOf = (i) => GAP + i * (CELL + GAP);

const G = {
  tiles: [], dead: [], score: 0, best: 0, saved: 0, state: "idle", won: false, keep: false,
  undo: null, gain: 0, gainT: 0, nid: 1, f: 0, dispatch: null, loaded: false, drag: null,
};

const bump = () => { G.f++; if (G.dispatch) G.dispatch({ type: "FRAME", f: G.f }); };
const at = (r, c) => G.tiles.find((t) => t.r === r && t.c === c);
const empties = () => {
  const e = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!at(r, c)) e.push([r, c]);
  return e;
};
const add = () => {
  const e = empties();
  if (!e.length) return;
  const [r, c] = e[Math.floor(Math.random() * e.length)];
  G.tiles.push({ id: G.nid++, v: Math.random() < 0.9 ? 2 : 4, r, c, born: true });
};
const grid = () => {
  const g = Array.from({ length: N }, () => Array(N).fill(0));
  G.tiles.forEach((t) => { g[t.r][t.c] = t.v; });
  return g;
};
const fromGrid = (g) => {
  G.tiles = [];
  g.forEach((row, r) => row.forEach((v, c) => { if (v) G.tiles.push({ id: G.nid++, v, r, c }); }));
};

const canMove = () => {
  if (empties().length) return true;
  const g = grid();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (c + 1 < N && g[r][c] === g[r][c + 1]) return true;
    if (r + 1 < N && g[r][c] === g[r + 1][c]) return true;
  }
  return false;
};

const save = () => {
  const s = JSON.stringify({ g: grid(), score: G.score, won: G.won, keep: G.keep, over: G.state === "over" });
  const best = G.best > G.saved ? G.best : 0;
  if (best) G.saved = best;
  run(`D="$HOME/Library/Application Support/STUDYTERM"; mkdir -p "$D"; printf '%s' '${s}' > ${SAVE_F}${best ? `; echo ${best} > ${BEST_F}` : ""}`).catch(() => {});
};

const start = () => {
  G.tiles = []; G.dead = []; G.score = 0; G.won = false; G.keep = false; G.undo = null; G.gain = 0;
  add(); add();
  G.state = "play";
  save(); bump();
};

// dir: 0 left · 1 right · 2 up · 3 down
const slide = (dir) => {
  const before = { g: grid(), score: G.score, won: G.won };
  let moved = false, gained = 0;
  G.tiles.forEach((t) => { t.born = false; t.merged = false; });
  G.dead = [];
  for (let line = 0; line < N; line++) {
    const cells = [];
    for (let i = 0; i < N; i++) {
      const k = dir === 1 || dir === 3 ? N - 1 - i : i;
      cells.push(dir < 2 ? [line, k] : [k, line]);
    }
    const row = cells.map(([r, c]) => at(r, c)).filter(Boolean);
    const out = [];
    row.forEach((t) => {
      const last = out[out.length - 1];
      if (last && last.v === t.v && !last.merged) {
        last.v *= 2; last.merged = true; gained += last.v;
        G.dead.push(t);
        t.r = last.r; t.c = last.c; moved = true;
      } else {
        const [r, c] = cells[out.length];
        if (t.r !== r || t.c !== c) moved = true;
        t.r = r; t.c = c;
        out.push(t);
      }
    });
  }
  if (!moved) { G.dead = []; return; }
  G.tiles = G.tiles.filter((t) => G.dead.indexOf(t) < 0);
  G.undo = before;
  G.score += gained;
  if (gained) { G.gain = gained; G.gainT = Date.now(); }
  if (G.score > G.best) G.best = G.score;
  add();
  if (!G.won && G.tiles.some((t) => t.v >= WIN)) { G.won = true; if (!G.keep) G.state = "win"; }
  if (!canMove()) G.state = "over";
  save();
  const d = G.dead;
  setTimeout(() => { if (G.dead === d) { G.dead = []; bump(); } }, SLIDE_MS + 20);
};

const undo = () => {
  if (!G.undo) return;
  fromGrid(G.undo.g); G.score = G.undo.score; G.won = G.undo.won; G.undo = null; G.dead = [];
  G.state = "play"; save();
};

const pause = () => { if (G.state === "play") { G.state = "pause"; save(); bump(); } };
const resume = () => { if (G.state === "pause") { G.state = "play"; bump(); } };

const DIRS = { ArrowLeft: 0, a: 0, h: 0, ArrowRight: 1, d: 1, l: 1, ArrowUp: 2, w: 2, k: 2, ArrowDown: 3, s: 3, j: 3 };

const onKey = (e) => {
  const k = e.key, K = k.length === 1 ? k.toLowerCase() : k;
  let used = true;
  if (G.state === "play") {
    if (K in DIRS) slide(DIRS[K]);
    else if (K === "u" || (K === "z" && (e.metaKey || e.ctrlKey))) undo();
    else if (K === "p" || K === "Escape") pause();
    else if (K === "r") start();
    else used = false;
  } else if (G.state === "pause") {
    if (K === "p" || K === " " || K === "Enter" || K in DIRS) resume();
    else if (K === "r") start();
    else if (K === "Escape") e.currentTarget.blur();
    else used = false;
  } else if (G.state === "win") {
    if (K === " " || K === "Enter" || K === "c") { G.keep = true; G.state = "play"; save(); }
    else if (K === "r") start();
    else used = false;
  } else if (G.state === "over") {
    if (K === "u") undo();
    else if (K === " " || K === "Enter" || K === "r") start();
    else if (K === "Escape") e.currentTarget.blur();
    else used = false;
  } else {
    if (K === " " || K === "Enter" || K === "r") start();
    else if (K === "Escape") e.currentTarget.blur();
    else used = false;
  }
  if (used) { e.preventDefault(); e.stopPropagation(); bump(); }
};

// mouse swipe: press on the board, drag ≥ 18 px, release
const onDown = (e) => { G.drag = { x: e.clientX, y: e.clientY }; };
const onUp = (e) => {
  const d = G.drag; G.drag = null;
  e.currentTarget.focus();
  if (G.state === "idle") { start(); return; }
  if (G.state === "pause") { resume(); return; }
  if (G.state === "win") { G.keep = true; G.state = "play"; save(); bump(); return; }
  if (G.state === "over") { start(); return; }
  if (!d) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  slide(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : (dy < 0 ? 2 : 3));
  bump();
};

// restore the saved board once, on the first refresh that brings it
const restore = (output) => {
  if (G.loaded) return;
  const m = /SAVE:(\{.*\})/.exec(output || "");
  if (!/SAVE:/.test(output || "")) return; // command hasn't run yet
  G.loaded = true;
  if (!m) return;
  try {
    const s = JSON.parse(m[1]);
    if (!Array.isArray(s.g) || s.g.length !== N) return;
    fromGrid(s.g);
    if (!G.tiles.length) return;
    G.score = s.score || 0; G.won = !!s.won; G.keep = !!s.keep;
    G.state = s.over || !canMove() ? "over" : "pause";
  } catch (e) {}
};

// ───────── look ─────────
const MIX = (a, b, t) => {
  const p = (h) => { const n = parseInt(String(h).slice(1), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
// value → colour, climbing the scheme: dim → blue → accent → amber → red → text
const tileCol = (v) => {
  const ramp = [
    MIX(DIM, T.text, 0.25), DIM, BLUE, MIX(BLUE, C, 0.5), C, MIX(C, AMBER, 0.5),
    AMBER, MIX(AMBER, RED, 0.35), MIX(AMBER, RED, 0.7), RED, T.text,
  ];
  const i = Math.round(Math.log2(v)) - 1;
  return ramp[Math.max(0, Math.min(ramp.length - 1, i))];
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

const CSS = () => `
@keyframes g4born { 0% { transform: scale(0); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
@keyframes g4pop { 0% { transform: scale(1) } 45% { transform: scale(1.16) } 100% { transform: scale(1) } }
@keyframes g4gain { 0% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(-10px) } }
@keyframes g4blink { 0%,55% { opacity: 1 } 56%,100% { opacity: .25 } }
.g4-board:focus { outline: none }
`;

const tile = (t, dead) => {
  const col = tileCol(t.v), big = t.v >= WIN;
  const fs = t.v < 128 ? 14 : t.v < 1024 ? 12 : t.v < 16384 ? 10 : 8.5;
  return (
    <div key={t.id} style={{
      position: "absolute", left: posOf(t.c), top: posOf(t.r), width: CELL, height: CELL,
      transition: `left ${SLIDE_MS}ms ease-out, top ${SLIDE_MS}ms ease-out`, zIndex: dead ? 1 : 2,
    }}>
      <div key={t.v} style={{
        width: "100%", height: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: T.radius ? 4 : 0, border: `1px solid ${W_RGBA(col, 0.75)}`,
        background: W_RGBA(col, big ? 0.42 : 0.12 + Math.min(0.24, Math.log2(t.v) * 0.022)),
        color: t.v <= 4 ? T.text : col, fontSize: fs, fontWeight: 600, letterSpacing: 0.5,
        textShadow: T.glow ? `0 0 6px ${W_RGBA(col, 0.8)}` : "none",
        boxShadow: T.glow ? `0 0 ${big ? 14 : 6}px ${W_RGBA(col, big ? 0.6 : 0.3)}, inset 0 0 0 1px rgba(255,255,255,0.06)` : T.hard ? `2px 2px 0 ${W_RGBA(col, 0.6)}` : "none",
        animation: t.born ? `g4born 120ms ease-out ${SLIDE_MS - 20}ms backwards` : t.merged ? `g4pop 140ms ease-out ${SLIDE_MS - 30}ms` : "none",
      }}>{t.v}</div>
    </div>
  );
};

const stat = (label, value, color, extra) => (
  <div style={{ position: "relative", flex: 1, border: `1px solid ${C}33`, background: W_INSET(), padding: "4px 7px" }}>
    <div style={{ fontSize: 7, letterSpacing: 1.5, color: DIM }}>{label}</div>
    <div style={{ fontSize: 11, letterSpacing: 0.5, color, marginTop: 1, textShadow: T.glow ? `0 0 6px ${color}88` : "none" }}>{value}</div>
    {extra}
  </div>
);

export const render = ({ output }, dispatch) => {
  G.dispatch = dispatch;
  if (/^HIDDEN/.test(output || "")) { setTimeout(pause, 0); return <div />; }
  const W_L = W_LOAD(output);
  if (W_L.unplaced) { setTimeout(pause, 0); return <div />; }
  const bm = /BEST:(\d+)/.exec(output || "");
  if (bm) { const b = parseInt(bm[1], 10) || 0; if (b > G.best) G.best = b; if (b > G.saved) G.saved = b; }
  restore(output);

  const col = G.state === "over" ? RED : G.state === "pause" || G.state === "win" ? AMBER : C;
  const max = G.tiles.reduce((m, t) => Math.max(m, t.v), 0);

  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push(
    <div key={`s${r}${c}`} style={{ position: "absolute", left: posOf(c), top: posOf(r), width: CELL, height: CELL, boxSizing: "border-box",
      borderRadius: T.radius ? 4 : 0, border: `1px dashed ${W_RGBA(C, 0.14)}`, background: W_RGBA(C, 0.025) }} />
  );
  G.dead.forEach((t) => cells.push(tile(t, true)));
  G.tiles.forEach((t) => cells.push(tile(t, false)));

  const overlay = G.state === "play" ? null : (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `rgba(${T.bg},0.72)`, textAlign: "center", gap: 6 }}>
      {G.state === "over" && <div style={{ fontSize: 11, letterSpacing: 2, color: RED, textShadow: T.glow ? `0 0 8px ${RED}` : "none" }}>NO MOVES LEFT</div>}
      {G.state === "over" && <div style={{ fontSize: 9, letterSpacing: 1, color: T.text }}>{G.score}{G.score >= G.best && G.score > 0 ? " ★ BEST" : ""}</div>}
      {G.state === "win" && <div style={{ fontSize: 12, letterSpacing: 2, color: AMBER, textShadow: T.glow ? `0 0 10px ${AMBER}` : "none" }}>★ 2048 ★</div>}
      {G.state === "pause" && <div style={{ fontSize: 11, letterSpacing: 2, color: AMBER, textShadow: T.glow ? `0 0 8px ${AMBER}` : "none" }}>II PAUSED</div>}
      <div style={{ fontSize: 8, letterSpacing: 1.5, color: C, animation: "g4blink 1.2s steps(1) infinite" }}>
        {G.state === "pause" ? "CLICK · P TO RESUME" : G.state === "over" ? "CLICK · R  ·  U UNDO" : G.state === "win" ? "CLICK · KEEP GOING" : "▶ CLICK TO PLAY"}
      </div>
    </div>
  );

  const head = G.state === "play" ? `▶ MAX ${max}` : G.state === "pause" ? "II PAUSE" : G.state === "over" ? "✕ OVER" : G.state === "win" ? "★ WIN" : "STANDBY";
  const fresh = G.gain && Date.now() - G.gainT < 700;

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
        <span style={{ color: C, textShadow: T.glow ? `0 0 6px ${C}` : "none" }}>2048//TILE</span>
        <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: col }}>{head}</span>
      </div>
      <div style={{ position: "relative", height: 1, background: `${C}33`, margin: "9px 0 8px", flexShrink: 0 }} />

      {/* score row */}
      <div style={{ position: "relative", display: "flex", gap: 8, flexShrink: 0 }}>
        {stat("SCORE", G.score, C, fresh ? (
          <span key={G.gainT} style={{ position: "absolute", right: 6, top: 12, fontSize: 9, color: AMBER, animation: "g4gain 700ms ease-out forwards" }}>+{G.gain}</span>
        ) : null)}
        {stat("BEST", Math.max(G.best, G.score), AMBER)}
      </div>

      {/* board — focusable: keys only arrive while it has focus */}
      <div className="g4-board" tabIndex={0} onKeyDown={onKey} onMouseDown={onDown} onMouseUp={onUp} onBlur={pause} style={{
        position: "relative", width: BOARD, height: BOARD, margin: "8px auto 0", flexShrink: 0, cursor: "pointer",
        outline: `1px solid ${col}${G.state === "play" ? "66" : "33"}`, outlineOffset: 1, background: W_INSET(),
        overflow: "hidden", userSelect: "none",
      }}>
        {cells}
        {overlay}
      </div>

      <div style={{ position: "relative", marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 6.5, letterSpacing: 0.6, color: DIM }}>
        <span>←↑↓→ / DRAG SLIDE</span>
        <span>U UNDO · P · R NEW</span>
      </div>
    </div>
  );
};
