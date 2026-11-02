#!/bin/bash
# Show/hide all five Übersicht widgets (doubloons, 75 Hard, STUDY//TERM, NOTE//PAD, QUOTE//DAY). Bound to ⌃⌥⌘W via the Shortcuts app.
D="$HOME/Library/Application Support/STUDYTERM"; mkdir -p "$D"
if [ -f "$D/hidden" ]; then rm -f "$D/hidden"; else touch "$D/hidden"; fi
osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' >/dev/null 2>&1
