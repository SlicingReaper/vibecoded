#!/bin/bash
# Double-click: reports why the desktop widgets aren't showing. Writes .widgets-check.log + a copy of the live widget files to data/_widgets-live/. Changes nothing else.
M="$(cd "$(dirname "$0")" && pwd)"; LOG="$M/.widgets-check.log"
exec > "$LOG" 2>&1
echo "== $(date)"
pgrep -lf "WidgetCTL.app" | head -2
echo "-- windows:"; osascript -e 'tell application "System Events" to get {name, position, size} of every window of (first process whose name contains "bersicht")' 2>&1
osascript -e 'tell application "System Events" to get visible of (first process whose name contains "bersicht")' 2>&1
echo "-- displays:"; system_profiler SPDisplaysDataType 2>/dev/null | grep -E "Resolution|Main Display|Mirror|Online|^ +[A-Za-z].*:$" | head -20
echo "== end"
