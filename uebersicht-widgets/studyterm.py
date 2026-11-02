#!/usr/bin/env python3
"""STUDY//TERM — backend for the studyterm.jsx Übersicht widget.

    python3 "00 — Meta/studyterm.py" toggle    # start / pause / resume
    python3 "00 — Meta/studyterm.py" submit    # log the session to ledger.csv, reset, run build.py
    python3 "00 — Meta/studyterm.py" discard   # throw the running timer away
    python3 "00 — Meta/studyterm.py" cycle     # next subject (🎓 Course 1 → Course 2 → Course 3 → 💻 coding)
    python3 "00 — Meta/studyterm.py" stats     # write the stats page and open it
    python3 "00 — Meta/studyterm.py" state     # print the timer state (what the widget reads)
    python3 "00 — Meta/studyterm.py" tick read # 75 Hard: toggle today's box (w1 w2 water read photo meal1 meal2)

The timer is timestamps, not a counter (start + accumulated seconds), kept in
~/Library/Application Support/STUDYTERM/state.json — outside iCloud, survives
sleep, reboot and quitting Übersicht. The vault only ever sees finished sessions:
one row appended to 00 — Meta/data/ledger.csv in the Doubloon Tracker format,
then build.py regenerates every linked page. Stdlib only.

Rules it follows (Doubloon Tracker Prompt):
  · 15 Ð per full 25-min block of the day's running total; leftovers are banked
  · the study day rolls at 04:00 local time — a session belongs to the study day it STARTED in,
    and gets "past midnight" in its text if it ended after 00:00
  · amounts with a true minus sign, minutes column = minutes actually studied
"""
import csv, fcntl, io, json, os, re, subprocess, sys, time, uuid, datetime as dt, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LEDGER = os.path.join(HERE, "data", "ledger.csv")
BUILD = os.path.join(HERE, "build.py")
REWARDS = os.path.join(ROOT, "08 — Progress", "Rewards System.md")
TWY = os.path.join(HERE, "data", "twelvewy.json")
HOME = os.environ.get("STUDYTERM_HOME") or os.path.expanduser("~/Library/Application Support/STUDYTERM")
STATE = os.path.join(HOME, "state.json")
JOURNAL = os.path.join(HOME, "submitted.log")
STATS = os.path.join(HOME, "stats.html")

# (ledger activity prefix, short widget label)
SUBJECTS = [("🎓 Study — Course 1", "COURSE 1"), ("🎓 Study — Course 2", "COURSE 2"),
            ("🎓 Study — Course 3", "COURSE 3"), ("💻 Real coding", "CODING")]
BLOCK, PER_BLOCK, ROLL_H = 25, 15, 4

def now(): return float(os.environ.get("STUDYTERM_NOW") or time.time())
def local(ts): return dt.datetime.fromtimestamp(ts)
def study_day(ts): return (local(ts) - dt.timedelta(hours=ROLL_H)).date()

# ───────────── state ─────────────
def blank(subject=0):
    return dict(id=None, first=None, start=None, acc=0.0, running=False, subject=subject,
                label=SUBJECTS[subject][1], msg="", msg_t=0, error="")

def load():
    try:
        s = json.load(open(STATE, encoding="utf-8"))
        b = blank(s.get("subject", 0) % len(SUBJECTS)); b.update(s); return b
    except (OSError, ValueError):
        return blank()

def atomic_write(path, text):
    tmp = os.path.join(os.path.dirname(path), f".{os.path.basename(path)}.{os.getpid()}.tmp")
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write(text); f.flush(); os.fsync(f.fileno())
    os.replace(tmp, path)

def save(s):
    s["label"] = SUBJECTS[s["subject"]][1]
    atomic_write(STATE, json.dumps(s, ensure_ascii=False))

def elapsed(s, t):
    return s["acc"] + ((t - s["start"]) if s["running"] and s["start"] else 0)

def say(s, msg, err=""):
    s["msg"], s["msg_t"], s["error"] = msg, now(), err

# ───────────── ledger row ─────────────
def dur(mins):
    if mins < 60: return f"{mins} min"
    return f"{mins // 60} h {mins % 60} min" if mins % 60 else f"{mins // 60} h"

def day_minutes(day):
    tot = 0
    for r in csv.DictReader(open(LEDGER, encoding="utf-8")):
        if r["date"] == day.isoformat() and (r.get("minutes") or "").strip():
            tot += int(r["minutes"])
    return tot

def make_row(subject, day, mins, before, past_midnight):
    after = before + mins
    b0, b1 = before // BLOCK, after // BLOCK
    n, bank0, bank1 = b1 - b0, before % BLOCK, after % BLOCK
    if n == 0: blocks = "0 blocks"
    else:
        blocks = f"block {b1}" if n == 1 else f"blocks {b0 + 1}–{b1}"
        if bank0: blocks = f"+{bank0} banked = {blocks}"
    tail = f"day now {after} min, {f'{bank1} min banked' if bank1 else '0 banked'}"
    act = f"{SUBJECTS[subject][0]}, {dur(mins)}{' past midnight' if past_midnight else ''} ({blocks}; {tail})"
    return [day.isoformat(), act, f"+{n * PER_BLOCK} Ð", str(mins)], n * PER_BLOCK, after

def autosplit_on():
    try:
        m = re.search(r"VAULT-DATA[^>]*autosplit=(\S+)", open(REWARDS, encoding="utf-8").read())
        return bool(m) and m.group(1) not in ("0", "off", "no")
    except OSError:
        return False

def append_ledger(row):
    buf = io.StringIO(); csv.writer(buf, lineterminator="\n").writerow(row); line = buf.getvalue()
    text = open(LEDGER, encoding="utf-8", newline="").read()
    if line in text: return False                       # identical row already there — never twice
    if text and not text.endswith("\n"): text += "\n"
    atomic_write(LEDGER, text + line)
    return True

# ───────────── commands ─────────────
def cmd_toggle(s):
    t = now()
    if s["running"]:
        s["acc"] = elapsed(s, t); s["start"] = None; s["running"] = False; say(s, "PAUSED")
    else:
        if not s["id"]: s["id"], s["first"], s["acc"] = uuid.uuid4().hex, t, 0.0
        s["start"] = t; s["running"] = True; say(s, "RUNNING")

def cmd_discard(s):
    if not s["id"]: return
    m = round(elapsed(s, now()) / 60)
    s.update(blank(s["subject"])); say(s, f"DISCARDED {dur(m)}")

def cmd_cycle(s):
    s["subject"] = (s["subject"] + 1) % len(SUBJECTS); say(s, SUBJECTS[s["subject"]][1])

def cmd_submit(s):
    if not s["id"]: return
    t = now(); secs = elapsed(s, t); mins = round(secs / 60)
    done = set(open(JOURNAL).read().split()) if os.path.exists(JOURNAL) else set()
    if s["id"] in done:
        s.update(blank(s["subject"])); say(s, "ALREADY LOGGED"); return
    if mins < 1:
        s.update(blank(s["subject"])); say(s, "UNDER 1 MIN — NOT LOGGED"); return
    if autosplit_on():
        say(s, "", "VAULT SPLIT IS ON — LOG THIS ONE IN CHAT"); return
    day = study_day(s["first"])
    past = local(t).date() > day
    before = day_minutes(day)
    row, d, after = make_row(s["subject"], day, mins, before, past)
    append_ledger(row)
    with open(JOURNAL, "a") as f: f.write(s["id"] + "\n"); f.flush(); os.fsync(f.fileno())
    s.update(blank(s["subject"])); s["day"] = day.isoformat(); s["day_min"] = after
    say(s, f"LOGGED {dur(mins)} · +{d} Ð"); save(s)
    # rebuild every linked page; the row is already safe in the ledger if this fails
    try:
        r = subprocess.run([sys.executable, BUILD], cwd=ROOT, capture_output=True, text=True, timeout=180)
        if r.returncode != 0:
            lines = [l for l in (r.stdout + r.stderr).strip().splitlines() if l.strip()]
            why = (lines[1].strip() if r.returncode == 2 and len(lines) > 1 else lines[-1].strip()) if lines else f"exit {r.returncode}"
            say(s, f"LOGGED {dur(mins)} · +{d} Ð", "LOGGED, BUILD FAILED: " + why[:90])
    except Exception as e:
        say(s, f"LOGGED {dur(mins)} · +{d} Ð", f"BUILD DIDN'T RUN: {e}"[:100])

def cmd_stats(s):
    try:
        write_stats(s)
        if sys.platform == "darwin" and not os.environ.get("STUDYTERM_NO_OPEN"):
            subprocess.run(["open", STATS])
    except Exception as e:
        say(s, "", f"STATS FAILED: {e}"[:100])

# ───────────── 75 Hard ticks (75hard.jsx) ─────────────
# Same rules as the 75 Hard Tracker Prompt: ticks live only in hard75.csv; a ✅ workout pays a
# 🏋️ ledger row (+20 Ð), a ✅ read pays a 📖 row (+10 Ð, page derived at 10/night); then build.py.
# Tap toggles ✅ ↔ blank. A ❌ (a miss resets the streak) is never set or cleared from the widget.
H75 = os.path.join(HERE, "data", "hard75.csv")
BOOKS = os.path.join(HERE, "data", "books.csv")
H75_MSG = os.path.join(HOME, "hard75.json")
COLS = ["w1", "w2", "water", "read", "photo", "meal1", "meal2"]
LABEL = dict(w1="OUTDOOR 45", w2="INDOOR 45", water="3.8L WATER", read="10 PAGES", photo="PHOTO", meal1="MEAL 1", meal2="MEAL 2")

def csv_line(row):
    buf = io.StringIO(); csv.writer(buf, lineterminator="\n").writerow(row); return buf.getvalue()

def ledger_row_for(col, n, day):
    """(prefix that identifies the row, full row) for columns that pay Ð, else None."""
    if col in ("w1", "w2"):
        k = "1" if col == "w1" else "2"
        pre = f"🏋️ Gym session — workout {k} (75 Hard Day {n}"
        return pre, [day.isoformat(), pre + ")", "+20 Ð", ""]
    if col == "read":
        b = [r for r in csv.DictReader(open(BOOKS, encoding="utf-8")) if not r["end_day"]]
        if not b or not b[-1]["start_page"]: raise RuntimeError("NO OPEN BOOK — LOG IN CHAT")
        b = b[-1]; end = int(b["start_page"]) + 10 * (n - int(b["start_day"])); start = end - 10
        if b["total_pages"] and end > int(b["total_pages"]): raise RuntimeError("BOOK ENDS TODAY — LOG IN CHAT")
        pre = f"📖 Reading — {b['title']}, p.{start}–{end}"
        return pre, [day.isoformat(), pre + " (10 pages)", "+10 Ð", ""]
    return None

def cmd_tick(col):
    out = dict(msg="", error="", t=now())
    try:
        if col not in COLS: raise RuntimeError(f"unknown box {col}")
        day = study_day(now())
        lines = open(H75, encoding="utf-8", newline="").read().split("\n")
        hdr = next(csv.reader([lines[0]]))
        idx = next((i for i, l in enumerate(lines[1:], 1) if l and next(csv.reader([l]))[1] == day.isoformat()), None)
        if idx is None: raise RuntimeError("NO 75 HARD ROW FOR TODAY")
        row = next(csv.reader([lines[idx]])); n = int(row[0]); c = hdr.index(col)
        if row[c] == "❌": raise RuntimeError("MISS LOGGED — FIX IN CHAT")
        on = row[c] != "✅"
        pay = ledger_row_for(col, n, day)
        trust = []
        if not on:
            # removing a row looks like a hand edit to build.py's guard — so only do it on a clean vault
            chk = subprocess.run([sys.executable, BUILD, "--check"], cwd=ROOT, capture_output=True, text=True, timeout=180)
            if chk.returncode != 0: raise RuntimeError("VAULT NOT CLEAN — UNTICK IN CHAT")
            trust = ["--trust-data"]
        # ledger first (the Ð side), then the tick, then one build
        if pay:
            pre, new = pay
            text = open(LEDGER, encoding="utf-8", newline="").read()
            keep, found = [], False
            for l in text.split("\n"):
                f = next(csv.reader([l])) if l else []
                hit = len(f) >= 2 and f[0] == day.isoformat() and f[1].startswith(pre)
                found |= hit
                if not (hit and not on): keep.append(l)
            if on and not found:
                body = text if text.endswith("\n") else text + "\n"
                atomic_write(LEDGER, body + csv_line(new))
            elif not on and found:
                atomic_write(LEDGER, "\n".join(keep))
        row[c] = "✅" if on else ""
        lines[idx] = csv_line(row).rstrip("\n")
        atomic_write(H75, "\n".join(lines))
        out["msg"] = f"DAY {n} · {'■' if on else '□'} {LABEL[col]}" + (f" · {'+' if on else '−'}{pay[1][2][1:]}" if pay else "")
        r = subprocess.run([sys.executable, BUILD] + trust, cwd=ROOT, capture_output=True, text=True, timeout=180)
        if r.returncode != 0:
            ls =[l for l in (r.stdout + r.stderr).strip().splitlines() if l.strip()]
            out["error"] = "SAVED, BUILD FAILED: " + ((ls[1] if r.returncode == 2 and len(ls) > 1 else ls[-1]).strip()[:80] if ls else str(r.returncode))
    except Exception as e:
        out["error"] = str(e)[:100]
    atomic_write(H75_MSG, json.dumps(out, ensure_ascii=False))
    print(out["error"] or out["msg"])

# ───────────── stats page ─────────────
def write_stats(s):
    sys.path.insert(0, HERE)
    import build as B
    t = now(); today = study_day(t)
    m = B.model(today)
    mins = m.mins
    D = lambda i: today - dt.timedelta(i)
    hm = lambda x: dur(int(x)) if x else "0 min"
    mon = today - dt.timedelta(today.weekday())
    wk = sum(mins[mon + dt.timedelta(i)] for i in range((today - mon).days + 1))
    mo = sum(v for d, v in mins.items() if d.year == today.year and d.month == today.month and d <= today)
    last30 = [mins[D(i)] for i in range(29, -1, -1)]
    last7 = last30[-7:]
    full_weeks = [sum(mins[mon - dt.timedelta(7 * k) + dt.timedelta(i)] for i in range(7)) for k in range(1, 5)]
    st = 0; d = today if mins[today] else today - dt.timedelta(1)
    while mins[d] > 0: st += 1; d -= dt.timedelta(1)
    # weekly target: the running 12 Week Year week, else the study-plan week
    tw = json.load(open(TWY, encoding="utf-8")); i = (today - dt.date.fromisoformat(tw["start"])).days // 7
    if 0 <= i < len(tw["study_h"]): wk_t, wk_src = tw["study_h"][i], f"12WY week {i + 1}"
    elif m.week_now: wk_t, wk_src = m.week_now["sched"], m.week_now["name"]
    else: wk_t, wk_src = None, "no plan for this week"
    slot = m.slot(today)
    live = elapsed(s, t) / 60 if s.get("id") else 0
    sessions = [r for r in m.ledger if r["mins"]][-14:][::-1]

    def bars(vals, labels, target, w=560, hgt=150):
        top = max(max(vals), target or 0, 1) * 1.12; n = len(vals); bw = w / n
        out = [f'<svg viewBox="0 0 {w} {hgt + 18}" class="chart">']
        for k in range(5):
            y = hgt * k / 4; out.append(f'<line x1="0" x2="{w}" y1="{y:.1f}" y2="{y:.1f}" class="grid"/>')
        for k, v in enumerate(vals):
            bh = hgt * v / top; x = k * bw + bw * 0.18
            cls = "bar hit" if target and v >= target else ("bar" if v else "bar zero")
            out.append(f'<rect x="{x:.1f}" y="{hgt - bh:.1f}" width="{bw * 0.64:.1f}" height="{max(bh, 1):.1f}" class="{cls}"><title>{labels[k]} · {hm(v)}</title></rect>')
            if n <= 7 or k % 5 == 4 or k == n - 1:
                out.append(f'<text x="{x + bw * 0.32:.1f}" y="{hgt + 14}" class="lbl">{labels[k]}</text>')
        if target:
            y = hgt - hgt * target / top
            out.append(f'<line x1="0" x2="{w}" y1="{y:.1f}" y2="{y:.1f}" class="tgt"/><text x="{w - 4}" y="{y - 4:.1f}" class="lbl r">target {hm(target)}</text>')
        return "".join(out) + "</svg>"

    lab7 = [B.WD[D(i).weekday()].upper() for i in range(6, -1, -1)]
    lab30 = [f"{D(i).day}" for i in range(29, -1, -1)]
    pct_w = round(100 * wk / 60 / wk_t) if wk_t else None
    E = html.escape
    rows = "".join(
        f'<tr><td>{B.wdm(r["date"])}</td><td>{E(re.sub(r" [(].*", "", r["act"]))}</td><td class="n">{hm(r["mins"])}</td><td class="n">{E(r["amt"])}</td></tr>'
        for r in sessions)
    tile = lambda k, v, sub="": f'<div class="tile"><div class="k">{k}</div><div class="v">{v}</div><div class="s">{sub}</div></div>'
    meter = (f'<div class="meter"><div style="width:{min(100, pct_w)}%"></div></div>' if wk_t else "")
    page = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STUDY//TERM</title><style>
:root{{--bg:#040914;--panel:rgba(10,24,48,.55);--c:#3ef0ff;--c2:#1f8fff;--dim:#5d7a99;--txt:#cfefff;--amber:#ffb84d;--red:#ff5f6d}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--txt);font:13px/1.45 "SF Mono",Menlo,ui-monospace,monospace;
background-image:linear-gradient(rgba(62,240,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(62,240,255,.035) 1px,transparent 1px);background-size:24px 24px;min-height:100vh}}
body:after{{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px);animation:scan 9s linear infinite}}
@keyframes scan{{from{{background-position:0 0}}to{{background-position:0 300px}}}}
@keyframes flick{{0%{{opacity:0}}8%{{opacity:.7}}12%{{opacity:.2}}20%{{opacity:1}}100%{{opacity:1}}}}
@media (prefers-reduced-motion:reduce){{body:after,.wrap{{animation:none}}}}
.wrap{{max-width:980px;margin:0 auto;padding:28px 16px 48px;animation:flick .9s ease-out}}
h1{{font-size:15px;letter-spacing:6px;color:var(--c);text-shadow:0 0 8px rgba(62,240,255,.7);margin:0}}
.sub{{color:var(--dim);font-size:11px;letter-spacing:2px;margin:4px 0 22px}}
.panel{{position:relative;background:var(--panel);border:1px solid rgba(62,240,255,.28);padding:16px 18px;margin-bottom:16px;backdrop-filter:blur(6px)}}
.panel:before,.panel:after{{content:"";position:absolute;width:12px;height:12px;border:2px solid var(--c);filter:drop-shadow(0 0 3px var(--c))}}
.panel:before{{top:-2px;left:-2px;border-right:0;border-bottom:0}}.panel:after{{bottom:-2px;right:-2px;border-left:0;border-top:0}}
.h{{font-size:10px;letter-spacing:3px;color:var(--c);margin-bottom:12px}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}}
.tile .k{{font-size:9px;letter-spacing:2px;color:var(--dim)}}.tile .v{{font-size:24px;color:#fff;text-shadow:0 0 10px rgba(62,240,255,.45);margin-top:2px}}.tile .s{{font-size:10px;color:var(--dim)}}
.meter{{height:6px;background:rgba(62,240,255,.1);margin-top:10px;border:1px solid rgba(62,240,255,.25)}}.meter div{{height:100%;background:var(--c);box-shadow:0 0 10px var(--c)}}
.chart{{width:100%;height:auto;display:block}}.grid{{stroke:rgba(62,240,255,.08)}}.bar{{fill:var(--c2);opacity:.85}}.bar.hit{{fill:var(--c);filter:drop-shadow(0 0 4px var(--c))}}.bar.zero{{fill:rgba(62,240,255,.15)}}
.tgt{{stroke:var(--amber);stroke-dasharray:4 4}}.lbl{{fill:var(--dim);font-size:9px;text-anchor:middle;font-family:inherit}}.lbl.r{{text-anchor:end;fill:var(--amber)}}
.two{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}@media(max-width:720px){{.two{{grid-template-columns:1fr}}}}
table{{width:100%;border-collapse:collapse;font-size:12px}}td{{padding:6px 4px;border-bottom:1px solid rgba(62,240,255,.08)}}td.n{{text-align:right;color:#fff;white-space:nowrap}}td:first-child{{color:var(--dim);white-space:nowrap}}
.live{{color:var(--amber)}}
</style></head><body><div class="wrap">
<h1>STUDY//TERM</h1><div class="sub">STUDY DAY {B.wdm(today).upper()} · GENERATED {local(t):%H:%M} · SOURCE ledger.csv{' · <span class="live">TIMER OPEN ' + hm(round(live)) + ' (NOT LOGGED)</span>' if live >= 1 else ''}</div>
<div class="panel"><div class="h">TOTALS</div><div class="tiles">
{tile("TODAY", hm(mins[today]), f"{round(100 * mins[today] / slot)}% of the {hm(slot)} slot" if slot else "no slot today")}
{tile("THIS WEEK", f"{wk / 60:.2f} h", (f"of {wk_t} h · {pct_w}% · {wk_src}" if wk_t else wk_src))}
{tile("THIS MONTH", f"{mo / 60:.1f} h", B.MON[today.month - 1].upper())}
{tile("STREAK", f"{st} d", "days in a row with study")}
</div>{meter}</div>
<div class="panel"><div class="h">AVERAGES · PLAN</div><div class="tiles">
{tile("DAILY AVG", hm(round(sum(last30) / 30)), "last 30 days, zeros included")}
{tile("WEEKLY AVG", f"{sum(full_weeks) / 4 / 60:.2f} h", "last 4 full weeks")}
{tile("BANKED", f"{m.logged:.1f} h", f"of {m.due:.1f} h due · {m.pct}%")}
{tile("TARGET", f"{m.target} h", f"needs {m.rate:.1f} h/wk")}
</div></div>
<div class="two"><div class="panel"><div class="h">LAST 7 DAYS</div>{bars(last7, lab7, slot)}</div>
<div class="panel"><div class="h">LAST 30 DAYS</div>{bars(last30, lab30, slot)}</div></div>
<div class="panel"><div class="h">RECENT SESSIONS</div><table>{rows}</table></div>
</div></body></html>"""
    os.makedirs(HOME, exist_ok=True); atomic_write(STATS, page)

# ───────────── main ─────────────
def main():
    cmd = (sys.argv[1:] or ["state"])[0]
    os.makedirs(HOME, exist_ok=True)
    with open(os.path.join(HOME, ".lock"), "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        if cmd == "tick": cmd_tick((sys.argv[2:] or [""])[0]); return
        s = load()
        if cmd == "state": print(json.dumps(s, ensure_ascii=False)); return
        if cmd not in ("toggle", "submit", "discard", "cycle", "stats"): sys.exit(f"unknown command {cmd}")
        if cmd != "stats": s["error"] = ""
        globals()["cmd_" + cmd](s)
        save(s)
        print(s["error"] or s["msg"])

if __name__ == "__main__":
    main()
