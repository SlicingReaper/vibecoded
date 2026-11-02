#!/bin/bash
# Double-click in Finder: installs Übersicht (if missing) + all five widgets (wallet, 75 Hard, STUDY//TERM, NOTE//PAD, QUOTE//DAY). Log: .studyterm-install.log
M="$(cd "$(dirname "$0")" && pwd)"
LOG="$M/.studyterm-install.log"
exec > >(tee "$LOG") 2>&1
echo "== $(date)"; sw_vers; xcodebuild -version 2>/dev/null | head -1
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"
APP="$(ls -d /Applications/*bersicht.app 2>/dev/null | head -1)"
if [ -z "$APP" ]; then
  echo "… downloading Übersicht 1.6.82"
  curl -fL --retry 2 -o /tmp/uebersicht.zip "https://tracesof.net/uebersicht/releases/Uebersicht-1.6.82.app.zip" \
    && ditto -x -k /tmp/uebersicht.zip /Applications && rm -f /tmp/uebersicht.zip
  APP="$(ls -d /Applications/*bersicht.app 2>/dev/null | head -1)"
  [ -n "$APP" ] && xattr -dr com.apple.quarantine "$APP" 2>/dev/null
fi
[ -n "$APP" ] && echo "✓ app: $APP" || echo "✗ Übersicht install failed"
W="$(ls -d "$HOME/Library/Application Support/"*bersicht/widgets 2>/dev/null | head -1)"
[ -n "$W" ] || W="$HOME/Library/Application Support/Übersicht/widgets"
mkdir -p "$W" && cp "$M/studyterm.jsx" "$M/doubloons.jsx" "$M/75hard.jsx" "$M/notepad.jsx" "$M/quote.jsx" "$W/" && echo "✓ widgets copied to $W"
ls "$W"
if python3 -c 'import sys; assert sys.version_info >= (3, 8)' 2>/dev/null; then
  echo "✓ $(python3 --version) at $(command -v python3)"
  python3 "$M/studyterm.py" state && echo "✓ backend OK"
else
  echo "✗ python3 missing"
fi

# start Übersicht at login (widgets come up with the Mac)
if [ -n "$APP" ]; then
  LU="$HOME/Library/LaunchAgents/com.example.studyterm.uebersicht.plist"; mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$LU" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.example.studyterm.uebersicht</string>
<key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-g</string><string>$APP</string></array>
<key>RunAtLoad</key><true/>
</dict></plist>
PL
  plutil -lint "$LU" && echo "✓ Übersicht starts at login"
fi

# ⌃⌥⌘W hotkey helper (shows/hides the widgets)
SD="$HOME/Library/Application Support/STUDYTERM"; mkdir -p "$SD"
if swiftc -O "$M/widget-hotkey.swift" -o "$SD/widget-hotkey"; then
  LA="$HOME/Library/LaunchAgents/com.example.studyterm.hotkey.plist"; mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$LA" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.example.studyterm.hotkey</string>
<key>ProgramArguments</key><array><string>$SD/widget-hotkey</string></array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>StandardErrorPath</key><string>$SD/hotkey.log</string>
</dict></plist>
PL
  launchctl bootout gui/$(id -u)/com.example.studyterm.hotkey 2>/dev/null
  launchctl bootstrap gui/$(id -u) "$LA" && echo "✓ hotkey ⌃⌥⌘W running"
  rm -f "$SD/hidden"
else
  echo "✗ hotkey compile failed"
fi
[ -n "$APP" ] && open "$APP"; osascript -e 'tell application id "tracesOf.Uebersicht" to refresh' 2>/dev/null
echo "== done"
