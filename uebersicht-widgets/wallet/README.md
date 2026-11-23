# 💰 WALLET//Ð — points wallet

A personal points system on your desktop. **Earn** points (Ð) for things you want to do more of, **spend** them on rewards, and **lock** some in a vault so they're saved, not spent.

| File | What |
|:--|:--|
| `doubloons.jsx` | The widget (230 × 176, top-right by default). The file keeps its old name so WIDGET//CTL recognises it. |
| `wallet.py` | Backend: stdlib Python, keeps the ledger |
| `obsidian/` | My original edition, which reads the balance from my Obsidian vault ([details](obsidian)) |

## Use it

Tap the bottom line, type one of these, press ⏎ (Esc cancels):

| You type | Effect |
|:--|:--|
| `+50 gym` | earn 50 Ð, note "gym" |
| `-120 new game` | spend 120 Ð |
| `lock 100` | move 100 Ð into the 🔒 vault (no longer spendable) |
| `unlock 40` | take 40 Ð back out of the vault |
| `undo` | remove the last entry |

The panel shows **spendable** balance (earned − spent − locked), plus **EARNED**, **🔒 VAULT**, **STREAK** and **SPENT**.
You can't spend or lock more than you have. **Streak** counts days in a row with at least one earning. Days roll over at **04:00**, so a late-night session still counts for the day it belongs to.

[STUDY//TERM](../study-term) pays study time in automatically: 15 Ð per full 25-minute block by default.

## Data

`~/Library/Application Support/STUDYTERM/standalone/data/wallet.json` holds one entry per action (`t`, `kind` earn/spend/lock/unlock, `n`, `note`). You can edit it by hand. Totals are always recalculated from the entries.

## From the command line

```bash
B="$HOME/Library/Application Support/STUDYTERM/standalone/bin"
python3 "$B/wallet.py" state                                   # JSON totals
python3 "$B/wallet.py" add "$(printf '+20 read' | base64)"      # same syntax as the widget
python3 "$B/wallet.py" earn 15 "$(printf 'from a script' | base64)"
```

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
