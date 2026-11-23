# ⊞ 2048//TILE — 2048 on your desktop

The sliding-tile puzzle: merge equal tiles until you reach 2048, then keep going. The board is saved, so a game survives reloads, sleep and reboot. No backend: the game runs entirely in the widget.

| File | What |
|:--|:--|
| `game2048.jsx` | The whole game. Copy it into Übersicht's widgets folder and it works. |

## Play

**Click the board** to focus it. Clicking elsewhere pauses the game.

| Input | Action |
|:--|:--|
| ← → ↑ ↓ · WASD · HJKL | slide |
| press + drag on the board | slide with the mouse / trackpad |
| U | undo one move |
| P / Esc | pause · R new game |

New tiles are a 2 (90 %) or a 4 (10 %). Score = the sum of every merged tile. Reach 2048 for a win screen; click to keep playing.

**Saved in** `~/Library/Application Support/STUDYTERM/`: `2048-state.json` (the board) and `2048-best`.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
