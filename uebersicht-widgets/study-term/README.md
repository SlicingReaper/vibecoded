# ⏱️ STUDY//TERM — study stopwatch

A focus timer that **logs what you did**. Start it, pause it, and when you log the session, write one line about what you got done. Every logged session lands in a CSV, feeds a stats page and pays points into [WALLET//Ð](../wallet).

| File | What |
|:--|:--|
| `studyterm.jsx` | The widget (230 × 176, under 75//HARD by default; refreshes every second) |
| `studyterm.py` | Backend: timer, session log, wallet payment, stats page |
| `obsidian/` | My original edition, which writes to my Obsidian vault ([details](obsidian)) |

## Use it

| Button | Timer at 0 | Timer running / paused |
|:--|:--|:--|
| **Left** | `OPEN`: opens the stats page in your browser | `LOG`: asks *WHAT DID YOU DO?* → ⏎ logs it (Esc = back) |
| **Middle** | `▶` start | `❚❚` pause / `▶` resume |
| **Right** | (dimmed) | `DEL`: tap twice within 3 s to throw the session away |

- Tap the **subject line** (`▸ STUDY`) to cycle subjects.
- The note is required. No note, no log. That's the point: proof of work.
- Under 1 minute isn't logged. A study day rolls over at **04:00**, and a session belongs to the day it *started* in.
- The timer stores timestamps, not a counter, so it survives sleep, reboot and quitting Übersicht.

## Points

Every full **25-minute block** of a day's running total pays **15 Ð** into the wallet. Leftover minutes count toward the next block, so two 15-minute sessions still earn one block.

## Config

`~/Library/Application Support/STUDYTERM/standalone/data/studyterm-config.json` is created on first run:

```json
{ "subjects": ["STUDY", "CODING", "READING", "PROJECT"], "block_min": 25, "points_per_block": 15, "weekly_target_h": 10 }
```

`points_per_block: 0` turns off wallet payments. `weekly_target_h` drives the meter and the daily-share line on the stats page.

## Data

- `…/standalone/data/sessions.csv`: `date,subject,minutes,points,note`, one row per session (open it in any spreadsheet)
- `…/standalone/studyterm/state.json`: the running timer · `stats.html`: the last generated stats page

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
