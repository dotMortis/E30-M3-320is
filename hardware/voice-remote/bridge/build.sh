#!/usr/bin/env bash
# Cross-compiles the serial bridge for both supported platforms and copies
# the results into the Obsidian plugin's bin/ folder, where the plugin's
# bridge-client.ts picks them up at runtime. Requires only `go` (no C
# toolchain needed - go.bug.st/serial is pure Go on both targets).
#
# Run this after changing main.go, then commit the updated binaries under
# .obsidian/plugins/rag-chat/bin/ - they ship with the plugin so end users
# never need Go installed. See ../PLAN.md "Serial bridge approach".
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

OUT_DIR="../../../.obsidian/plugins/rag-chat/bin"
mkdir -p "$OUT_DIR"

echo "Building serial-bridge-win32-x64.exe ..."
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags="-s -w" \
  -o "$OUT_DIR/serial-bridge-win32-x64.exe" .

echo "Building serial-bridge-linux-x64 ..."
GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" \
  -o "$OUT_DIR/serial-bridge-linux-x64" .
chmod +x "$OUT_DIR/serial-bridge-linux-x64"

echo "Done:"
ls -lh "$OUT_DIR"/serial-bridge-*
