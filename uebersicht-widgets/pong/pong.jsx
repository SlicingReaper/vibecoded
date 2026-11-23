// PONG//SOLO — single-player Pong for Übersicht, same 230 × 314 panel as NOTE//PAD and TETRIS//GRID
// Install: run install.command in the uebersicht-widgets folder (or copy this one file into Übersicht's widgets folder).
// No backend: the game runs entirely in the widget. Scores: ~/Library/Application Support/STUDYTERM/pong-scores
//   (one line: "<previous> <best> <games>").
//
//   Click the field → play (keys only reach the widget while it has focus; clicking elsewhere pauses it).
//   A / ←  move left · D / →  move right · Space / Enter serve · P / Esc pause · R restart
//   Juggle the ball: +1 point per paddle hit, and every hit makes the ball 7 % faster (cap 640 px/s).
//   It bounces off the left, right and top walls — no gravity. Miss it and it falls out the bottom: game over.
//   Where it lands on the paddle sets the angle (edge = 60°, centre = straight up).
//
// Sits LEFT of NOTE//PAD: top 40, right 524 (= 282 + 230 + 12 gap). WIDGET//CTL default col 2 row 0.
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it) — the game pauses.
// No JSX fragments (<>…</>): Übersicht has no global React, so they crash with "Can't find variable: React".
// Style: STUDY//TERM retro terminal (near-black navy, cyan glow, monospace, corner brackets), themed by WIDGET//CTL.

import { run } from "uebersicht";

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in every widget: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "pong";
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

const SC_F = `"$HOME/Library/Application Support/STUDYTERM/pong-scores"`;

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; echo "SC:$(cat ${SC_F} 2>/dev/null)"`;

export const refreshFrequency = 2000; // 2 s — only for theme/position/hidden; the game has its own clock

export const className = `
  top: 40px;
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

// ───────── game engine (module scope: survives re-renders, resets when the file is reloaded) ─────────
const FW = 194, FH = 206;                 // field in px
const R = 3.5;                            // ball radius
const PW = 42, PH = 4, PAD_Y = FH - 12;   // paddle size + top edge
const V0 = 120, VUP = 1.07, VMAX = 640;   // start speed px/s · ×7 % per juggle · cap
const DEG = Math.PI / 180;

const G = {
  state: "idle", x: FW / 2, y: 40, vx: 0, vy: 0, px: (FW - PW) / 2, keys: { l: false, r: false },
  score: 0, prev: 0, best: 0, games: 0, newBest: false, loaded: false,
  trail: [], hitAt: 0, last: Date.now(), f: 0, cv: null, dispatch: null,
};

const now = () => Date.now();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bump = () => { G.f++; if (G.dispatch) G.dispatch({ type: "FRAME", f: G.f }); };
const speed = () => Math.hypot(G.vx, G.vy);

const serve = () => {
  G.x = FW / 2; G.y = 40;
  const a = (Math.random() * 50 - 25) * DEG;   // up to 25° either side of straight down
  G.vx = V0 * Math.sin(a); G.vy = V0 * Math.cos(a);
};

const save = () => {
  run(`mkdir -p "$HOME/Library/Application Support/STUDYTERM"; echo "${G.prev} ${G.best} ${G.games}" > ${SC_F}`).catch(() => {});
};

const start = () => {
  G.score = 0; G.newBest = false; G.trail = []; G.px = (FW - PW) / 2;
  serve(); G.state = "play"; G.last = now(); bump();
};

const gameOver = () => {
  G.state = "over";
  G.prev = G.score; G.games++;
  G.newBest = G.score > G.best;
  if (G.newBest) G.best = G.score;
  save(); bump();
};

const pause = () => { if (G.state === "play") { G.state = "pause"; G.keys.l = G.keys.r = false; bump(); } };
const resume = () => { if (G.state === "pause") { G.state = "play"; G.last = now(); bump(); } };

const step = (dt) => {
  // paddle: always a bit faster than the ball, so a fast ball is still reachable
  const dir = (G.keys.r ? 1 : 0) - (G.keys.l ? 1 : 0);
  const pv = Math.max(230, speed() * 1.1);
  G.px = clamp(G.px + dir * pv * dt, 0, FW - PW);

  // ball, in sub-steps of ≤ 2 px so it can't tunnel through the paddle at top speed
  const n = Math.max(1, Math.ceil((speed() * dt) / 2)), h = dt / n;
  for (let i = 0; i < n; i++) {
    const y0 = G.y;
    G.x += G.vx * h; G.y += G.vy * h;
    if (G.x < R) { G.x = R; G.vx = Math.abs(G.vx); }
    if (G.x > FW - R) { G.x = FW - R; G.vx = -Math.abs(G.vx); }
    if (G.y < R) { G.y = R; G.vy = Math.abs(G.vy); }
    if (G.vy > 0 && y0 + R <= PAD_Y + 0.5 && G.y + R >= PAD_Y && G.x >= G.px - R && G.x <= G.px + PW + R) {
      const off = clamp((G.x - (G.px + PW / 2)) / (PW / 2 + R), -1, 1);
      const s = Math.min(VMAX, speed() * VUP), a = off * 60 * DEG;
      G.y = PAD_Y - R; G.vx = s * Math.sin(a); G.vy = -s * Math.cos(a);
      G.score++; G.hitAt = now(); bump();
    }
    if (G.y - R > FH) { gameOver(); return; }
  }
  G.trail.push({ x: G.x, y: G.y });
  if (G.trail.length > 9) G.trail.shift();
};

const paint = () => {
  const cv = G.cv;
  if (!cv || !cv.isConnected) return;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== FW * dpr) { cv.width = FW * dpr; cv.height = FH * dpr; }
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, FW, FH);
  const glow = (col, b) => { g.shadowColor = T.glow ? col : "transparent"; g.shadowBlur = T.glow ? b : 0; };

  // big faint score in the middle, flashes on every juggle
  const fl = Math.max(0, 1 - (now() - G.hitAt) / 350);
  g.font = `bold 66px "SF Mono", Menlo, monospace`; g.textAlign = "center"; g.textBaseline = "middle";
  glow(C, 12 * fl); g.fillStyle = W_RGBA(C, 0.08 + 0.3 * fl);
  g.fillText(String(G.score), FW / 2, FH / 2 - 8);

  // the drop zone: a dashed red line along the open bottom
  glow(RED, 4); g.strokeStyle = W_RGBA(RED, 0.55); g.lineWidth = 1; g.setLineDash([4, 4]);
  g.beginPath(); g.moveTo(0, FH - 0.5); g.lineTo(FW, FH - 0.5); g.stroke(); g.setLineDash([]);

  // trail + ball
  if (G.state !== "idle") {
    glow(C, 0);
    G.trail.forEach((p, i) => {
      g.fillStyle = W_RGBA(C, 0.04 + (i / G.trail.length) * 0.22);
      g.beginPath(); g.arc(p.x, p.y, R * (0.5 + i / (2 * G.trail.length)), 0, 2 * Math.PI); g.fill();
    });
  }
  glow(C, 10); g.fillStyle = T.text;
  g.beginPath(); g.arc(G.x, G.y, R, 0, 2 * Math.PI); g.fill();

  // paddle
  const pc = G.state === "over" ? RED : C;
  glow(pc, 10); g.fillStyle = pc;
  g.fillRect(Math.round(G.px), PAD_Y, PW, PH);
  glow(pc, 0);
};

const loop = () => {
  const t = now(), dt = Math.min(t - G.last, 50) / 1000;
  G.last = t;
  if (G.state === "play") step(dt);
  paint();
};
try { if (window.__pongTimer) clearInterval(window.__pongTimer); window.__pongTimer = setInterval(loop, 16); } catch (e) {}

const LEFT = ["a", "ArrowLeft"], RIGHT = ["d", "ArrowRight"];
const keyName = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

const onKeyDown = (e) => {
  const K = keyName(e);
  let used = true;
  if (LEFT.indexOf(K) >= 0) G.keys.l = true;
  else if (RIGHT.indexOf(K) >= 0) G.keys.r = true;
  else if (G.state === "play") {
    if (K === "p" || K === "Escape") pause();
    else if (K === "r") start();
    else used = false;
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
  if (used) { e.preventDefault(); e.stopPropagation(); }
};

const onKeyUp = (e) => {
  const K = keyName(e);
  if (LEFT.indexOf(K) >= 0) G.keys.l = false;
  else if (RIGHT.indexOf(K) >= 0) G.keys.r = false;
};

const onClick = (e) => {
  e.currentTarget.focus();
  if (G.state === "idle" || G.state === "over") start();
  else if (G.state === "pause") resume();
};

const onBlur = () => { G.keys.l = G.keys.r = false; pause(); };

// ───────── look ─────────
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
@keyframes pgblink { 0%,55% { opacity: 1 } 56%,100% { opacity: .25 } }
.pg-field:focus { outline: none }
`;

const stat = (label, value, color, align) => (
  <div style={{ flex: 1, textAlign: align }}>
    <div style={{ fontSize: 7, letterSpacing: 1.5, color: DIM }}>{label}</div>
    <div style={{ fontSize: 12, letterSpacing: 0.5, color: color || T.text, marginTop: 2,
      textShadow: T.glow && color ? `0 0 6px ${color}88` : "none" }}>{value}</div>
  </div>
);

export const render = ({ output }, dispatch) => {
  G.dispatch = dispatch;
  if (/^HIDDEN/.test(output || "")) { setTimeout(pause, 0); return <div />; }
  const W_L = W_LOAD(output);
  if (W_L.unplaced) { setTimeout(pause, 0); return <div />; }
  const sm = /SC:(\d+) (\d+) (\d+)/.exec(output || "");
  if (sm && !G.loaded) {
    G.prev = parseInt(sm[1], 10) || 0;
    G.best = Math.max(G.best, parseInt(sm[2], 10) || 0);
    G.games = Math.max(G.games, parseInt(sm[3], 10) || 0);
  }
  if (/SC:/.test(output || "")) G.loaded = true;

  const col = G.state === "over" ? RED : G.state === "pause" ? AMBER : C;
  const mult = speed() / V0;
  const head = G.state === "play" ? `▶ SPD ${mult.toFixed(1)}×` : G.state === "pause" ? "II PAUSE" : G.state === "over" ? "✕ DROPPED" : "STANDBY";

  const overlay = G.state === "play" ? null : (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: `rgba(${T.bg},0.66)`, textAlign: "center", gap: 6 }}>
      {G.state === "idle" && <div style={{ fontSize: 11, letterSpacing: 2, color: C, textShadow: T.glow ? `0 0 8px ${C}` : "none" }}>PONG//SOLO</div>}
      {G.state === "idle" && <div style={{ fontSize: 7.5, letterSpacing: 1, color: DIM, lineHeight: "11px" }}>KEEP IT UP · +1 PER JUGGLE<br />IT SPEEDS UP EVERY HIT</div>}
      {G.state === "over" && <div style={{ fontSize: 11, letterSpacing: 2, color: RED, textShadow: T.glow ? `0 0 8px ${RED}` : "none" }}>GAME OVER</div>}
      {G.state === "over" && <div style={{ fontSize: 9, letterSpacing: 1, color: G.newBest ? AMBER : T.text }}>{G.score}{G.newBest ? " ★ NEW BEST" : ""}</div>}
      {G.state === "pause" && <div style={{ fontSize: 11, letterSpacing: 2, color: AMBER, textShadow: T.glow ? `0 0 8px ${AMBER}` : "none" }}>II PAUSED</div>}
      <div style={{ fontSize: 8, letterSpacing: 1.5, color: C, animation: "pgblink 1.2s steps(1) infinite" }}>
        {G.state === "pause" ? "CLICK · P" : G.state === "over" ? "CLICK · SPACE" : "▶ CLICK TO PLAY"}
      </div>
    </div>
  );

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
        <span style={{ color: C, textShadow: T.glow ? `0 0 6px ${C}` : "none" }}>PONG//SOLO</span>
        <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: col }}>{head}</span>
      </div>
      <div style={{ position: "relative", height: 1, background: `${C}33`, margin: "9px 0 8px", flexShrink: 0 }} />

      {/* scores: current · previous game · best */}
      <div style={{ position: "relative", display: "flex", flexShrink: 0, marginBottom: 8 }}>
        {stat("NOW", G.score, C, "left")}
        {stat("LAST", G.prev, null, "center")}
        {stat("BEST", Math.max(G.best, G.score), AMBER, "right")}
      </div>

      {/* field — focusable: keys only arrive while it has focus */}
      <div className="pg-field" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onClick={onClick} onBlur={onBlur} style={{
        position: "relative", width: FW, height: FH, flexShrink: 0, cursor: "pointer", userSelect: "none", overflow: "hidden",
        outline: `1px solid ${col}${G.state === "play" ? "66" : "33"}`, outlineOffset: 1, background: W_INSET(),
        backgroundImage: `linear-gradient(${W_RGBA(C, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${W_RGBA(C, 0.05)} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
      }}>
        <canvas ref={(el) => { if (el) { G.cv = el; paint(); } }} style={{ position: "absolute", left: 0, top: 0, width: FW, height: FH }} />
        {overlay}
      </div>

      <div style={{ position: "relative", marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 6.5, letterSpacing: 0.8, color: DIM }}>
        <span>A/← D/→ MOVE</span>
        <span>P PAUSE · R RESTART</span>
      </div>
    </div>
  );
};
