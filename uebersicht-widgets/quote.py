#!/usr/bin/env python3
"""QUOTE//DAY — backend for the quote.jsx Übersicht widget.

    python3 "00 — Meta/quote.py" state                     # today's quote + your rating as JSON (what the widget reads)
    python3 "00 — Meta/quote.py" pref <id> like|dislike    # same button again = clear, other button = switch
    python3 "00 — Meta/quote.py" add <b64 text> <b64 source> <0|1>   # your own quote; 1 = show the † mark

Rules:
  - The quote changes at local MIDNIGHT. The first `state` call of a new day draws it and saves it,
    so it stays fixed all day even if you rate it or add quotes.
  - Draw = weighted random: liked ×1.2, disliked ×0.8, everything else ×1.0.
  - Quotes shown in the last 150 days are skipped, so the pool runs through before anything repeats.
  - Christian quotes (xian) show † + the verse; others show author + source/year.

Data:  00 — Meta/data/quotes.json       — the 300 built-in quotes (edit freely, keep ids stable)
       00 — Meta/data/quotes-user.json  — your likes/dislikes, your own quotes, the day-by-day history
Stdlib only, Python 3.8+.
"""
import base64, datetime, fcntl, json, os, random, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
POOL = os.path.join(HERE, "data", "quotes.json")
USER = os.environ.get("QUOTE_USER") or os.path.join(HERE, "data", "quotes-user.json")
LOCK = os.path.join(os.path.expanduser("~/Library/Application Support/STUDYTERM"), "quote.lock")

WEIGHT = {1: 1.2, 0: 1.0, -1: 0.8}
NO_REPEAT_DAYS = 150
MAX_TEXT, MAX_SRC = 300, 80


def today():
    d = os.environ.get("QUOTE_DAY")  # testing hook
    return d or datetime.date.today().isoformat()


def load_pool():
    try:
        with open(POOL, encoding="utf-8") as f:
            return json.load(f).get("quotes", [])
    except (OSError, ValueError):
        return []


def load_user():
    try:
        with open(USER, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict):
            d.setdefault("prefs", {}); d.setdefault("own", []); d.setdefault("history", [])
            return d
    except (OSError, ValueError):
        pass
    return {"prefs": {}, "own": [], "history": []}


def save_user(d):
    os.makedirs(os.path.dirname(USER), exist_ok=True)
    tmp = os.path.join(os.path.dirname(USER), ".quotes-user.json.%d.tmp" % os.getpid())
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, USER)


def draw(day, quotes, prefs, history):
    recent = {h["id"] for h in history[-NO_REPEAT_DAYS:]}
    cands = [q for q in quotes if q["id"] not in recent] or quotes
    rnd = random.Random("quote-day-" + day)
    return rnd.choices(cands, weights=[WEIGHT[prefs.get(q["id"], 0)] for q in cands])[0]


def view(day, q, u, n_pool, msg=""):
    prefs = u["prefs"]
    out = {"date": day, "msg": msg,
           "counts": {"pool": n_pool, "liked": sum(1 for v in prefs.values() if v == 1),
                      "disliked": sum(1 for v in prefs.values() if v == -1), "own": len(u["own"])}}
    if q:
        out["q"] = {k: q.get(k) for k in ("id", "text", "ref", "by", "src", "xian")}
        out["q"]["own"] = q["id"].startswith("u")
        out["pref"] = prefs.get(q["id"], 0)
        out["weight"] = WEIGHT[out["pref"]]
    return out


def main(argv):
    cmd = argv[1] if len(argv) > 1 else "state"
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    with open(LOCK, "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        u = load_user()
        quotes = load_pool() + u["own"]
        by_id = {q["id"]: q for q in quotes}
        day = today()
        changed, msg = False, ""

        if cmd == "pref" and len(argv) > 3:
            qid, which = argv[2], argv[3]
            want = 1 if which == "like" else -1 if which == "dislike" else 0
            if qid in by_id and want:
                if u["prefs"].get(qid, 0) == want:
                    u["prefs"].pop(qid, None); msg = "CLEARED"
                else:
                    u["prefs"][qid] = want; msg = "LIKED · ×1.2" if want == 1 else "DISLIKED · ×0.8"
                changed = True
        elif cmd == "add" and len(argv) > 4:
            try:
                text = " ".join(base64.b64decode(argv[2]).decode("utf-8").split())[:MAX_TEXT]
                src = " ".join(base64.b64decode(argv[3]).decode("utf-8").split())[:MAX_SRC]
            except Exception:
                text = src = ""
            if not text:
                msg = "ERR: QUOTE IS EMPTY"
            else:
                xian = argv[4] == "1"
                n = max([int(q["id"][1:]) for q in u["own"]] + [0]) + 1
                q = {"id": "u%04d" % n, "text": text, "xian": xian, "added": day}
                if xian:
                    q["ref"] = src
                else:
                    q["by"], q["src"] = src or "Unknown", ""
                u["own"].append(q); quotes.append(q); by_id[q["id"]] = q
                changed, msg = True, "SAVED · IN THE POOL"
        elif cmd != "state":
            print(json.dumps({"error": "unknown command " + cmd})); return 2

        # today's quote: stored once per day, drawn at the first call after midnight
        h = u["history"]
        cur = by_id.get(h[-1]["id"]) if h and h[-1].get("date") == day else None
        if cur is None and quotes:
            cur = draw(day, quotes, u["prefs"], h)
            if h and h[-1].get("date") == day:
                h[-1]["id"] = cur["id"]
            else:
                h.append({"date": day, "id": cur["id"]})
            del h[:-400]
            changed = True
        if changed:
            save_user(u)
        print(json.dumps(view(day, cur, u, len(quotes), msg), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
