# ⌨️ Hotkey — show / hide all widgets

Press **`⌃⌥⌘W`** anywhere to hide every widget; press it again to bring them back. The games pause while hidden.

| File | What |
|:--|:--|
| `widget-hotkey.swift` | Tiny background helper that registers `⌃⌥⌘W` (Carbon hotkey API, so no Accessibility permission). Started at login by a LaunchAgent. |
| `widgets-toggle.sh` | The same toggle as a shell script, e.g. for a Shortcuts action or a Stream Deck button |

**How it works:** the toggle creates or removes `~/Library/Application Support/STUDYTERM/hidden` and tells Übersicht to refresh. Every widget checks for that file first and renders nothing while it exists.

`install.command` compiles the helper and sets up the LaunchAgent (`com.felix.studyterm.hotkey`). `uninstall.command` removes both.

---

<sub>Part of [Übersicht Desktop Widgets](..) · 🤖 vibecoded with Claude</sub>
