#!/bin/bash
# Double-click in Finder: builds + installs WIDGET//CTL (the widget settings app), copies the five widgets into Übersicht,
# and starts WIDGET//CTL at login. ⌃⌥⌘S opens/closes it. Log: .widgetctl-install.log (next to this file).
M="$(cd "$(dirname "$0")" && pwd)"
SRC="$M/widgetctl"
LOG="$M/.widgetctl-install.log"
exec > >(tee "$LOG") 2>&1
echo "== $(date)"; sw_vers -productVersion; swiftc --version 2>&1 | head -1

# 1. build the app bundle in a temp folder
TMP="$(mktemp -d)"; APPB="$TMP/WidgetCTL.app"
mkdir -p "$APPB/Contents/MacOS" "$APPB/Contents/Resources"
if swiftc -O "$SRC/WidgetCTL.swift" -o "$APPB/Contents/MacOS/WidgetCTL" -framework Cocoa -framework WebKit -framework Carbon; then
  echo "✓ compiled"
else
  echo "✗ compile failed — nothing installed. Send this log to Claude."; exit 1
fi
cp "$SRC/ctl.html" "$APPB/Contents/Resources/ctl.html"
cp "$SRC/Info.plist" "$APPB/Contents/Info.plist"
if [ -f "$SRC/icon.png" ]; then
  IS="$TMP/AppIcon.iconset"; mkdir -p "$IS"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$SRC/icon.png" --out "$IS/icon_${s}x${s}.png" >/dev/null
    d=$((s * 2)); sips -z $d $d "$SRC/icon.png" --out "$IS/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$IS" -o "$APPB/Contents/Resources/AppIcon.icns" && echo "✓ icon"
fi
codesign --force --deep -s - "$APPB" && echo "✓ signed (ad hoc)"

# 2. install (replaces an older copy)
DEST="/Applications"; [ -w "$DEST" ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }
pkill -x WidgetCTL 2>/dev/null && sleep 1
rm -rf "$DEST/WidgetCTL.app" && ditto "$APPB" "$DEST/WidgetCTL.app" && echo "✓ installed: $DEST/WidgetCTL.app"
rm -rf "$TMP"

# 3. widgets → Übersicht (they now read their theme + position from widgets.json)
W="$(ls -d "$HOME/Library/Application Support/"*bersicht/widgets 2>/dev/null | head -1)"
if [ -n "$W" ]; then
  cp "$M/studyterm.jsx" "$M/doubloons.jsx" "$M/75hard.jsx" "$M/notepad.jsx" "$M/quote.jsx" "$W/" && echo "✓ widgets copied to $W"
else
  echo "✗ Übersicht widgets folder not found — run Install STUDYTERM.command first"
fi

# 4. start at login
LA="$HOME/Library/LaunchAgents/com.example.widgetctl.plist"; mkdir -p "$HOME/Library/LaunchAgents"
cat > "$LA" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.example.widgetctl</string>
<key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-g</string><string>$DEST/WidgetCTL.app</string></array>
<key>RunAtLoad</key><true/>
</dict></plist>
PL
plutil -lint "$LA" && echo "✓ WIDGET//CTL starts at login"

# 5. launch now with the window open
open "$DEST/WidgetCTL.app" --args --show && echo "✓ running — ⌃⌥⌘S toggles the window, menu-bar ▦ icon for the rest"
osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' 2>/dev/null
echo "== done"
