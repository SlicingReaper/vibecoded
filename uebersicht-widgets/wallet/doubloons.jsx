// WALLET//Ð — points wallet for Übersicht (standalone: no Obsidian needed)
// Install: run install.command in the uebersicht-widgets folder (copies this file + wallet.py into place).
// Backend: ~/Library/Application Support/STUDYTERM/standalone/bin/wallet.py · data: …/standalone/data/wallet.json
//
//   Earn points for things you want to do more of, spend them on rewards. Tap the bottom line, type, ⏎:
//     +50 gym        earn 50          -120 new game   spend 120
//     lock 100       move 100 into the 🔒 VAULT (locked savings, not spendable)
//     unlock 40      take 40 back out  ·  undo  removes the last entry  ·  Esc leaves the field
//   STUDY//TERM pays logged study time into this wallet (15 Ð per 25 min by default — see study-term/README.md).
//   STREAK = days in a row with at least one earning. Days roll over at 04:00.
//
// Default spot: top-right (top 40, right 40), 230 × 176. Move it with WIDGET//CTL (⌃⌥⌘S).
// Hidden while ~/Library/Application Support/STUDYTERM/hidden exists (⌃⌥⌘W toggles it).
// No JSX fragments (<>…</>): Übersicht has no global React, so they crash with "Can't find variable: React".

import { run } from "uebersicht";

// ── WIDGET//CTL block — theme + position, set by the WIDGET//CTL app (⌃⌥⌘S). Identical in every widget: change them together. ──
// Reads ~/Library/Application Support/STUDYTERM/widgets.json on every refresh. No file / no entry for this widget →
// it keeps its className spot and the cyan terminal look, exactly as before. "placed": false → stored (renders nothing).
const W_ID = "doubloons";
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

const PY = `export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"; python3 "$HOME/Library/Application Support/STUDYTERM/standalone/bin/wallet.py"`;

export const command = `H="$HOME/Library/Application Support/STUDYTERM/hidden"; [ -f "$H" ] && { echo HIDDEN; exit 0; }; echo "CFG:$(${W_CFG})"; echo "W:$(${PY} state 2>/dev/null)"`;

export const refreshFrequency = 10000; // 10 s

export const className = `
  top: 40px;
  right: 40px;
  font-family: "SF Mono", Menlo, ui-monospace, monospace;
  color: #cfefff;
`;

export const initialState = { output: "", typing: false, flash: null };

export const updateState = (ev, prev) => {
  switch (ev.type) {
    case "UB/COMMAND_RAN":
      return { ...prev, output: ev.output || prev.output };
    case "WALLET": {
      // swap the W: line for the fresh one the action printed, keep CFG
      const keep = (prev.output || "").split("\n").filter((l) => !/^W:/.test(l)).join("\n");
      return { ...prev, output: keep + "\nW:" + (ev.json || "{}") };
    }
    case "TYPE":
      return { ...prev, typing: ev.on };
    case "FLASH":
      return { ...prev, flash: ev.text ? { text: ev.text, err: !!ev.err, t: Date.now() } : null };
    default:
      return prev;
  }
};

const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
const BIN = "0110100101110011 1000110101001011 0011101011000101 1101001010010110 0101110100101101 1010011101010010 0110101100101011 1001010111010010";

const Bracket = ({ pos }) => {
  const p = {
    tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  }[pos];
  return <div style={{ position: "absolute", width: 10, height: 10, borderColor: C, borderStyle: "solid", borderWidth: 0, filter: `drop-shadow(0 0 3px ${C})`, ...p }} />;
};

const Stat = ({ v, k, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 15, fontWeight: 600, color, textShadow: `0 0 6px ${color}88` }}>{v}</div>
    <div style={{ fontSize: 8, letterSpacing: 1.5, color: DIM, marginTop: 2 }}>{k}</div>
  </div>
);

export const render = ({ output, typing, flash }, dispatch) => {
  if (/^HIDDEN/.test(output || "")) return <div />;
  const W_L = W_LOAD(output);
  if (W_L.unplaced) return <div />;
  let w = null;
  try { w = JSON.parse(((/W:(.*)/.exec(output || "") || [])[1]) || "null"); } catch (e) { w = null; }
  const ok = w && typeof w.balance === "number";
  const v = (k) => (ok ? w[k] : "?");
  const flashing = flash && Date.now() - flash.t < 5000;

  const submit = (e) => {
    if (e.key === "Escape") { dispatch({ type: "TYPE", on: false }); return; }
    if (e.key !== "Enter") return;
    const text = e.target.value.trim();
    if (!text) return;
    const field = e.target;
    run(`${PY} add ${b64(text)}`).then((out) => {
      let r = {};
      try { r = JSON.parse((out || "").trim().split("\n").pop()); } catch (err) { r = {}; }
      dispatch({ type: "WALLET", json: JSON.stringify(r) });
      if (r.error) { dispatch({ type: "FLASH", text: r.error, err: true }); field.focus(); }
      else { field.value = ""; dispatch({ type: "TYPE", on: false }); dispatch({ type: "FLASH", text: r.msg || "SAVED" }); }
    }).catch(() => dispatch({ type: "FLASH", text: "BACKEND OFFLINE", err: true }));
  };

  return (
    <div className={"wctl-" + T.name + (T.glow ? "" : " wctl-noglow")} style={{
      width: 230, padding: "16px 18px 14px", overflow: "hidden",
      boxSizing: "border-box", height: 176,
      ...W_PANEL(ok ? C : RED),
    }}>
      <style>{W_CSS}</style>
      <style>{`.wl-in::placeholder{color:${W_RGBA(DIM, 0.85)};letter-spacing:1px} .wl-in:focus{outline:none} .wl-foot:hover{color:${C} !important}`}</style>
      {T.bin && <div style={{ position: "absolute", inset: 0, fontSize: 8, lineHeight: "10px", letterSpacing: 2, color: C, opacity: 0.06, wordBreak: "break-all", pointerEvents: "none" }}>{BIN}{BIN}</div>}
      {T.brackets && ["tl", "tr", "bl", "br"].map((p) => <Bracket key={p} pos={p} />)}

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: 2 }}>
        <span style={{ color: C, textShadow: `0 0 6px ${C}` }}>WALLET//Ð</span>
        <span style={{ color: DIM }}>SPENDABLE</span>
      </div>

      <div style={{
        position: "relative", fontSize: 44, fontWeight: 600, textAlign: "center", margin: "8px 0 10px",
        fontVariantNumeric: "tabular-nums", color: C, textShadow: `0 0 14px ${C}aa`,
      }}>{v("balance")}<span style={{ fontSize: 24, marginLeft: 6 }}>Ð</span></div>

      <div style={{ position: "relative", height: 1, background: `${C}33`, marginBottom: 10 }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
        <Stat v={v("earned")} k="EARNED" color={C} />
        <Stat v={v("locked")} k="🔒 VAULT" color={BLUE} />
        <Stat v={v("streak")} k="STREAK" color={AMBER} />
        <Stat v={v("spent")} k="SPENT" color={RED} />
      </div>

      {typing ? (
        <div style={{ position: "relative", marginTop: 8, display: "flex", alignItems: "center", gap: 6, height: 20, padding: "0 6px",
          border: `1px solid ${flashing && flash.err ? RED : C}55`, background: W_INSET() }}>
          <span style={{ color: C, fontSize: 10, flexShrink: 0 }}>›</span>
          <input className="wl-in" type="text" maxLength={100} placeholder="+50 GYM · -20 · LOCK 100 · UNDO"
            onKeyDown={submit} ref={(el) => el && document.activeElement !== el && el.focus()}
            spellCheck={false} autoComplete="off"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", color: T.text, caretColor: C,
              fontFamily: "inherit", fontSize: 9, letterSpacing: 0.5, padding: 0 }} />
        </div>
      ) : (
        <div className="wl-foot" onClick={() => dispatch({ type: "TYPE", on: true })} style={{
          position: "relative", fontSize: 8.5, letterSpacing: 1.5, marginTop: 11, textAlign: "center", cursor: "pointer", userSelect: "none",
          color: flashing ? (flash.err ? RED : C) : DIM }}>
          {flashing ? flash.text : ok ? `± TAP TO LOG · ${w.updated}` : "BACKEND OFFLINE — RUN install.command"}
        </div>
      )}
    </div>
  );
};
