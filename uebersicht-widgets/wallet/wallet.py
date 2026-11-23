#!/usr/bin/env python3
"""WALLET//Ð — standalone backend for wallet.jsx (doubloons.jsx). No Obsidian, no vault.

    python3 wallet.py state                 # balance + totals as JSON (what the widget reads)
    python3 wallet.py add <b64 line>        # one line typed into the widget, base64 UTF-8:
                                            #   "+50 gym"  earn 50   ·  "-120 new game"  spend 120
                                            #   "lock 100" move 100 into the vault  ·  "unlock 40" take 40 back out
                                            #   "undo"     remove the last entry
    python3 wallet.py earn <points> <b64 note>   # used by other widgets (STUDY//TERM pays study time in here)

A personal points system: earn points for things you want to do more of, spend them on rewards.
The VAULT is a locked savings pot: locked points are not spendable until you unlock them.

Rules:
  · spendable balance = earned − spent − locked (you cannot spend or lock more than you have)
  · STREAK = days in a row with at least one earning, counting back from today (or yesterday,
    so the streak survives until you earn something today)
  · a "day" rolls over at 04:00 local time, so a late-night session still counts for the day it belongs to

Data: ~/Library/Application Support/STUDYTERM/standalone/data/wallet.json  (override: WALLET_DATA)
Stdlib only, Python 3.8+.
"""
import base64, datetime as dt, fcntl, json, os, re, sys, time

SA = os.environ.get("WIDGETS_HOME") or os.path.expanduser("~/Library/Application Support/STUDYTERM/standalone")
DATA = os.environ.get("WALLET_DATA") or os.path.join(SA, "data", "wallet.json")
ROLL_H = 4
MAX_NOTE = 80


def now():
    return float(os.environ.get("WALLET_NOW") or time.time())


def day_of(ts):
    return (dt.datetime.fromtimestamp(ts) - dt.timedelta(hours=ROLL_H)).date()


def load():
    try:
        with open(DATA, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict) and isinstance(d.get("entries"), list):
            return d
    except (OSError, ValueError):
        pass
    return {"entries": []}


def save(d):
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    tmp = DATA + ".%d.tmp" % os.getpid()
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.flush(); os.fsync(f.fileno())
    os.replace(tmp, DATA)


def totals(d):
    earned = sum(e["n"] for e in d["entries"] if e["kind"] == "earn")
    spent = sum(e["n"] for e in d["entries"] if e["kind"] == "spend")
    locked = sum(e["n"] for e in d["entries"] if e["kind"] == "lock") - sum(e["n"] for e in d["entries"] if e["kind"] == "unlock")
    days = {day_of(e["t"]) for e in d["entries"] if e["kind"] == "earn"}
    today = day_of(now())
    k = today if today in days else today - dt.timedelta(1)
    streak = 0
    while k in days:
        streak += 1
        k -= dt.timedelta(1)
    last = d["entries"][-1]["t"] if d["entries"] else None
    return dict(balance=earned - spent - locked, locked=locked, earned=earned, spent=spent, streak=streak,
                updated=dt.datetime.fromtimestamp(last).strftime("%d %b %H:%M").upper() if last else "NEVER",
                count=len(d["entries"]))


def note_of(s):
    return " ".join((s or "").split())[:MAX_NOTE]


def record(d, kind, n, note=""):
    t = totals(d)
    if n <= 0:
        raise ValueError("AMOUNT MUST BE ABOVE 0")
    if kind in ("spend", "lock") and n > t["balance"]:
        raise ValueError(f"ONLY {t['balance']} Ð SPENDABLE")
    if kind == "unlock" and n > t["locked"]:
        raise ValueError(f"ONLY {t['locked']} Ð IN THE VAULT")
    d["entries"].append({"t": now(), "kind": kind, "n": n, "note": note_of(note)})


SIGN = {"earn": "+", "spend": "−", "lock": "🔒 ", "unlock": "🔓 "}


def parse(line):
    """'+50 gym' / '-20 snack' / 'lock 100' / 'unlock 40' / 'undo' → (kind, n, note)."""
    s = " ".join(line.replace("−", "-").split())
    if s.lower() == "undo":
        return "undo", 0, ""
    m = re.match(r"(?i)^(lock|unlock)\s+(\d+)\s*(.*)$", s)
    if m:
        return m.group(1).lower(), int(m.group(2)), m.group(3)
    m = re.match(r"^([+-])\s*(\d+)\s*(.*)$", s)
    if m:
        return ("earn" if m.group(1) == "+" else "spend"), int(m.group(2)), m.group(3)
    raise ValueError("TYPE +50 NOTE · -20 NOTE · LOCK 100 · UNDO")


def main():
    cmd = (sys.argv[1:] or ["state"])[0]
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    with open(DATA + ".lock", "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        d = load()
        out = {}
        try:
            if cmd == "add":
                raw = (sys.argv[2:] or [""])[0]
                line = base64.b64decode(raw.encode("ascii")).decode("utf-8") if raw else ""
                kind, n, note = parse(line)
                if kind == "undo":
                    if not d["entries"]:
                        raise ValueError("NOTHING TO UNDO")
                    e = d["entries"].pop()
                    out["msg"] = f"UNDONE {SIGN[e['kind']]}{e['n']} Ð"
                else:
                    record(d, kind, n, note)
                    out["msg"] = f"{SIGN[kind]}{n} Ð" + (f" · {note_of(note).upper()}" if note_of(note) else "")
                save(d)
            elif cmd == "earn":
                n = int((sys.argv[2:] or ["0"])[0])
                raw = (sys.argv[3:] or [""])[0]
                note = base64.b64decode(raw.encode("ascii")).decode("utf-8") if raw else ""
                record(d, "earn", n, note)
                save(d)
                out["msg"] = f"+{n} Ð"
            elif cmd != "state":
                sys.exit(f"unknown command {cmd}")
        except ValueError as e:
            out["error"] = str(e)
        out.update(totals(d))
        print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
