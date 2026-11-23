# “ QUOTE//DAY — a quote a day

A new quote every night at midnight, drawn from a built-in pool of **300**: 200 Bible verses (KJV, public domain) and 100 quotes from Stoics, athletes, writers and leaders. Rate them and the draw adapts; add your own and they join the pool.

| File | What |
|:--|:--|
| `quote.jsx` | The widget (230 × 176, under STUDY//TERM by default) |
| `quote.py` | Backend: daily draw, ratings, your quotes |
| `quotes.json` | The pool, copied to your data folder on first install (edit freely) |

## Use it

- **⚙** (top right) opens QUOTE//CFG:
  - **▲ LIKE**: this quote is drawn ×1.2 as often. **▼ DISLIKE**: ×0.8. Same button again clears it; the other button switches.
  - **+ ADD QUOTE**: quote, author or verse, and a † box for scripture → SAVE.
- Bible verses show **†** and the reference; others show author and source / year.

## How the draw works

The first refresh after midnight draws the day's quote and saves it, so it stays put all day. The draw is weighted random (liked ×1.2, disliked ×0.8, everything else ×1.0). Anything shown in the last 150 days is skipped, so the whole pool comes round before anything repeats.

## Data

`~/Library/Application Support/STUDYTERM/standalone/data/`
- `quotes.json`: the pool. Keep `id`s stable so your ratings stay attached. Reinstalling never overwrites it.
- `quotes-user.json`: your likes and dislikes, your own quotes, and the day-by-day history

Want a different pool? Replace `quotes.json` with your own in the same format: `{"quotes": [{"id", "text", "by", "src", "ref", "xian"}]}`.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
