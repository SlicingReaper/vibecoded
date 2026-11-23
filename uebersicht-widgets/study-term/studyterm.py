#!/usr/bin/env python3
"""STUDY//TERM — standalone backend for studyterm.jsx. No Obsidian, no vault.

    python3 studyterm.py state             # timer state + today's minutes as JSON (what the widget reads)
    python3 studyterm.py toggle            # start / pause / resume
    python3 studyterm.py submit <b64 note> # log the session with a one-line note (required), reset
    python3 studyterm.py discard           # throw the running timer away
    python3 studyterm.py cycle             # next subject
    python3 studyterm.py stats             # write the stats page and open it in the browser

The timer is timestamps, not a counter (start + accumulated seconds), so it survives sleep,
reboot and quitting Übersicht. Finished sessions are appended to sessions.csv.

Points: every full 25-minute block of a day's running total pays 15 Ð into WALLET//Ð
(wallet.py, installed next to this file). Leftover minutes are banked toward the next block.
Set "points_per_block": 0 in the config to switch that off.

Config (created on first run, edit freely):
  ~/Library/Application Support/STUDYTERM/standalone/data/studyterm-config.json
    subjects          list of subject names the subject line cycles through
    block_min         minutes per paid block (default 25)
    points_per_block  Ð per block (default 15, 0 = no wallet payments)
    weekly_target_h   weekly goal shown on the stats page (default 10, 0 = none)
Data:
  …/standalone/data/sessions.csv        date,subject,minutes,points,note  (one row per logged session)
  …/standalone/studyterm/state.json     the running timer
A study day rolls over at 04:00, and a session belongs to the day it STARTED in.
Stdlib only, Python 3.8+.
"""
import base64, csv, datetime as dt, fcntl, html, io, json, os, subprocess, sys, time, uuid

SA = os.environ.get("WIDGETS_HOME") or os.path.expanduser("~/Library/Application Support/STUDYTERM/standalone")
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(SA, "data")
HOME = os.path.join(SA, "studyterm")
STATE = os.path.join(HOME, "state.json")
JOURNAL = os.path.join(HOME, "submitted.log")
STATS = os.path.join(HOME, "stats.html")
SESSIONS = os.path.join(DATA, "sessions.csv")
CONFIG = os.path.join(DATA, "studyterm-config.json")
WALLET = os.path.join(HERE, "wallet.py")
FIELDS = ["date", "subject", "minutes", "points", "note"]
DEFAULTS = {"subjects": ["STUDY", "CODING", "READING", "PROJECT"], "block_min": 25, "points_per_block": 15, "weekly_target_h": 10}
ROLL_H = 4
WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def now(): return float(os.environ.get("STUDYTERM_NOW") or time.time())
def local(ts): return dt.datetime.fromtimestamp(ts)
def study_day(ts): return (local(ts) - dt.timedelta(hours=ROLL_H)).date()


def atomic_write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = os.path.join(os.path.dirname(path), f".{os.path.basename(path)}.{os.getpid()}.tmp")
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write(text); f.flush(); os.fsync(f.fileno())
    os.replace(tmp, path)


def config():
    try:
        c = json.load(open(CONFIG, encoding="utf-8"))
    except (OSError, ValueError):
        c = {}
        atomic_write(CONFIG, json.dumps(DEFAULTS, indent=1))
    out = dict(DEFAULTS); out.update({k: v for k, v in c.items() if k in DEFAULTS})
    if not out["subjects"]: out["subjects"] = DEFAULTS["subjects"]
    return out


CFG = None


def subjects(): return [str(x).upper()[:14] for x in CFG["subjects"]]


# ───────────── state ─────────────
def blank(subject=0):
    return dict(id=None, first=None, start=None, acc=0.0, running=False, subject=subject,
                label=subjects()[subject % len(subjects())], msg="", msg_t=0, error="")


def load():
    try:
        s = json.load(open(STATE, encoding="utf-8"))
        b = blank(s.get("subject", 0) % len(subjects())); b.update(s)
        b["subject"] %= len(subjects()); return b
    except (OSError, ValueError):
        return blank()


def save(s):
    s["label"] = subjects()[s["subject"]]
    atomic_write(STATE, json.dumps(s, ensure_ascii=False))


def elapsed(s, t): return s["acc"] + ((t - s["start"]) if s["running"] and s["start"] else 0)
def say(s, msg, err=""): s["msg"], s["msg_t"], s["error"] = msg, now(), err


def dur(mins):
    if mins < 60: return f"{mins} min"
    return f"{mins // 60} h {mins % 60} min" if mins % 60 else f"{mins // 60} h"


# ───────────── sessions ─────────────
def rows():
    try:
        return list(csv.DictReader(open(SESSIONS, encoding="utf-8")))
    except OSError:
        return []


def day_minutes(day):
    return sum(int(r["minutes"] or 0) for r in rows() if r["date"] == day.isoformat())


def append_session(row):
    new = not os.path.exists(SESSIONS)
    buf = io.StringIO(); w = csv.writer(buf, lineterminator="\n")
    if new: w.writerow(FIELDS)
    w.writerow(row)
    with open(SESSIONS, "a", encoding="utf-8", newline="") as f:
        f.write(buf.getvalue()); f.flush(); os.fsync(f.fileno())


def pay_wallet(points, note):
    if points <= 0 or not os.path.exists(WALLET): return ""
    try:
        b = base64.b64encode(note.encode("utf-8")).decode("ascii")
        r = subprocess.run([sys.executable, WALLET, "earn", str(points), b], capture_output=True, text=True, timeout=20)
        return "" if r.returncode == 0 else "WALLET DIDN'T TAKE IT"
    except Exception as e:
        return f"WALLET: {e}"[:60]


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
    s["subject"] = (s["subject"] + 1) % len(subjects()); say(s, subjects()[s["subject"]])


def cmd_submit(s, note=""):
    if not s["id"]: return
    note = " ".join((note or "").split())[:200]
    if not note:
        say(s, "", "WRITE WHAT YOU DID — NOT LOGGED"); return
    t = now(); mins = round(elapsed(s, t) / 60)
    done = set(open(JOURNAL).read().split()) if os.path.exists(JOURNAL) else set()
    if s["id"] in done:
        s.update(blank(s["subject"])); say(s, "ALREADY LOGGED"); return
    if mins < 1:
        s.update(blank(s["subject"])); say(s, "UNDER 1 MIN — NOT LOGGED"); return
    day = study_day(s["first"])
    before = day_minutes(day); after = before + mins
    blk = max(1, int(CFG["block_min"]))
    pts = (after // blk - before // blk) * int(CFG["points_per_block"])
    subj = subjects()[s["subject"]]
    append_session([day.isoformat(), subj, str(mins), str(pts), note])
    with open(JOURNAL, "a") as f: f.write(s["id"] + "\n"); f.flush(); os.fsync(f.fileno())
    werr = pay_wallet(pts, f"study · {subj.lower()} · {dur(mins)}")
    s.update(blank(s["subject"]))
    say(s, f"LOGGED {dur(mins)}" + (f" · +{pts} Ð" if pts else ""), werr)


def cmd_stats(s):
    try:
        write_stats(s)
        if sys.platform == "darwin" and not os.environ.get("STUDYTERM_NO_OPEN"):
            subprocess.run(["open", STATS])
    except Exception as e:
        say(s, "", f"STATS FAILED: {e}"[:100])


# ───────────── stats page ─────────────
def write_stats(s):
    t = now(); today = study_day(t)
    mins = {}
    for r in rows():
        try: d = dt.date.fromisoformat(r["date"])
        except ValueError: continue
        mins[d] = mins.get(d, 0) + int(r["minutes"] or 0)
    M = lambda d: mins.get(d, 0)
    D = lambda i: today - dt.timedelta(i)
    hm = lambda x: dur(int(x)) if x else "0 min"
    mon = today - dt.timedelta(today.weekday())
    wk = sum(M(mon + dt.timedelta(i)) for i in range((today - mon).days + 1))
    mo = sum(v for d, v in mins.items() if d.year == today.year and d.month == today.month and d <= today)
    last30 = [M(D(i)) for i in range(29, -1, -1)]; last7 = last30[-7:]
    full_weeks = [sum(M(mon - dt.timedelta(7 * k) + dt.timedelta(i)) for i in range(7)) for k in range(1, 5)]
    st = 0; d = today if M(today) else today - dt.timedelta(1)
    while M(d) > 0: st += 1; d -= dt.timedelta(1)
    wk_t = float(CFG["weekly_target_h"] or 0)
    day_t = round(wk_t * 60 / 7) if wk_t else 0
    live = elapsed(s, t) / 60 if s.get("id") else 0
    recent = rows()[-14:][::-1]
    total_h = sum(mins.values()) / 60

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
            out.append(f'<line x1="0" x2="{w}" y1="{y:.1f}" y2="{y:.1f}" class="tgt"/><text x="{w - 4}" y="{y - 4:.1f}" class="lbl r">daily share {hm(target)}</text>')
        return "".join(out) + "</svg>"

    E = html.escape
    wdm = lambda iso: (lambda x: f"{WD[x.weekday()]} {x.day} {MON[x.month - 1]}")(dt.date.fromisoformat(iso))
    lab7 = [WD[D(i).weekday()].upper() for i in range(6, -1, -1)]
    lab30 = [f"{D(i).day}" for i in range(29, -1, -1)]
    pct_w = round(100 * wk / 60 / wk_t) if wk_t else None
    trs = "".join(f'<tr><td>{wdm(r["date"])}</td><td>{E(r["subject"])}</td><td>{E(r["note"])}</td><td class="n">{hm(int(r["minutes"] or 0))}</td><td class="n">{"+" + r["points"] + " Ð" if r.get("points") not in ("", "0", None) else ""}</td></tr>' for r in recent)
    tile = lambda k, v, sub="": f'<div class="tile"><div class="k">{k}</div><div class="v">{v}</div><div class="s">{sub}</div></div>'
    meter = f'<div class="meter"><div style="width:{min(100, pct_w)}%"></div></div>' if wk_t else ""
    page = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STUDY//TERM</title><style>
:root{{--bg:#040914;--panel:rgba(10,24,48,.55);--c:#3ef0ff;--c2:#1f8fff;--dim:#5d7a99;--txt:#cfefff;--amber:#ffb84d}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--txt);font:13px/1.45 "SF Mono",Menlo,ui-monospace,monospace;
background-image:linear-gradient(rgba(62,240,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(62,240,255,.035) 1px,transparent 1px);background-size:24px 24px;min-height:100vh}}
.wrap{{max-width:980px;margin:0 auto;padding:28px 16px 48px}}
h1{{font-size:15px;letter-spacing:6px;color:var(--c);text-shadow:0 0 8px rgba(62,240,255,.7);margin:0}}
.sub{{color:var(--dim);font-size:11px;letter-spacing:2px;margin:4px 0 22px}}
.panel{{position:relative;background:var(--panel);border:1px solid rgba(62,240,255,.28);padding:16px 18px;margin-bottom:16px}}
.h{{font-size:10px;letter-spacing:3px;color:var(--c);margin-bottom:12px}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}}
.tile .k{{font-size:9px;letter-spacing:2px;color:var(--dim)}}.tile .v{{font-size:24px;color:#fff;text-shadow:0 0 10px rgba(62,240,255,.45);margin-top:2px}}.tile .s{{font-size:10px;color:var(--dim)}}
.meter{{height:6px;background:rgba(62,240,255,.1);margin-top:10px;border:1px solid rgba(62,240,255,.25)}}.meter div{{height:100%;background:var(--c)}}
.chart{{width:100%;height:auto;display:block}}.grid{{stroke:rgba(62,240,255,.08)}}.bar{{fill:var(--c2);opacity:.85}}.bar.hit{{fill:var(--c)}}.bar.zero{{fill:rgba(62,240,255,.15)}}
.tgt{{stroke:var(--amber);stroke-dasharray:4 4}}.lbl{{fill:var(--dim);font-size:9px;text-anchor:middle;font-family:inherit}}.lbl.r{{text-anchor:end;fill:var(--amber)}}
.two{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}@media(max-width:720px){{.two{{grid-template-columns:1fr}}}}
table{{width:100%;border-collapse:collapse;font-size:12px}}td{{padding:6px 4px;border-bottom:1px solid rgba(62,240,255,.08);vertical-align:top}}td.n{{text-align:right;color:#fff;white-space:nowrap}}td:first-child{{color:var(--dim);white-space:nowrap}}
.live{{color:var(--amber)}}
</style></head><body><div class="wrap">
<h1>STUDY//TERM</h1><div class="sub">STUDY DAY {wdm(today.isoformat()).upper()} · GENERATED {local(t):%H:%M} · SOURCE sessions.csv{' · <span class="live">TIMER OPEN ' + hm(round(live)) + ' (NOT LOGGED)</span>' if live >= 1 else ''}</div>
<div class="panel"><div class="h">TOTALS</div><div class="tiles">
{tile("TODAY", hm(M(today)))}
{tile("THIS WEEK", f"{wk / 60:.2f} h", f"of {wk_t:g} h · {pct_w}%" if wk_t else "no weekly target")}
{tile("THIS MONTH", f"{mo / 60:.1f} h", MON[today.month - 1].upper())}
{tile("STREAK", f"{st} d", "days in a row with study")}
</div>{meter}</div>
<div class="panel"><div class="h">AVERAGES</div><div class="tiles">
{tile("DAILY AVG", hm(round(sum(last30) / 30)), "last 30 days, zeros included")}
{tile("WEEKLY AVG", f"{sum(full_weeks) / 4 / 60:.2f} h", "last 4 full weeks")}
{tile("ALL TIME", f"{total_h:.1f} h", f"{len(rows())} sessions")}
</div></div>
<div class="two"><div class="panel"><div class="h">LAST 7 DAYS</div>{bars(last7, lab7, day_t)}</div>
<div class="panel"><div class="h">LAST 30 DAYS</div>{bars(last30, lab30, day_t)}</div></div>
<div class="panel"><div class="h">RECENT SESSIONS</div><table>{trs or '<tr><td>No sessions yet — start the timer, then LOG.</td></tr>'}</table></div>
</div></body></html>"""
    atomic_write(STATS, page)


# ───────────── main ─────────────
def main():
    global CFG
    cmd = (sys.argv[1:] or ["state"])[0]
    os.makedirs(HOME, exist_ok=True); os.makedirs(DATA, exist_ok=True)
    CFG = config()
    with open(os.path.join(HOME, ".lock"), "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        s = load()
        if cmd == "state":
            if not os.path.exists(STATE): save(s)
            print(json.dumps(dict(s, today=day_minutes(study_day(now()))), ensure_ascii=False)); return
        if cmd not in ("toggle", "submit", "discard", "cycle", "stats"): sys.exit(f"unknown command {cmd}")
        if cmd != "stats": s["error"] = ""
        if cmd == "submit":
            raw = (sys.argv[2:] or [""])[0]
            try: note = base64.b64decode(raw.encode("ascii")).decode("utf-8") if raw else ""
            except Exception: note = ""
            cmd_submit(s, note)
        else:
            globals()["cmd_" + cmd](s)
        save(s)
        print(s["error"] or s["msg"])


if __name__ == "__main__":
    main()
