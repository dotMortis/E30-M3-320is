# Plan: Transform the E30 M3 Repair Manual into a Bilingual (EN/DE) Obsidian Knowledgebase

## Goal
Convert the current English HTML scan-explorer into a **handy, fully searchable Obsidian vault**
for a German-speaking user. Each original manual page (a zoomable scan) sits **side-by-side with a
rich German translation** (description + transcription + BMW part terms), searchable in both languages.

---

## Confirmed decisions
- **Platform:** Obsidian vault (no static-site fallback)
- **Content per page:** original scan + English caption + **rich German output** (description,
  transcribed labels/steps, extracted terms) via vision AI; Tesseract OCR only as offline fallback
- **Vision model:** **GPT 5.6 Luna** via OpenCode Zen (`opencode/gpt-5.6-luna`),
  est. **~$1.50** total for all 1243 pages
- **Execution:** standalone Python script calling the Zen API (`https://opencode.ai/zen/v1`),
  with batching + resume
- **Images:** copied into the vault (self-contained ~800 MB handoff)
- **Zoom:** dedicated zoom/pan viewer (Obsidian "Image Toolkit" community plugin, pre-configured)

---

## Repository facts (from exploration)
- 1243 JPGs (~402 MB), ~1200px wide, across ~30 BMW sections
- `index-all.html` holds ~1065 English captions in `<i>` tags, each mapped to an image path (main data source)
- Per-section `index.html` files hold captions too (catch the ~178 images missing from index-all)
- `M3-techspec.html` / `320is-techspec.html` = spec tables
- Tooling present: Python 3.14, Node 26, ImageMagick, jq. **Tesseract NOT installed** (only needed for offline fallback)

---

## Phase 0 — Setup & safety
- Create working branch (`bilingual-obsidian-kb`); build vault additively into `vault/` (originals untouched)
- Add `.gitignore` for the API key file and generated caches
- Document `ZEN_API_KEY` handling (env var; never hardcoded/committed)

## Phase 1 — Extract structured data → `manifest.json`
- Python parser for `index-all.html` + each `SECTION/index.html`:
  - one record per image: `{section_no, section_title_en, image_path, page_id, caption_en}`
  - reconcile duplicates; flag images with no caption
- Parse tech-spec tables into structured records
- Output `manifest.json` — the backbone driving all later steps

## Phase 2 — Vision analysis (GPT 5.6 Luna via Zen)
- Standalone script `scripts/analyze.py`:
  - reads `manifest.json`, sends each image to `opencode.ai/zen/v1` with a structured German prompt
  - requests **structured JSON output** per page:
    - `beschreibung` (German description)
    - `transkription` (labels/steps)
    - `begriffe` (EN→DE term pairs)
    - `seitentyp` (diagram/table/text)
    - `konfidenz`
  - **resume support**: writes each result to `cache/<page_id>.json`; reruns skip completed pages (protects spend)
  - concurrency limit + retry/backoff; running **cost + token log**
- Merge results back into `manifest.json`
- Tesseract path documented as offline fallback (requires installing `tesseract-ocr` + `deu`/`eng` packs)

## Phase 3 — Translation consistency pass
- Build a **BMW/automotive glossary** (EN→DE): Brakes→Bremsen, Camshaft→Nockenwelle, Torque→Drehmoment, etc.
- Normalize section titles → German
- Consistency pass over captions/terms against glossary (correct drift)

## Phase 4 — Generate the Obsidian vault
- Generator `scripts/build_vault.py` reads `manifest.json` and produces:
  - **Page notes** `vault/<section>/<page_id>.md`: YAML frontmatter (tags: `sektion/<nr>`, `seite`, `typ`)
    + embedded original scan + EN caption + German description + collapsible transcription + term table
  - **Section MOCs** with German titles + page list
  - **Home note** `vault/Startseite.md`: German landing page → all sections, tech specs, glossary
  - **Glossary note** (bilingual)
- Copy original JPGs into `vault/_attachments/` (full resolution preserved for zoom)
- Configure `.obsidian/`: enable core Search, set attachment folder

## Phase 5 — Dedicated zoom/pan viewer
- Pre-configure **Image Toolkit** community plugin in `.obsidian/` (click-to-zoom, pinch, drag-pan)
  for detailed diagram inspection
- Verify large scans pan smoothly at full resolution
- German install note for the uncle in case the plugin needs enabling

## Phase 6 — Bilingual side-by-side layout & UX
- Page template: original scan on top, German beneath; EN caption shown for reference
- German callouts ("Originalseite oben, Übersetzung unten")
- Tag convention so DE-only filtering/search works

## Phase 7 — QA & delivery
- Verify: DE search terms resolve; all MOC links + image embeds work; no broken pages
- Validate translation sample against glossary; review low-`konfidenz` pages
- Write **German README** (`vault/LIESMICH.md`): install Obsidian, open vault, search, zoom
- Summarize actual API spend from the cost log

---

## Deliverables
- `manifest.json` — structured bilingual data
- `scripts/` — parser, vision analyzer (Zen), glossary pass, vault generator (all re-runnable, resumable)
- `vault/` — self-contained Obsidian knowledgebase (scans + German + zoom)
- German glossary + German README
- `TRANSFORM-PLAN.md` — this plan

## Cost & risk notes
- **Est. ~$1.50** on GPT 5.6 Luna for all pages; resume/cache prevents double-spend
- If dense wiring diagrams transcribe weakly, selectively re-run those on Gemini 3.5 Flash Lite (few cents)
- OCR/vision on 1989 scans is imperfect → German text is for **searchability/context**;
  the **original scan remains authoritative** (stated in each note)

---

## Model reference (OpenCode Zen)
| Model | Model ID | Input $/1M | Output $/1M | Role |
|---|---|---|---|---|
| GPT 5.6 Luna | `opencode/gpt-5.6-luna` | 0.20 | 1.20 | Primary vision analysis |
| Gemini 3.5 Flash Lite | `opencode/gemini-3.5-flash-lite` | 0.30 | 2.50 | Fallback for dense diagrams |

Endpoint: `https://opencode.ai/zen/v1` — auth via `ZEN_API_KEY` env var.
