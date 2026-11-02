# Übersicht desktop widgets

Retro-terminal desktop widgets for [Übersicht](https://tracesof.net/uebersicht/) (macOS), driven by plain files in an Obsidian vault.

| Widget | What it does |
|---|---|
| `doubloons.jsx` | Wallet balance for a points/rewards ledger |
| `75hard.jsx` | Daily checklist for the 75 Hard challenge |
| `studyterm.jsx` | Study timer that logs finished sessions to the ledger |
| `notepad.jsx` | Notepad with deadline countdowns |
| `quote.jsx` | Quote of the day |
| `widgetctl/` | WIDGET//CTL, a small app to set theme and position for all widgets |

## Setup

1. Install Übersicht, then double-click `Install STUDYTERM.command` (copies the widgets and starts the login helpers).
2. The widgets expect a vault at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/X's Second Brain` (falls back to `~/Documents/Obsidian Vault/...`). Change the `V=` line at the top of each `.jsx` if yours lives elsewhere.
3. Optional: `Install WIDGETCTL.command` for the settings app. `⌃⌥⌘W` toggles all widgets.

The backends (`*.py`) are stdlib-only Python 3.8+. `studyterm.py` calls a vault-specific `build.py` after logging, which is not part of this repo; without it logging still works and the build step just reports it didn't run.

Course names are placeholders (`COURSE 1-3`); edit `SUBJECTS` in `studyterm.py`.
