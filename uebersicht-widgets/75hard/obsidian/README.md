# 75//HARD — Obsidian edition (reference)

The version I used for my own 75 Hard run (finished 2 Nov 2026). Every 5 seconds it reads **today's row** of the log table in my vault page `03 — Fitness & Health/75 Hard.md`. A tap calls `study-term/obsidian/studyterm.py tick <box>`, which:

- writes the tick to `00 — Meta/data/hard75.csv`
- adds a points row to `ledger.csv` for workouts (+20 Ð) and reading (+10 Ð, with the page numbers worked out from `books.csv`)
- runs `build.py` (not published) to regenerate the page, the dashboards and the wallet

Without that vault and build script it shows *NO ROW FOR TODAY*. The [standalone edition](..) does the whole job on its own.
