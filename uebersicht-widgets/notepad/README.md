# ✎ NOTE//PAD — checklist notes with deadlines

Quick notes that clean up after themselves. Type a note, tick it off when it's done, and anything you forget expires into a bin you can restore from.

| File | What |
|:--|:--|
| `notepad.jsx` | The widget (230 × 314, left of the wallet by default) |
| `notepad.py` | Backend: notes, deadlines, expiry, bin |

## Use it

- **Add:** click the bottom field, type, ⏎. Esc leaves the field.
- **Tick:** tap a row. It's struck through and a bar drains for 5 s (tap again to undo), then it folds into the bin.
- **Expire:** notes move to the bin 3 days after you wrote them. The bin deletes them for good after 3 years.
- **Bin:** `BIN ▸` (top right) lists ticked ✓ and expired ⌛ notes, newest first. `↺` (tap twice) puts one back with a fresh 3 days.

## Deadlines

Put **one** token anywhere in the note. Digits only; fewer digits = less specific:

| Token | Meaning | Examples |
|:--|:--|:--|
| `t/DDHHMM` | countdown from now | `t/45` = 45 days · `t/0012` = 12 h · `t/000030` = 30 min |
| `d/DDMMYY(HHMM)` | a date | `d/05` = next 5th · `d/0511` = next 5 Nov · `d/0511261430` = 5 Nov 2026 14:30 |

A date with no time means 23:59. The row shows `⏱` time left: cyan, then amber under 24 h, then red `LATE`. Deadline notes expire 3 days *after* the deadline. A bad token (31 Feb, a past date) keeps your text in the field and flashes the reason.

## Data

`~/Library/Application Support/STUDYTERM/standalone/data/notepad.json` (override with `NOTEPAD_DATA`). In my own setup the same backend points at a file in my Obsidian vault so it syncs through iCloud. Set `NOTEPAD_DATA` to do the same with any synced folder.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
