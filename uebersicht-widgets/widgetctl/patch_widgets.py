#!/usr/bin/env python3
"""Adds the WIDGET//CTL theme + layout block to the five Übersicht widgets.
Usage: patch_widgets.py <src_dir> <out_dir> <block.js>   (idempotent: skips files that already have the block)"""
import re, sys, os

SRC, OUT, BLOCK_F = sys.argv[1], sys.argv[2], sys.argv[3]
BLOCK = open(BLOCK_F, encoding="utf-8").read()
FILES = {"doubloons.jsx": "doubloons", "75hard.jsx": "hard75", "studyterm.jsx": "studyterm",
         "notepad.jsx": "notepad", "quote.jsx": "quote"}

def one(s, old, new, label):
    n = s.count(old)
    assert n == 1, f"{label}: expected 1 match, got {n}"
    return s.replace(old, new)

def one_re(s, pat, rep, label, flags=0):
    s2, n = re.subn(pat, rep, s, flags=flags)
    assert n == 1, f"{label}: expected 1 regex match, got {n}"
    return s2

os.makedirs(OUT, exist_ok=True)
for fn, wid in FILES.items():
    s = open(os.path.join(SRC, fn), encoding="utf-8").read()
    if "WIDGET//CTL block" in s:
        print("skip (already patched):", fn); open(os.path.join(OUT, fn), "w", encoding="utf-8").write(s); continue
    L = fn

    # 1. palette constants now come from the block (let, re-set every render)
    s = one(s, 'const C = "#3ef0ff", BLUE = "#1f8fff", AMBER = "#ffb84d", RED = "#ff5f6d", DIM = "#5d7a99";\n', "", L + " palette")
    # 3. command also prints the config line
    h = '[ -f "$H" ] && { echo HIDDEN; exit 0; }; '
    s = one(s, h, h + 'echo "CFG:$(${W_CFG})"; ', L + " command")
    # 4. render: load config, stored widgets render nothing
    hk = 'if (/^HIDDEN/.test(output || "")) return <div />;'
    s = one(s, hk, hk + "\n  const W_L = W_LOAD(output);\n  if (W_L.unplaced) return <div />;", L + " render hook")
    # 5. root panel: class for the style, position comes from W_PANEL
    s = one_re(s, r'<div style=\{\{\n(\s*)position: "relative", width: 230,', r'<div className={"wctl-" + T.name + (T.glow ? "" : " wctl-noglow")} style={{\n\1width: 230,', L + " root")
    # 6. panel look → W_PANEL(<border colour>)
    s = one_re(s, r'background: "rgba\(4,9,20,0\.88\)",.*?border: `1px solid \$\{(\w+)\}55`.*?backgroundSize: "12px 12px",',
               r'...W_PANEL(\1),', L + " panel", flags=re.S)
    # 7. binary text + brackets follow the style
    s = one_re(s, r'\n(\s*)(<div style=\{\{ position: "absolute", inset: 0, [^\n]*\{BIN\}\{BIN\}</div>)',
               r'\n\1<style>{W_CSS}</style>\n\1{T.bin && \2}', L + " bin")
    s = one(s, '{["tl", "tr", "bl", "br"].map(', '{T.brackets && ["tl", "tr", "bl", "br"].map(', L + " brackets")
    # 8. hard-coded colour literals → theme
    s = re.sub(r'"rgba\(62,240,255,([0-9.]+)\)"', r'W_RGBA(C, \1)', s)
    s = re.sub(r'"rgba\(93,122,153,([0-9.]+)\)"', r'W_RGBA(DIM, \1)', s)
    s = s.replace('"rgba(10,24,48,0.55)"', "W_INSET()")
    s = s.replace('"#cfefff"', "T.text").replace('"#e6f8ff"', "T.text").replace('"#ffffff"', "T.text")
    s = s.replace("color: #ffffff }", "color: ${T.text} }")
    # 9. module-level CSS / field objects become functions so they follow the theme
    if "const CSS = `" in s:
        s = one(s, "const CSS = `", "const CSS = () => `", L + " css")
        s = one(s, "<style>{CSS}</style>", "<style>{CSS()}</style>", L + " css use")
    if "const field = {" in s:
        s = one(s, "const field = {", "const field = () => ({", L + " field")
        s = one(s, 'padding: "5px 7px",\n};', 'padding: "5px 7px",\n});', L + " field end")
        s = s.replace("...field,", "...field(),")
    # remaining unquoted literals live inside template strings (CSS) → interpolate
    s = re.sub(r'rgba\(62,240,255,([0-9.]+)\)', r'${W_RGBA(C, \1)}', s)
    s = re.sub(r'rgba\(93,122,153,([0-9.]+)\)', r'${W_RGBA(DIM, \1)}', s)
    # 2. block goes right before the command (last, so the colour passes above never touch it)
    i = s.index("export const command")
    s = s[:i] + BLOCK.replace("__WID__", wid) + "\n" + s[i:]

    open(os.path.join(OUT, fn), "w", encoding="utf-8").write(s)
    print("patched:", fn)
