#!/bin/bash
# Show/hide every widget in this collection. Optional: bind it to a key in the Shortcuts app (widget-hotkey.swift already gives you ⌃⌥⌘W).
D="$HOME/Library/Application Support/STUDYTERM"; mkdir -p "$D"
if [ -f "$D/hidden" ]; then rm -f "$D/hidden"; else touch "$D/hidden"; fi
osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' >/dev/null 2>&1
