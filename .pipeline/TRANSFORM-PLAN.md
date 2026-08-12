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
- **Auth:** Zen API key is stored in `.env` at the repo root as `OPENCODE_API_KEY`
  (loaded at runtime; `.env` is gitignored, never committed)
- **Cost control:** per-page cost computed from the API `usage` object
  (Luna: $0.20/1M input, $1.20/1M output); hard **budget cap of $3.00** enforced as a
  pre-call gate. On reaching the cap the run **stops cleanly and stays resumable**
  (cached pages preserved; raise cap + rerun to continue).
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
- Zen API key lives in `.env` at the repo root as `OPENCODE_API_KEY`; scripts load it via
  python-dotenv / `os.environ` at runtime. Never hardcoded or committed.

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
- **Cost tracking & budget guard:**
  - read `usage.input_tokens` / `usage.output_tokens` from each Zen response
  - `cost_page = in/1e6*0.20 + out/1e6*1.20`; accumulate into `cache/cost_log.json`
    (persisted, survives restarts by summing cached results)
  - **pre-call gate:** before each request, if
    `running_total + worst_case_page_est (~$0.002) > budget` → stop cleanly, do **not** send,
    print pages-done / spend / pages-remaining
  - per-page log: `page_id, in_tokens, out_tokens, cost, cumulative_cost`
  - `--budget` CLI flag (**default $3.00**) so the cap is adjustable without code edits
  - final run summary prints total tokens + total USD spent (feeds Phase 7 spend summary)
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
- **Est. ~$1.50** on GPT 5.6 Luna for all pages; hard **$3.00 cap** guarantees spend can't
  exceed budget (worst-case overshoot is one page, ~$0.002); resume/cache prevents double-spend
- If dense wiring diagrams transcribe weakly, selectively re-run those on Gemini 3.5 Flash Lite (few cents)
- OCR/vision on 1989 scans is imperfect → German text is for **searchability/context**;
  the **original scan remains authoritative** (stated in each note)

---

## Model reference (OpenCode Zen)
| Model | Model ID | Input $/1M | Output $/1M | Role |
|---|---|---|---|---|
| GPT 5.6 Luna | `gpt-5.6-luna` | 0.20 | 1.20 | Primary vision analysis |
| Gemini 3.5 Flash Lite | `gemini-3.5-flash-lite` | 0.30 | 2.50 | Fallback for dense diagrams |

Endpoint: `https://opencode.ai/zen/v1` — auth via `OPENCODE_API_KEY` (stored in `.env` at repo root).

---

## EXECUTION NOTES (verified against the live Zen gateway)
Corrections discovered during pre-flight and execution — authoritative for re-runs:
- **Vision endpoint is `/v1/responses` (Responses API), NOT `/v1/chat/completions`.**
  Chat-completions silently drops image input on this gateway (empty message, no usage).
- **Model IDs are bare** (`gpt-5.6-luna`), *without* the `opencode/` prefix (prefix → "not supported").
- **Request shape:** `input:[{role:user, content:[{type:input_text,text},{type:input_image,image_url:"data:image/jpeg;base64,..."}]}]`.
- **Response text:** read `output[-1].content[0].text` (top-level `output_text` is null).
- **Usage fields:** `usage.input_tokens` / `usage.output_tokens` (matches cost formula). Prompt caching is active and lowers real spend.
- **Cloudflare:** requests must send a browser-like `User-Agent`; Python's default urllib UA gets a 403 (code 1010). `analyze.py` sets one.
- **Manifest parsing:** image paths live in `<a href>` (not `src`); `page_id` includes the folder slug because section numbers repeat (`41 - Body` vs `41 - Body (Convertibles)`, `00 - Maintenance` vs `00 - Torque Specs`).
- **Vault attachments:** image basenames collide across sections (46 collisions), so scans are copied to `_attachments/` under their unique `page_id` filename, not the raw basename.

## FINAL ARCHITECTURE (v2 — clean German vault)
The vault was restructured into a single clean, German, self-contained Obsidian vault.
- **Repo root = Obsidian vault.** Each section is a German-named folder holding BOTH the
  original scans and their notes, co-located. Large sections (>60 pages) are sub-grouped by
  BMW code band into topic sub-folders.
- **Descriptive filenames:** `<BMW-Code> — <deutscher Titel>.md` (em-dash), e.g.
  `34-01 — Betriebsbremse auf Bremsenprüfstand … durchführen.md`. Stems are globally unique,
  so notes cross-link by bare `[[stem]]`. Scans keep their code name and are embedded in-folder
  (`![[34-01.jpg]]`); moved via `git mv` to preserve history.
- **German titles** produced by a dedicated text-only pass (`make_titles.py`, ~$0.37, resumable,
  budget-capped) writing `titel_de` into the manifest; ditto/blank captions resolved naturally.
- **All tooling hidden under `.pipeline/`**: `scripts/`, `manifest.json`, `glossary.json`,
  `cache/` (gitignored), and `_quellen/` (archived techspec HTML + Getrag/Torque PDFs).
- **Old web viewer deleted** (index*.html, style.css, fonts, favicon, m.png, CNAME).
- **Supplementary material kept in-vault**: `Bosch Motronic ML 3.1 (Zusatz)/` (10 PNG pages) and
  `Referenzbilder/`, each with a generated German index note.
- **No information loss:** every note retains EN caption (`titel_en`), German Beschreibung, full
  collapsible Transkription, Begriffe EN→DE table, BMW code, section, seitentyp, konfidenz.

Scripts (all under `.pipeline/scripts/`, re-runnable):
`parse_manifest.py` · `analyze.py` · `make_titles.py` · `build_glossary.py` · `build_vault.py` · `qa_vault.py`

## ACTUAL RESULTS
- **1243/1243 pages analyzed** (100%), all with valid structured JSON; every page konfidenz ≥ 0.8 (1240 at ≥ 0.9).
- **Total API spend: $2.02** (in 2,344,987 tok / out 1,295,943 tok), avg **$0.00163/page**, well under the $3.00 cap.
- Page types: 631 diagram / 357 text / 255 table. Glossary: 5,817 EN↔DE terms (94 canonical-anchored) from 16,639 extracted pairs.
- **Vault: 1243 page notes + 29 section MOCs + Startseite + Glossar + Technische-Daten + LIESMICH**, self-contained (~207 MB incl. scans). QA: 0 broken links, 0 missing embeds, DE search verified.

## Scripts (all re-runnable / resumable)
- `scripts/parse_manifest.py` → `manifest.json`
- `scripts/analyze.py` → vision analysis (`--pilot N`, `--budget`, `--merge`); cache in `cache/`
- `scripts/build_glossary.py` → `glossary.json`
- `scripts/build_vault.py` → `vault/`
- `scripts/qa_vault.py` → link/embed/search QA
