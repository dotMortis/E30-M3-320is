#!/usr/bin/env bash
# Bootstraps everything needed to develop on this repo. Safe to re-run any time.
#
#   1. Installs pinned Node.js + uv via mise (see ../mise.toml)
#   2. Creates .env from .env.example if it doesn't exist yet (never overwrites)
#   3. Installs npm dependencies for the rag-chat plugin, vault-search plugin,
#      and the RAG index builder
#   4. Sets up the Python virtualenv for the RAG indexer (via uv)
#   5. Builds both Obsidian plugins from source, as a smoke test that the
#      toolchain works end to end
#
# What this script does NOT do (see DEVELOPMENT.md):
#   - Rebuild the RAG search index itself (costs money, needs a real
#     GEMINI_API_KEY, and takes a while)
#   - Run the scan -> Markdown transcription pipeline (.pipeline/scripts/)
#   - Set up hardware/voice-remote/ (optional ESP32 hardware + PlatformIO/Go
#     toolchain; unrelated to reading/developing the vault itself - see
#     DEVELOPMENT.md "Hardware voice remote")
#
# Usage: ./scripts/dev-setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$1" >&2; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

log "Checking for mise"
if ! command -v mise >/dev/null 2>&1; then
  die "mise is not installed. Install it first: https://mise.jdx.dev/getting-started.html"
fi

log "Installing pinned tool versions (node, uv) via mise"
mise install

# Run every subsequent tool invocation through 'mise exec' so it uses the
# pinned versions from mise.toml regardless of what's on the system PATH.
mrun() { mise exec -- "$@"; }

log "Checking .env"
if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created .env from .env.example — fill in OPENCODE_API_KEY and GEMINI_API_KEY before rebuilding the RAG index."
else
  log ".env already exists, leaving it untouched"
fi

log "Installing npm dependencies: .obsidian/plugins/rag-chat"
(cd .obsidian/plugins/rag-chat && mrun npm ci)

log "Installing npm dependencies: .obsidian/plugins/vault-search"
(cd .obsidian/plugins/vault-search && mrun npm ci)

log "Installing npm dependencies: .pipeline/rag/build"
(cd .pipeline/rag/build && mrun npm ci)

log "Setting up Python virtualenv for the RAG indexer (.pipeline/rag, via uv)"
(
  cd .pipeline/rag
  if [ ! -d .venv ]; then
    mrun uv venv
  fi
  mrun uv pip install -r requirements.txt
)

log "Building rag-chat plugin (smoke test)"
(cd .obsidian/plugins/rag-chat && mrun npm run build)

log "Building vault-search plugin (smoke test)"
(cd .obsidian/plugins/vault-search && mrun npm run build)

log "Done."
cat <<'EOF'

Next steps:
  - Fill in .env with your own API keys if you haven't already.
  - To rebuild the RAG search index after changing vault content, see
    DEVELOPMENT.md ("Rebuilding the RAG index").
  - To add new scanned manual pages, see .pipeline/TRANSFORM-PLAN.md.

EOF
