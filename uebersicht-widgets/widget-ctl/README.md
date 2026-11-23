# 🎛️ WIDGET//CTL — settings app for the widgets

A small menu-bar app that arranges and themes every widget in this collection. It writes one file, `~/Library/Application Support/STUDYTERM/widgets.json`, which every widget reads on its next refresh. After each change Übersicht is told to refresh, so you see it at once.

| File | What |
|:--|:--|
| `WidgetCTL.swift` | The native shell: menu-bar icon (▦), global hotkey `⌃⌥⌘S`, a window hosting the UI |
| `ctl.html` | The UI: grid editor, themes, the widget registry |
| `Info.plist` · `icon.png` | App bundle metadata and icon |

## What it does

- **Layout:** drag widgets on a grid that mirrors your screen. They snap to 230 px columns with 12 px gaps; dropping on another widget swaps or bounces it. Drag one to the tray to store it (hidden), drag it back to deploy it. **RESET LAYOUT** restores the default stack.
- **Theme:** 16 colour schemes (cyan, amber, matrix, vapor, sunset, ice, gold, royal, marble, pastel, rose, ink, forest, ocean, rainbow, vice) × 8 styles (terminal, crt, glass, minimal, marble, paper, bold, vice). Set them for all widgets at once or per widget.
- **Hotkeys:** `⌃⌥⌘S` opens and closes the window; Esc or ✕ closes it. Show / hide all widgets is `⌃⌥⌘W` ([hotkey](../hotkey)).

## Build

`install.command` builds it for you. By hand:

```bash
swiftc -O WidgetCTL.swift -o WidgetCTL -framework Cocoa -framework WebKit -framework Carbon
# then bundle: WidgetCTL.app/Contents/{MacOS/WidgetCTL, Resources/ctl.html, Info.plist}
```

## Adding a widget

Add a line to `const WIDGETS = [...]` in `ctl.html` (`id` must match the widget's `W_ID`, plus size and default grid cell), then rebuild.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
