# ▦ TETRIS//GRID — Tetris on your desktop

Tetris in a 230 × 314 panel, themed like everything else. No backend: the game runs entirely in the widget.

| File | What |
|:--|:--|
| `tetris.jsx` | The whole game. Copy it into Übersicht's widgets folder and it works. |

## Play

**Click the board** to start. Keys only reach the widget while it has focus, so clicking anywhere else pauses it.

| Key | Action |
|:--|:--|
| ← → | move |
| ↑ / X | rotate clockwise · Z rotates back |
| ↓ | soft drop (+1 per row) |
| Space | hard drop (+2 per row) |
| C / Shift | hold a piece (once per drop) |
| P / Esc | pause · R restart |

7-bag randomiser, ghost piece, next preview, hold box. Level up every 10 lines; the speed rises with it. Line clears score 100 / 300 / 500 / 800 × level. It also pauses when you hide the widgets with `⌃⌥⌘W`.

**Best score:** `~/Library/Application Support/STUDYTERM/tetris-best`

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
