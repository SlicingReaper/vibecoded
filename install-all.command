#!/bin/bash
# Double-click: downloads all eleven widget repos from github.com/SlicingReaper and runs each one's install.command.
# Safe to run again (updates code, never touches your data). Needs macOS 13+, python3 and, for WIDGET//CTL, swiftc (xcode-select --install).
REPOS="points-wallet-widget 75-hard-widget study-timer-widget notepad-widget quote-of-the-day-widget tetris-widget pong-widget pong-duo-widget 2048-widget outpost-colony-widget doom-widget widgetctl"
T="$(mktemp -d)"; export NOPAUSE=1; OK=0; BAD=""
for r in $REPOS; do
  echo "── $r"
  if curl -fsSL "https://codeload.github.com/SlicingReaper/$r/tar.gz/refs/heads/main" | tar -xz -C "$T" \
     && bash "$T/$r-main/install.command"; then OK=$((OK+1)); else BAD="$BAD $r"; fi
done
rm -rf "$T"
echo "== $OK/10 installed${BAD:+ · failed:$BAD}"
read -r -p "Press Enter to close"
