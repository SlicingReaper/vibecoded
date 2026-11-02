#!/usr/bin/env python3
"""NOTE//PAD — backend for the notepad.jsx Übersicht widget.

    python3 "00 — Meta/notepad.py" state          # sweep + print board and bin as JSON (what the widget reads)
    python3 "00 — Meta/notepad.py" add <base64>   # new note (text is base64 UTF-8, so any character is safe)
    python3 "00 — Meta/notepad.py" tick <id>      # tick off → straight into the bin as "done"
    python3 "00 — Meta/notepad.py" untick <id>    # undo a tick (the widget offers this during the grace seconds)
    python3 "00 — Meta/notepad.py" restore <id>   # bin → board, with a fresh 3-day clock

Deadlines (one token anywhere in the note, removed from the text; digits only, no dots or spaces):
  t/DDHHMM        countdown from now        t/45 = 45 days · t/0012 = 12 h · t/000030 = 30 min · t/0206 = 2 days 6 h
  d/DDMMYY(HHMM)  date the countdown runs to d/05 = the next 5th · d/0511 = next 5 Nov · d/051126 = 5 Nov 2026
                                            d/0511261430 = 5 Nov 2026 14:30 · d/05112614 = 14:00
  Fewer digits = less specific. A date with no time means 23:59 that day. /t45 and /d0511 work too.
  A note with a deadline expires 3 days after the deadline instead of 3 days after it was written,
  so it shows LATE for those 3 days before it goes to the bin.

Lifecycle:
  board  → 3 days after it was written it EXPIRES and moves to the bin
  board  → ticked off: moves to the bin at once (the widget keeps it on screen a few seconds)
  bin    → 3 years after it entered the bin it is DELETED for good

Data: 00 — Meta/data/notepad.json (in the vault, so iCloud syncs it). Stdlib only, Python 3.8+.
"""
import base64, datetime as dt, fcntl, json, os, re, sys, time, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("NOTEPAD_DATA") or os.path.join(HERE, "data", "notepad.json")
LOCK = os.path.join(os.path.expanduser("~/Library/Application Support/STUDYTERM"), "notepad.lock")

EXPIRE = 3 * 24 * 3600            # board → bin
PURGE = 3 * 365 * 24 * 3600 + 86400  # bin → gone (3 years, leap day included)
GRACE = 5                         # seconds a ticked note still shows on the board
MAX_LEN = 280


def now():
    return float(os.environ.get("NOTEPAD_NOW") or time.time())


TOKEN = re.compile(r"(?i)(?:^|(?<=\s))(?:([td])/(\d+)|/([td])(\d+))(?=\s|$)")


class BadDeadline(ValueError):
    pass


def chunks(digits):
    return [int(digits[i:i + 2]) for i in range(0, len(digits), 2)]


def parse_deadline(kind, digits, t):
    """Turn t/… or d/… digits into an epoch timestamp (local time)."""
    c = chunks(digits)
    if kind == "t":
        if len(digits) > 6:
            raise BadDeadline("t/ TAKES MAX 6 DIGITS: DDHHMM")
        days, hours, mins = (c + [0, 0, 0])[:3]
        secs = days * 86400 + hours * 3600 + mins * 60
        if secs <= 0:
            raise BadDeadline("TIMER IS ZERO")
        return t + secs
    if len(digits) > 10:
        raise BadDeadline("d/ TAKES MAX 10 DIGITS: DDMMYYHHMM")
    nowd = dt.datetime.fromtimestamp(t)
    day = c[0]
    month = c[1] if len(c) > 1 else None
    year = 2000 + c[2] if len(c) > 2 else None
    hour = c[3] if len(c) > 3 else 23
    minute = c[4] if len(c) > 4 else (0 if len(c) > 3 else 59)
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise BadDeadline("BAD TIME")

    def make(y, m):
        try:
            return dt.datetime(y, m, day, hour, minute)
        except ValueError:
            return None

    if year is not None:
        when = make(year, month)
        if when is None:
            raise BadDeadline("NO SUCH DATE")
        if when <= nowd:
            raise BadDeadline("THAT DATE HAS PASSED")
    elif month is not None:
        if not 1 <= month <= 12:
            raise BadDeadline("NO SUCH MONTH")
        when = None
        for y in (nowd.year, nowd.year + 1, nowd.year + 2, nowd.year + 3, nowd.year + 4):
            w = make(y, month)          # 29 Feb waits for the next leap year
            if w and w > nowd:
                when = w
                break
        if when is None:
            raise BadDeadline("NO SUCH DATE")
    else:
        if not 1 <= day <= 31:
            raise BadDeadline("NO SUCH DAY")
        when = None
        y, m = nowd.year, nowd.month
        for _ in range(13):             # the next month that has this day and isn't over yet
            w = make(y, m)
            if w and w > nowd:
                when = w
                break
            m += 1
            if m > 12:
                y, m = y + 1, 1
        if when is None:
            raise BadDeadline("NO SUCH DAY")
    return when.timestamp()


def split_deadline(text, t):
    """Returns (clean text, due epoch or None). Raises BadDeadline."""
    found = list(TOKEN.finditer(text))
    if not found:
        return text, None
    if len(found) > 1:
        raise BadDeadline("ONE DEADLINE PER NOTE")
    m = found[0]
    kind = (m.group(1) or m.group(3)).lower()
    digits = m.group(2) or m.group(4)
    due = parse_deadline(kind, digits, t)
    clean = " ".join((text[:m.start()] + " " + text[m.end():]).split())
    return clean, due


def expires(it):
    return max(it["created"], it.get("due") or 0) + EXPIRE


def load():
    try:
        with open(DATA, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict) and isinstance(d.get("items"), list):
            return d
    except (OSError, ValueError):
        pass
    return {"items": []}


def save(d):
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    tmp = os.path.join(os.path.dirname(DATA), ".notepad.json.%d.tmp" % os.getpid())
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, DATA)


def sweep(d, t):
    """Expire old board notes into the bin, delete bin notes older than 3 years. Returns True if changed."""
    changed = False
    keep = []
    for it in d["items"]:
        if it.get("binned_at") is None and t >= expires(it):
            it["binned_at"] = expires(it)
            it["reason"] = "expired"
            changed = True
        if it.get("binned_at") is not None and t - it["binned_at"] >= PURGE:
            changed = True
            continue
        keep.append(it)
    d["items"] = keep
    return changed


def find(d, nid):
    for it in d["items"]:
        if it["id"] == nid:
            return it
    return None


def view(d, t, msg=""):
    board, binned = [], []
    for it in d["items"]:
        b = it.get("binned_at")
        if b is None:
            board.append({"id": it["id"], "text": it["text"], "created": it["created"],
                          "left": max(0, expires(it) - t), "due": it.get("due")})
        else:
            if it.get("reason") == "done" and t - (it.get("done_at") or 0) < GRACE:
                board.append({"id": it["id"], "text": it["text"], "created": it["created"],
                              "left": max(0, expires(it) - t), "due": it.get("due"), "done_at": it["done_at"]})
            binned.append({"id": it["id"], "text": it["text"], "reason": it.get("reason") or "done",
                           "binned_at": b, "purge_in": max(0, b + PURGE - t)})
    board.sort(key=lambda x: x["created"])
    binned.sort(key=lambda x: -x["binned_at"])
    return {"now": t, "board": board, "bin": binned, "msg": msg}


def main(argv):
    cmd = argv[1] if len(argv) > 1 else "state"
    arg = argv[2] if len(argv) > 2 else ""
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    with open(LOCK, "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        t = now()
        d = load()
        changed = sweep(d, t)
        msg = ""
        if cmd == "add":
            try:
                text = base64.b64decode(arg.encode("ascii")).decode("utf-8")
            except Exception:
                text = ""
            text = " ".join(text.split())
            try:
                text, due = split_deadline(text, t)
                if not text:
                    raise BadDeadline("NOTE NEEDS SOME TEXT")
            except BadDeadline as e:
                out = view(d, t)
                out["error"] = str(e)
                if changed:
                    save(d)
                print(json.dumps(out, ensure_ascii=False))
                return 0
            d["items"].append({"id": uuid.uuid4().hex[:10], "text": text[:MAX_LEN], "created": t, "due": due,
                               "done_at": None, "binned_at": None, "reason": None})
            changed = True
        elif cmd == "tick":
            it = find(d, arg)
            if it and it.get("binned_at") is None:
                it["done_at"] = t
                it["binned_at"] = t
                it["reason"] = "done"
                changed = True
        elif cmd == "untick":
            it = find(d, arg)
            if it and it.get("reason") == "done":
                it["done_at"] = it["binned_at"] = it["reason"] = None
                if t >= expires(it):              # would expire instantly → give it a fresh clock
                    it["created"] = t
                    it["due"] = None
                changed = True
        elif cmd == "restore":
            it = find(d, arg)
            if it and it.get("binned_at") is not None:
                it["done_at"] = it["binned_at"] = it["reason"] = None
                it["created"] = t
                if it.get("due") and it["due"] <= t:   # a passed deadline doesn't come back
                    it["due"] = None
                changed = True
                msg = "RESTORED"
        elif cmd != "state":
            print(json.dumps({"error": "unknown command " + cmd}))
            return 2
        if changed:
            save(d)
        print(json.dumps(view(d, t, msg), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
