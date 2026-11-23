# 🔥 75//HARD — 75 Hard challenge tracker

The 75 Hard checklist on your desktop: do all seven tasks every day for 75 days. Miss one and you start again at Day 1.

| File | What |
|:--|:--|
| `75hard.jsx` | The widget (230 × 314, under the wallet by default) |
| `hard75.py` | Backend: stdlib Python, works out the day count and whether the attempt is still alive |
| `obsidian/` | My original edition, which reads and writes my Obsidian vault ([details](obsidian)) |

## Use it

1. **Tap the bottom line** (`▶ TAP HERE TO START DAY 1`): today becomes Day 1.
2. **Tap a task** to tick it. Tap again to untick it. You can only tick *today*.
3. Tick all seven → `DAY COMPLETE ■`.

If any earlier day of the attempt isn't fully ticked, the attempt has **failed**. The widget turns red and shows which day you missed. Tap the bottom line twice to restart. After Day 75 it shows **FINISHED**, and the same double tap starts a new attempt. Old attempts are kept in the file's `history`.

Days roll over at **04:00**, so ticking at 01:00 still counts for the day before.

## Change the tasks

Default: outdoor workout 45 · second workout 45 · 3.8 L water · 10 pages · progress photo · follow the diet · no alcohol / cheat meal. Edit `"tasks"` in the data file to change them; any number of tasks works:

```json
"tasks": [ { "icon": "🏃", "label": "OUTDOOR WORKOUT 45" }, { "icon": "📖", "label": "10 PAGES" } ]
```

## Data

`~/Library/Application Support/STUDYTERM/standalone/data/hard75.json`: `start` (Day 1), `attempt`, `ticks` (date → ticked task numbers), `history`, `tasks`.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
