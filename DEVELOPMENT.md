# Development Guide

This document is for anyone who wants to **develop on** this repository: rebuild
the Obsidian plugins, regenerate the RAG search index, or add new manual pages.

If you just want to **read the manual** in Obsidian, you don't need any of
this — see [`LIESMICH.md`](LIESMICH.md) instead. Everything required for
read-only use (plugin builds, the search index, the RAG index) is already
committed to the repo.

## Prerequisites

- `git`
- [`mise`](https://mise.jdx.dev) — manages the pinned Node.js and `uv`
  versions this repo was verified against (see [`mise.toml`](mise.toml) /
  [`.python-version`](.python-version)). `mise` installs both tools for you;
  you don't need Node or `uv` preinstalled separately.

## Quick start

```sh
git clone <repo-url>
cd E30-M3-320is
./scripts/dev-setup.sh
```

This installs the pinned toolchain, creates `.env` from `.env.example` (if
missing), installs npm dependencies for both Obsidian plugins and the RAG
index builder, sets up the Python virtualenv for the RAG indexer, and builds
both plugins from source as a smoke test. It's safe to re-run any time. It
does **not** rebuild the RAG index or run the scan-transcription pipeline —
see below for those.

## Repository layout

- **Vault content** — the numbered section folders (`11 - Motor`,
  `34 - Bremsen`, ...), `Glossar*.md`, `Sicherheitshinweise.md`,
  `Sonderwerkzeuge.md`, `Technische-Daten.md`, `Startseite.md`,
  `Referenzbilder/`. This is the actual manual content — see `LIESMICH.md`.
- **`.pipeline/scripts/`** — the original scan → Markdown build pipeline
  (OCR/transcription via OpenCode Zen, stdlib-only Python, no extra
  dependencies needed). Full design in `.pipeline/TRANSFORM-PLAN.md`.
- **`.pipeline/rag/`** — the offline RAG indexer (chunking, Gemini
  embeddings, Orama index build). Full design in `.pipeline/rag/PLAN.md`.
- **`.obsidian/plugins/rag-chat/`** — Obsidian plugin source (TypeScript +
  Vite) for the AI chat feature. Ships its built `main.js` and the prebuilt
  index committed; source lives under `src/`.
- **`.obsidian/plugins/vault-search/`** — Obsidian plugin source (JS +
  esbuild) for the custom fuzzy/synonym/compound-word search. Same deal:
  built `main.js` committed, source under `src/`.
- **`hardware/voice-remote/`** — optional hardware voice remote for the
  `rag-chat` plugin's mic button (two ESP32-C3 boards + a small PC-side
  bridge). Off by default, only relevant if you've built the physical
  hardware — see `hardware/voice-remote/PLAN.md`.
- **`scripts/dev-setup.sh`** — one-shot dev environment bootstrap (see Quick
  start above).

## Environment variables

Copy `.env.example` to `.env` at the repo root (done for you by
`dev-setup.sh` if missing) and fill in:

- `OPENCODE_API_KEY` — OpenCode Zen key. Used by
  `.pipeline/scripts/analyze.py` to transcribe scanned manual pages, and as
  the default chat-generation provider baked into the `rag-chat` plugin.
- `GEMINI_API_KEY` — Google Gemini key. Used by `.pipeline/rag/` to compute
  embeddings (`gemini-embedding-2`) when rebuilding the RAG search index.

`.env` is gitignored and must never be committed.

This is separate from the **end-user** Gemini key that a vault reader enters
directly into Obsidian's "RAG Chat" plugin settings at query time (see
`LIESMICH.md`, section 5) — that key lives encrypted in
`.obsidian/plugins/rag-chat/data.json`, per-vault, and is unrelated to this
repo-root `.env`.

## Rebuilding the Obsidian plugins from source

Each plugin ships its built `main.js` committed, so this is only needed when
changing plugin source:

```sh
cd .obsidian/plugins/rag-chat && npm ci && npm run build
cd .obsidian/plugins/vault-search && npm ci && npm run build
```

(`mise exec -- npm ...` if you want the pinned Node version explicitly rather
than whatever's on your `PATH`.)

## Rebuilding the RAG index

Only needed when vault content changes (pages added/edited). Costs a small
amount against your `GEMINI_API_KEY` (~$0.35-0.40 for a full rebuild at time
of writing). See `LIESMICH.md` section 5 for the concise end-user summary;
full design in `.pipeline/rag/PLAN.md`.

```sh
cd .pipeline/rag
uv venv && uv pip install -r requirements.txt
.venv/bin/python3 build_rag_index.py --pilot 20   # cost check (a few cents) first
.venv/bin/python3 build_rag_index.py              # full build
cd build && npm ci && node build_orama.mjs         # builds the committed index + vector shards
```

Sanity-check retrieval afterwards with `.pipeline/rag/qa_rag.py`.

## Hardware voice remote (optional)

A battery-powered ESP32 button that remotely starts/stops the `rag-chat`
plugin's voice recording, for hands-free note dictation. Entirely optional —
off by default (`remoteEnabled: false`), and only relevant if you've built the
two-board hardware described in `hardware/voice-remote/PLAN.md`. Nothing here
affects a normal vault reader who doesn't have the hardware.

Flashing the two ESP32-C3 boards (requires [PlatformIO](https://platformio.org/),
e.g. `pip install platformio` or the VS Code extension — not part of this
repo's pinned toolchain, since it's only needed for this optional hardware):

```sh
cd hardware/voice-remote
cp secrets.h.example secrets.h   # fill in PMK/LMK, see PLAN.md "Provisioning"
pio run -d receiver -t upload -t monitor
pio run -d remote -t upload -t monitor
```

Both boards must always run the same `shared/protocol.h`, so reflash them as a
pair — the packet's magic tag is bumped whenever the wire layout changes, so a
half-upgraded pair refuses to talk instead of misparsing.

Rebuilding the PC-side serial bridge (only needed if you change
`hardware/voice-remote/bridge/main.go` — the prebuilt binaries under
`.obsidian/plugins/rag-chat/bin/` already ship committed, same as `main.js`):

```sh
mise install   # picks up the pinned `go` version
cd hardware/voice-remote/bridge
go test ./...  # also run by build.sh
./build.sh
```

`build.sh` builds with `-trimpath -buildvcs=false`, so the committed binaries
are byte-reproducible from the committed source.

Troubleshooting a remote that doesn't respond: the bridge now reports *why* it
can't connect. The status line under "Hardware-Fernbedienung" in the plugin
settings shows the concrete reason (no matching USB device, port could not be
opened, permission denied), and the same detail plus any bridge stderr is logged
to the developer console (Ctrl+Shift+I). If the receiver's serial line reports
`ERR stale-epoch-repair-needed`, the remote's NVS was wiped — hold the
receiver's BOOT button while resetting it to re-pair.

Full design, security model, and provisioning steps:
`hardware/voice-remote/PLAN.md`.

## Adding new scanned manual pages

Use `.pipeline/scripts/` (see `.pipeline/TRANSFORM-PLAN.md` for the full
pipeline design):

- `analyze.py` transcribes scans via OpenCode Zen. Resumable — results are
  cached per-page under `.pipeline/cache/` (gitignored, regenerable).
- `build_vault.py` and its siblings (`build_glossary.py`,
  `build_techdata.py`, `build_safety_notes.py`, `build_special_tools.py`,
  `link_torque_specs.py`, ...) assemble the resulting Markdown notes.
- `qa_vault.py` sanity-checks the output afterwards.

## Version pinning

Node.js, `uv`, Python, and Go versions are pinned via `mise.toml` and
`.python-version` to the versions this repo was last verified against. Run
`mise install` to pick them up (`dev-setup.sh` does this for you). Go is only
needed for rebuilding `hardware/voice-remote/bridge`'s prebuilt binaries.

## License

Source code in this repository (`.obsidian/plugins/*/src` and build configs,
`.pipeline/scripts/`, `.pipeline/rag/`, `scripts/`, `hardware/voice-remote/`)
is MIT-licensed — see
[`LICENSE`](LICENSE). The manual content itself (scanned pages,
transcriptions, glossary, technical data, and all vault text/images derived
from the original BMW factory manuals) is **not** covered by that license
and remains all rights reserved by the original manuals' copyright holder.
See the "Scope" note at the bottom of `LICENSE` for the exact boundary.
