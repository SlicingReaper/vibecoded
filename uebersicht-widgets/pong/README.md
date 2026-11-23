# ◉ PONG//SOLO — single-player Pong

Keep the ball in the air. Every paddle hit is a point and makes the ball 7 % faster. No backend: the game runs entirely in the widget.

| File | What |
|:--|:--|
| `pong.jsx` | The whole game. Copy it into Übersicht's widgets folder and it works. |

## Play

**Click the field** to focus it. Clicking elsewhere pauses the game.

| Key | Action |
|:--|:--|
| A / ← · D / → | move the paddle |
| Space / Enter | serve |
| P / Esc | pause · R restart |

The ball bounces off the left, right and top walls. Miss it and it falls out the bottom: game over. Where it hits the paddle sets the angle (edge = 60°, centre = straight up). Speed is capped at 640 px/s.

**Scores** (previous, best, games played): `~/Library/Application Support/STUDYTERM/pong-scores`

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
