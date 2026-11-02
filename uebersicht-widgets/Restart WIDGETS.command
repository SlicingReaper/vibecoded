#!/bin/bash
# Double-click: hard-restarts Übersicht (the widget renderer). Log: .widgets-restart.log
M="$(cd "$(dirname "$0")" && pwd)"; exec > "$M/.widgets-restart.log" 2>&1
echo "== $(date) user=$(whoami) console=$(stat -f %Su /dev/console)"
echo "before:"; ps -axo pid,lstart,user,comm | grep -i "bersicht\|WidgetCTL" | grep -v grep
rm -f "$HOME/Library/Application Support/STUDYTERM/hidden"
osascript -e 'tell application id "tracesOf.Uebersicht" to quit'; sleep 2
pkill -f "Übersicht.app/Contents/MacOS" ; pkill -f "bersicht.app/Contents/Resources/node"; sleep 2
pkill -9 -f "bersicht.app/Contents" ; sleep 1
APP="$(ls -d /Applications/*bersicht.app | head -1)"; open -g "$APP"; sleep 8
echo "after:"; ps -axo pid,lstart,user,comm | grep -i "bersicht\|WidgetCTL" | grep -v grep
osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' && echo "✓ refreshed"
osascript -e 'tell application "System Events" to get {position, size} of every window of (first process whose name contains "bersicht")' 2>&1
echo "== done"
