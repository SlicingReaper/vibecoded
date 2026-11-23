<div align="center">

# 🖥️ Übersicht Desktop Widgets

**Retro-terminal widgets for your macOS desktop** — a wallet, a habit checklist, a study timer, a notepad, a daily quote and three games (Tetris, Pong and 2048), all driven by plain files in an Obsidian vault.

![macOS](https://img.shields.io/badge/macOS-Übersicht-3ef0ff?style=flat-square&logo=apple&logoColor=white&labelColor=040914)
![Python](https://img.shields.io/badge/Python-3.8%2B%20stdlib%20only-1f8fff?style=flat-square&logo=python&logoColor=white&labelColor=040914)
![Swift](https://img.shields.io/badge/Swift-settings%20app-ffb84d?style=flat-square&logo=swift&logoColor=white&labelColor=040914)
![Built with Claude](https://img.shields.io/badge/vibecoded-with%20Claude-ff5ad9?style=flat-square&labelColor=040914)

</div>

---

## ✨ What's in the box

| Widget | Shows | Refreshes | Data it uses |
|:--|:--|:-:|:--|
| 💰 **WALLET//Ð** `doubloons.jsx` | Points balance, with a locked "vault" part, earned / spent totals and streak | 60 s | A `WALLET-DATA` line in the rewards page |
| 🔥 **75//HARD** `75hard.jsx` | Today's 75 Hard checklist — tap a box to tick it | 5 s | The challenge log + `hard75.csv` |
| ⏱️ **STUDY//TERM** `studyterm.jsx` | Stopwatch: start, pause, log a session or throw it away; tap the subject to cycle it | 1 s | `ledger.csv` (+ state in Application Support) |
| ✎ **NOTE//PAD** `notepad.jsx` | Checklist notes with deadline countdowns and a bin | 2 s | `data/notepad.json` |
| “ **QUOTE//DAY** `quote.jsx` | A new quote every midnight, with like / dislike and your own additions | 30 s | `data/quotes.json` |
| ◉ **PONG//SOLO** `pong.jsx` | Single-player Pong: juggle the ball (A/D or ←/→), +1 per hit, faster every hit, miss = game over | 2 s (own 60 fps clock) | previous / best / games in Application Support |
| ▦ **TETRIS//GRID** `tetris.jsx` | Tetris: click to play, arrows + space, hold, ghost piece, next preview, best score | live | Best score in Application Support |
| ⊞ **2048//TILE** `game2048.jsx` | 2048: arrows / WASD or drag to slide, one-step undo, win screen at 2048, board survives reloads | live | Board + best score in Application Support |
| 🎛️ **WIDGET//CTL** `widgetctl/` | Menu-bar app to pick the theme and position of every widget | — | `widgets.json` |

## 🧭 Layout

```
  ┌───────────┐ ┌───────────┐ ┌───────────┐
  │PONG//SOLO │ │ NOTE//PAD │ │ WALLET//Ð │
  │           │ │           │ ├───────────┤
  │           │ │           │ │ 75//HARD  │
  ├───────────┤ ├───────────┤ │           │
  │2048//TILE │ │TETRIS//GRD│ ├───────────┤
  │           │ │           │ │STUDY//TERM│
  │           │ │           │ ├───────────┤
  └───────────┘ └───────────┘ │QUOTE//DAY │
                              └───────────┘
```
Widgets are 230 px wide with 12 px gaps. Move any of them in WIDGET//CTL.

## 🎨 Themes

WIDGET//CTL (`⌃⌥⌘S`) styles every widget at once, and the change shows immediately.

- **15 colour schemes** — cyan, amber, matrix, vapor, sunset, ice, gold, royal, marble, pastel, rose, ink, forest, ocean, rainbow (hue-cycling)
- **7 finishes** — terminal, crt, glass, minimal, marble, paper, bold

## 🚀 Install

1. Install [Übersicht](https://tracesof.net/uebersicht/).
2. Double-click **`Install STUDYTERM.command`**. It installs Übersicht if missing, copies the eight widgets and starts everything at login.
3. Optional: double-click **`Install WIDGETCTL.command`** for the settings app.

**Hotkeys:** `⌃⌥⌘W` shows / hides all widgets · `⌃⌥⌘S` opens WIDGET//CTL.

## ⚙️ How it works

```
 Übersicht widget (.jsx)  ──shell──▶  Python backend (.py)  ──▶  plain files in your vault
        ▲                                                              │
        └──────────────────────  re-reads on refresh  ◀────────────────┘
```

- Widgets are React/JSX that shell out to small **stdlib-only Python** scripts. No dependencies, no server.
- The timer stores timestamps rather than a counter, so it survives sleep, reboot and quitting Übersicht.
- Settings live in `~/Library/Application Support/STUDYTERM/widgets.json`.

## 📁 Files

```
├── doubloons.jsx · 75hard.jsx · studyterm.jsx · notepad.jsx · quote.jsx · tetris.jsx · pong.jsx · game2048.jsx   widgets
├── studyterm.py · notepad.py · quote.py                                     backends
├── widgetctl/                                                               settings app (Swift + HTML)
├── widget-hotkey.swift · widgets-toggle.sh                                  ⌃⌥⌘W show / hide
└── Install … · Check … · Restart … .command                                 helper scripts
```

## ⚠️ Read this before forking

These were built for **one person's vault**, so they are not plug-and-play:

- They look for a vault at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/X's Second Brain` (falling back to `~/Documents/...`). Change the `V=` line at the top of each `.jsx`.
- The data files above (ledger, challenge log, quote pool) and the `build.py` that regenerates the vault pages are **not included**. Without them, NOTE//PAD, the two games and WIDGET//CTL work best; the others need you to supply the files.
- Study subjects are placeholders. Edit `SUBJECTS` in `studyterm.py`.

## 🤖 About

Vibecoded with [Claude](https://claude.ai). Part of [**vibecoded**](..), a collection of AI-built projects.
