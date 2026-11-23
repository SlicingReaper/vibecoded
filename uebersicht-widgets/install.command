#!/bin/bash
# Double-click in Finder (or run: bash install.command). Installs the STANDALONE edition of every widget —
# no Obsidian needed. Safe to run again: it updates the code and never touches your data.
#
#   1. installs Übersicht if it's missing (https://tracesof.net/uebersicht/)
#   2. copies the backends (*.py) to   ~/Library/Application Support/STUDYTERM/standalone/bin/
#      and the starter data (quote pool) to …/standalone/data/ (only if not there yet)
#   3. copies the eight widgets (*.jsx) into Übersicht's widgets folder
#   4. builds the ⌃⌥⌘W show/hide hotkey and the WIDGET//CTL settings app (needs Xcode Command Line Tools: xcode-select --install)
#   5. starts Übersicht, the hotkey and WIDGET//CTL at login
#
# Log: install.log next to this file.
D="$(cd "$(dirname "$0")" && pwd)"
exec > >(tee "$D/install.log") 2>&1
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"
echo "== $(date) · macOS $(sw_vers -productVersion)"
SUP="$HOME/Library/Application Support/STUDYTERM"; SA="$SUP/standalone"
WIDGETS="wallet/doubloons.jsx 75hard/75hard.jsx study-term/studyterm.jsx notepad/notepad.jsx quote/quote.jsx tetris/tetris.jsx pong/pong.jsx 2048/game2048.jsx"
BACKENDS="wallet/wallet.py 75hard/hard75.py study-term/studyterm.py notepad/notepad.py quote/quote.py"

# 0. python3
if python3 -c 'import sys; assert sys.version_info >= (3, 8)' 2>/dev/null; then echo "✓ $(python3 --version)"
else echo "✗ python3 3.8+ missing — run: xcode-select --install   then run this again"; read -r -p "Press Enter to close"; exit 1; fi

# 1. Übersicht
APP="$(ls -d /Applications/*bersicht.app 2>/dev/null | head -1)"
if [ -z "$APP" ]; then
  echo "… downloading Übersicht"
  curl -fL --retry 2 -o /tmp/uebersicht.zip "https://tracesof.net/uebersicht/releases/Uebersicht-1.6.82.app.zip" \
    && ditto -x -k /tmp/uebersicht.zip /Applications && rm -f /tmp/uebersicht.zip
  APP="$(ls -d /Applications/*bersicht.app 2>/dev/null | head -1)"
  [ -n "$APP" ] && xattr -dr com.apple.quarantine "$APP" 2>/dev/null
fi
[ -n "$APP" ] && echo "✓ Übersicht: $APP" || { echo "✗ Übersicht install failed — get it from https://tracesof.net/uebersicht/ and run this again"; read -r -p "Press Enter to close"; exit 1; }
[ -d "$HOME/Library/Application Support/Übersicht/widgets" ] || { open -g "$APP"; sleep 5; }   # first start creates the widgets folder
W="$(ls -d "$HOME/Library/Application Support/"*bersicht/widgets 2>/dev/null | head -1)"
[ -n "$W" ] || W="$HOME/Library/Application Support/Übersicht/widgets"; mkdir -p "$W"

# Obsidian edition already installed? (the author's own setup) — don't overwrite it by accident
if grep -qs "Obsidian Vault" "$W/doubloons.jsx" "$W/75hard.jsx" "$W/studyterm.jsx"; then
  read -r -p "Your widgets folder has the OBSIDIAN edition. Replace it with the standalone edition? [y/N] " a
  [ "$a" = "y" ] || [ "$a" = "Y" ] || { echo "Nothing changed."; read -r -p "Press Enter to close"; exit 0; }
fi

# 2. backends + starter data
mkdir -p "$SA/bin" "$SA/data"
for f in $BACKENDS; do cp "$D/$f" "$SA/bin/" || { echo "✗ missing $f"; exit 1; }; done
[ -f "$SA/data/quotes.json" ] || cp "$D/quote/quotes.json" "$SA/data/quotes.json"
echo "✓ backends → $SA/bin"
python3 "$SA/bin/wallet.py" state >/dev/null && python3 "$SA/bin/hard75.py" state >/dev/null \
  && python3 "$SA/bin/studyterm.py" state >/dev/null && python3 "$SA/bin/notepad.py" state >/dev/null \
  && python3 "$SA/bin/quote.py" state >/dev/null && echo "✓ all backends answer" || echo "✗ a backend failed — see the error above"

# 3. widgets
for f in $WIDGETS; do cp "$D/$f" "$W/"; done && echo "✓ 8 widgets → $W"

# 4a. ⌃⌥⌘W hotkey
LA="$HOME/Library/LaunchAgents"; mkdir -p "$LA"
if command -v swiftc >/dev/null && swiftc -O "$D/hotkey/widget-hotkey.swift" -o "$SUP/widget-hotkey" 2>/dev/null; then
  cat > "$LA/com.felix.studyterm.hotkey.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.felix.studyterm.hotkey</string>
<key>ProgramArguments</key><array><string>$SUP/widget-hotkey</string></array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
</dict></plist>
PL
  launchctl bootout gui/$(id -u)/com.felix.studyterm.hotkey 2>/dev/null
  launchctl bootstrap gui/$(id -u) "$LA/com.felix.studyterm.hotkey.plist" && echo "✓ ⌃⌥⌘W hotkey running"
else
  echo "· hotkey skipped (needs swiftc: xcode-select --install)"
fi
rm -f "$SUP/hidden"

# 4b. WIDGET//CTL app
if command -v swiftc >/dev/null; then
  T="$(mktemp -d)"; A="$T/WidgetCTL.app"; mkdir -p "$A/Contents/MacOS" "$A/Contents/Resources"
  if swiftc -O "$D/widget-ctl/WidgetCTL.swift" -o "$A/Contents/MacOS/WidgetCTL" -framework Cocoa -framework WebKit -framework Carbon 2>/dev/null; then
    cp "$D/widget-ctl/ctl.html" "$A/Contents/Resources/"; cp "$D/widget-ctl/Info.plist" "$A/Contents/"
    IS="$T/AppIcon.iconset"; mkdir -p "$IS"
    for s in 16 32 128 256 512; do sips -z $s $s "$D/widget-ctl/icon.png" --out "$IS/icon_${s}x${s}.png" >/dev/null; d=$((s*2)); sips -z $d $d "$D/widget-ctl/icon.png" --out "$IS/icon_${s}x${s}@2x.png" >/dev/null; done
    iconutil -c icns "$IS" -o "$A/Contents/Resources/AppIcon.icns" 2>/dev/null
    codesign --force --deep -s - "$A" 2>/dev/null
    DEST="/Applications"; [ -w "$DEST" ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }
    pkill -x WidgetCTL 2>/dev/null; sleep 1; rm -rf "$DEST/WidgetCTL.app"; ditto "$A" "$DEST/WidgetCTL.app" && echo "✓ WIDGET//CTL → $DEST/WidgetCTL.app"
    cat > "$LA/com.felix.widgetctl.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.felix.widgetctl</string>
<key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-g</string><string>$DEST/WidgetCTL.app</string></array>
<key>RunAtLoad</key><true/>
</dict></plist>
PL
    open -g "$DEST/WidgetCTL.app"
  else echo "· WIDGET//CTL compile failed — widgets still work, they just keep their default spots and colours"; fi
  rm -rf "$T"
else
  echo "· WIDGET//CTL skipped (needs swiftc: xcode-select --install)"
fi

# 5. Übersicht at login + go
cat > "$LA/com.felix.studyterm.uebersicht.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.felix.studyterm.uebersicht</string>
<key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-g</string><string>$APP</string></array>
<key>RunAtLoad</key><true/>
</dict></plist>
PL
open -g "$APP"; sleep 2; osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' 2>/dev/null
echo "== done. If clicks fall through a widget: Übersicht menu-bar icon → the widget → turn on interaction."
read -r -p "Press Enter to close"
