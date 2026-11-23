// TETRIS//GRID — Tetris for Übersicht, same 230 × 314 panel as NOTE//PAD
// Install: run install.command in the uebersicht-widgets folder (or copy this one file into Übersicht's widgets folder).
// No backend: the game runs entirely in the widget. Best score: ~/Library/Application Support/STUDYTERM/tetris-best
//
//   Click the board → play (keys only reach the widget while it has focus; clicking elsewhere pauses it).
//   ← →  move · ↑ / X rotate · Z rotate back · ↓ soft drop · Space hard drop · C / Shift hold · P / Esc pause · R restart
//   7-bag randomiser, ghost piece, hold, next preview. Level up every 10 lines. Score 100/300/500/800 × level,
//   +1 per soft-drop row, +2 per hard-drop row.
//
// Sits UNDER NOTE//PAD: top 366 (= 40 + 314 notepad + 12 gap), right 282. Same 230 × 314 as NOTE//PAD and 75 Hard.
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it) — the game pauses.
// No JSX fragments (<>…</>): Übersicht has no global React, so they crash with "Can't find variable: React".
// Style: STUDY//TERM retro terminal (near-black navy, cyan glow, monospace, corner brackets), themed by WIDGET//CTL.

import { run } from "uebersicht";

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in every widget: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "tetris";
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

const BEST_F = `"$HOME/Library/Application Support/STUDYTERM/tetris-best"`;

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; echo "BEST:$(cat ${BEST_F} 2>/dev/null)"`;

export const refreshFrequency = 2000; // 2 s — only for theme/position/hidden; the game has its own clock

export const className = `
  top: 366px;
  right: 282px;
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

// ───────── game engine (module scope: survives re-renders, resets when the file is reloaded) ─────────
const COLS = 10, ROWS = 20, CELL = 12, MINI = 7, CLEAR_MS = 200;
const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const LINE_PTS = [0, 100, 300, 500, 800];

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const rotCW = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
const rotCCW = (m) => rotCW(rotCW(rotCW(m)));

const G = {
  board: emptyBoard(), cur: null, queue: [], bag: [], hold: null, canHold: true,
  score: 0, lines: 0, level: 1, best: 0, state: "idle", acc: 0, last: Date.now(),
  clearing: null, f: 0, dispatch: null, saved: 0,
};

const bump = () => { G.f++; if (G.dispatch) G.dispatch({ type: "FRAME", f: G.f }); };
const speed = () => Math.max(70, 800 - (G.level - 1) * 65);

const draw = () => {
  if (!G.bag.length) {
    const b = "IJLOSTZ".split("");
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    G.bag = b;
  }
  return G.bag.pop();
};
const fill = () => { while (G.queue.length < 1) G.queue.push(draw()); };

const collide = (m, x, y) => {
  for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
    if (!m[r][c]) continue;
    const bx = x + c, by = y + r;
    if (bx < 0 || bx >= COLS || by >= ROWS) return true;
    if (by >= 0 && G.board[by][bx]) return true;
  }
  return false;
};

const piece = (k) => {
  const m = SHAPES[k].map((r) => r.slice());
  return { k, m, x: Math.floor((COLS - m[0].length) / 2), y: k === "I" ? -1 : 0 };
};

const spawn = (k) => {
  fill();
  const p = piece(k || G.queue.shift());
  fill();
  G.cur = p; G.acc = 0;
  if (collide(p.m, p.x, p.y)) gameOver();
};

const saveBest = () => {
  if (G.best > G.saved) {
    G.saved = G.best;
    run(`mkdir -p "$HOME/Library/Application Support/STUDYTERM"; echo ${G.best} > ${BEST_F}`).catch(() => {});
  }
};

const gameOver = () => {
  G.state = "over";
  if (G.score > G.best) G.best = G.score;
  saveBest();
};

const start = () => {
  G.board = emptyBoard(); G.queue = []; G.bag = []; G.hold = null; G.canHold = true;
  G.score = 0; G.lines = 0; G.level = 1; G.clearing = null; G.state = "play"; G.last = Date.now();
  spawn();
  bump();
};

const lock = () => {
  const p = G.cur;
  let above = false;
  p.m.forEach((row, r) => row.forEach((v, c) => {
    if (!v) return;
    if (p.y + r < 0) above = true; else G.board[p.y + r][p.x + c] = p.k;
  }));
  G.cur = null; G.canHold = true;
  if (above) { gameOver(); return; }
  const full = [];
  G.board.forEach((row, y) => { if (row.every((v) => v)) full.push(y); });
  if (full.length) G.clearing = { rows: full, t: Date.now() };
  else spawn();
};

const finishClear = () => {
  const rows = G.clearing.rows;
  G.board = G.board.filter((_, y) => rows.indexOf(y) < 0);
  while (G.board.length < ROWS) G.board.unshift(Array(COLS).fill(null));
  G.score += LINE_PTS[rows.length] * G.level;
  G.lines += rows.length;
  G.level = Math.floor(G.lines / 10) + 1;
  if (G.score > G.best) G.best = G.score;
  G.clearing = null;
  spawn();
};

const move = (dx, dy) => {
  const p = G.cur;
  if (!p || collide(p.m, p.x + dx, p.y + dy)) return false;
  p.x += dx; p.y += dy;
  return true;
};

const rotate = (dir) => {
  const p = G.cur;
  if (!p || p.k === "O") return;
  const m = dir > 0 ? rotCW(p.m) : rotCCW(p.m);
  const kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];
  for (const [kx, ky] of kicks) {
    if (!collide(m, p.x + kx, p.y + ky)) { p.m = m; p.x += kx; p.y += ky; return; }
  }
};

const ghostY = () => {
  const p = G.cur;
  let y = p.y;
  while (!collide(p.m, p.x, y + 1)) y++;
  return y;
};

const hardDrop = () => {
  if (!G.cur) return;
  const y = ghostY();
  G.score += (y - G.cur.y) * 2;
  G.cur.y = y;
  lock();
};

const holdPiece = () => {
  if (!G.cur || !G.canHold) return;
  const k = G.cur.k;
  if (G.hold) { const h = G.hold; G.hold = k; spawn(h); }
  else { G.hold = k; spawn(); }
  G.canHold = false;
};

const pause = () => { if (G.state === "play") { G.state = "pause"; if (G.score > G.best) G.best = G.score; saveBest(); bump(); } };
const resume = () => { if (G.state === "pause") { G.state = "play"; G.last = Date.now(); bump(); } };

const loop = () => {
  const now = Date.now(), dt = Math.min(now - G.last, 250);
  G.last = now;
  if (G.state !== "play") return;
  if (G.clearing) { if (now - G.clearing.t >= CLEAR_MS) { finishClear(); bump(); } return; }
  if (!G.cur) return;
  G.acc += dt;
  if (G.acc >= speed()) {
    G.acc = 0;
    if (!move(0, 1)) lock();
    bump();
  }
};
try { if (window.__tetrisTimer) clearInterval(window.__tetrisTimer); window.__tetrisTimer = setInterval(loop, 30); } catch (e) {}

const onKey = (e) => {
  const k = e.key, K = k.length === 1 ? k.toLowerCase() : k;
  let used = true;
  if (G.state === "play" && !G.clearing && G.cur) {
    if (K === "ArrowLeft" || K === "a") move(-1, 0);
    else if (K === "ArrowRight" || K === "d") move(1, 0);
    else if (K === "ArrowDown" || K === "s") { if (move(0, 1)) { G.score += 1; G.acc = 0; } }
    else if (K === "ArrowUp" || K === "w" || K === "x") rotate(1);
    else if (K === "z") rotate(-1);
    else if (K === " ") hardDrop();
    else if (K === "c" || K === "Shift") holdPiece();
    else if (K === "p" || K === "Escape") pause();
    else if (K === "r") start();
    else used = false;
  } else if (G.state === "play") {
    if (K === "p" || K === "Escape") pause(); else used = false;
  } else if (G.state === "pause") {
    if (K === "p" || K === " " || K === "Enter") resume();
    else if (K === "r") start();
    else if (K === "Escape") e.currentTarget.blur();
    else used = false;
  } else {
    if (K === " " || K === "Enter" || K === "r") start();
    else if (K === "Escape") e.currentTarget.blur();
    else used = false;
  }
  if (used) { e.preventDefault(); e.stopPropagation(); bump(); }
};

const onClick = (e) => {
  e.currentTarget.focus();
  if (G.state === "idle" || G.state === "over") start();
  else if (G.state === "pause") resume();
};

// ───────── look ─────────
const MIX = (a, b, t) => {
  const p = (h) => { const n = parseInt(String(h).slice(1), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const colours = () => ({
  I: C, J: BLUE, O: AMBER, Z: RED,
  L: MIX(AMBER, RED, 0.5), S: MIX(C, AMBER, 0.5), T: MIX(BLUE, RED, 0.5),
});

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
@keyframes tgflash { 0% { opacity: .95 } 100% { opacity: 0 } }
@keyframes tgblink { 0%,55% { opacity: 1 } 56%,100% { opacity: .25 } }
.tg-board:focus { outline: none }
`;

const block = (key, x, y, col, size, ghost) => (
  <div key={key} style={{
    position: "absolute", left: x * size, top: y * size, width: size - 1, height: size - 1, boxSizing: "border-box",
    borderRadius: T.radius ? 2 : 0,
    background: ghost ? "transparent" : W_RGBA(col, 0.82),
    border: ghost ? `1px solid ${W_RGBA(col, 0.45)}` : "none",
    boxShadow: ghost ? "none" : T.glow
      ? `0 0 5px ${W_RGBA(col, 0.55)}, inset 0 0 0 1px rgba(255,255,255,0.18)`
      : "inset 0 0 0 1px rgba(0,0,0,0.18)",
  }} />
);

const mini = (k, label, dim) => {
  const box = { position: "relative", height: 34, border: `1px solid ${C}33`, background: W_INSET(), marginTop: 3 };
  if (!k) return <div style={box} />;
  const m = SHAPES[k].filter((r) => r.some((v) => v));
  const w = m[0].length * MINI, h = m.length * MINI;
  const col = colours()[k];
  const cells = [];
  m.forEach((row, r) => row.forEach((v, c) => { if (v) cells.push(block(`${label}${r}${c}`, c, r, dim ? DIM : col, MINI, false)); }));
  return (
    <div style={box}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 }}>{cells}</div>
    </div>
  );
};

const stat = (label, value, color) => (
  <div style={{ marginTop: 7 }}>
    <div style={{ fontSize: 7, letterSpacing: 1.5, color: DIM }}>{label}</div>
    <div style={{ fontSize: 11, letterSpacing: 0.5, color: color || T.text, marginTop: 1,
      textShadow: T.glow && color ? `0 0 6px ${color}88` : "none" }}>{value}</div>
  </div>
);

export const render = ({ output }, dispatch) => {
  G.dispatch = dispatch;
  if (/^HIDDEN/.test(output || "")) { setTimeout(pause, 0); return <div />; }
  const W_L = W_LOAD(output);
  if (W_L.unplaced) { setTimeout(pause, 0); return <div />; }
  const bm = /BEST:(\d+)/.exec(output || "");
  if (bm) { const b = parseInt(bm[1], 10) || 0; if (b > G.best) G.best = b; if (b > G.saved) G.saved = b; }

  const col = G.state === "over" ? RED : G.state === "pause" ? AMBER : C;
  const COL = colours();

  // board cells: settled, ghost, active, clear flash
  const cells = [];
  G.board.forEach((row, y) => row.forEach((k, x) => { if (k) cells.push(block(`b${x}-${y}`, x, y, COL[k], CELL, false)); }));
  if (G.cur && G.state !== "over") {
    const p = G.cur, gy = ghostY(), pc = COL[p.k];
    p.m.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      if (gy !== p.y && gy + r >= 0) cells.push(block(`g${r}${c}`, p.x + c, gy + r, pc, CELL, true));
    }));
    p.m.forEach((row, r) => row.forEach((v, c) => {
      if (v && p.y + r >= 0) cells.push(block(`p${r}${c}`, p.x + c, p.y + r, pc, CELL, false));
    }));
  }
  if (G.clearing) G.clearing.rows.forEach((y) => cells.push(
    <div key={`c${y}-${G.clearing.t}`} style={{ position: "absolute", left: 0, top: y * CELL, width: COLS * CELL, height: CELL - 1,
      background: T.text, boxShadow: T.glow ? `0 0 10px ${C}` : "none", animation: `tgflash ${CLEAR_MS}ms ease-out forwards` }} />
  ));

  const overlay = G.state === "play" ? null : (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `rgba(${T.bg},0.72)`, textAlign: "center", gap: 6 }}>
      {G.state === "over" && <div style={{ fontSize: 11, letterSpacing: 2, color: RED, textShadow: T.glow ? `0 0 8px ${RED}` : "none" }}>GAME OVER</div>}
      {G.state === "over" && <div style={{ fontSize: 9, letterSpacing: 1, color: T.text }}>{G.score}{G.score >= G.best && G.score > 0 ? " ★ BEST" : ""}</div>}
      {G.state === "pause" && <div style={{ fontSize: 11, letterSpacing: 2, color: AMBER, textShadow: T.glow ? `0 0 8px ${AMBER}` : "none" }}>II PAUSED</div>}
      <div style={{ fontSize: 8, letterSpacing: 1.5, color: C, animation: "tgblink 1.2s steps(1) infinite" }}>
        {G.state === "pause" ? "CLICK · P" : G.state === "over" ? "CLICK · R" : "▶ CLICK TO PLAY"}
      </div>
    </div>
  );

  const head = G.state === "play" ? `▶ LV ${G.level}` : G.state === "pause" ? "II PAUSE" : G.state === "over" ? "✕ OVER" : "STANDBY";

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
        <span style={{ color: C, textShadow: T.glow ? `0 0 6px ${C}` : "none" }}>TETRIS//GRID</span>
        <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: col }}>{head}</span>
      </div>
      <div style={{ position: "relative", height: 1, background: `${C}33`, margin: "9px 0 8px", flexShrink: 0 }} />

      <div style={{ position: "relative", display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
        {/* board — focusable: keys only arrive while it has focus */}
        <div className="tg-board" tabIndex={0} onKeyDown={onKey} onClick={onClick} onBlur={pause} style={{
          position: "relative", width: COLS * CELL, height: ROWS * CELL, flexShrink: 0, cursor: "pointer",
          outline: `1px solid ${col}${G.state === "play" ? "66" : "33"}`, outlineOffset: 1, background: W_INSET(),
          backgroundImage: `linear-gradient(${W_RGBA(C, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${W_RGBA(C, 0.06)} 1px, transparent 1px)`,
          backgroundSize: `${CELL}px ${CELL}px`, overflow: "hidden", userSelect: "none",
        }}>
          {cells}
          {overlay}
        </div>

        {/* side panel */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 7, letterSpacing: 1.5, color: DIM }}>NEXT</div>
          {mini(G.state === "idle" ? null : G.queue[0], "n", false)}
          <div style={{ fontSize: 7, letterSpacing: 1.5, color: DIM, marginTop: 7 }}>HOLD {G.canHold ? "" : "·"}</div>
          {mini(G.hold, "h", !G.canHold)}
          {stat("SCORE", G.score, C)}
          {stat("LINES", G.lines)}
          {stat("BEST", Math.max(G.best, G.score), AMBER)}
          <div style={{ marginTop: "auto", fontSize: 6.5, lineHeight: "9px", letterSpacing: 0.6, color: DIM }}>
            <div>←→ MOVE ↓ SOFT</div>
            <div>↑ ROT ␣ DROP</div>
            <div>C HOLD P PAUSE</div>
          </div>
        </div>
      </div>
    </div>
  );
};
