#!/bin/bash
# Double-click to remove the widgets, the hotkey and WIDGET//CTL. Your data stays unless you say otherwise.
SUP="$HOME/Library/Application Support/STUDYTERM"
W="$(ls -d "$HOME/Library/Application Support/"*bersicht/widgets 2>/dev/null | head -1)"
read -r -p "Remove the 8 widgets, the ⌃⌥⌘W hotkey and WIDGET//CTL? [y/N] " a; [ "$a" = "y" ] || [ "$a" = "Y" ] || exit 0
[ -n "$W" ] && (cd "$W" && rm -f doubloons.jsx 75hard.jsx studyterm.jsx notepad.jsx quote.jsx tetris.jsx pong.jsx game2048.jsx) && echo "✓ widgets removed"
launchctl bootout gui/$(id -u)/com.felix.studyterm.hotkey 2>/dev/null
pkill -x WidgetCTL 2>/dev/null
rm -f "$HOME/Library/LaunchAgents/com.felix.studyterm.hotkey.plist" "$HOME/Library/LaunchAgents/com.felix.widgetctl.plist"
rm -rf "/Applications/WidgetCTL.app" "$HOME/Applications/WidgetCTL.app" "$SUP/widget-hotkey" "$SUP/standalone/bin"
echo "✓ hotkey + WIDGET//CTL removed"
read -r -p "Also delete your data (wallet, sessions, notes, 75 Hard log, scores) in $SUP? [y/N] " b
[ "$b" = "y" ] || [ "$b" = "Y" ] && rm -rf "$SUP" && echo "✓ data deleted"
echo "Übersicht itself is left installed (drag it to the Bin if you don't want it)."
read -r -p "Press Enter to close"
