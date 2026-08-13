# Plan: Offline-First RAG System for the E30 M3 320is Knowledgebase

## Goal
Add a **local, offline-first Retrieval-Augmented-Generation (RAG) chat** over the existing
bilingual Obsidian vault. A German-speaking mechanic asks a question ("Anzugsdrehmoment
Zylinderkopf?", "welches Spezialwerkzeug für den Radialwellendichtring?", "das silberne
Blech hinter dem Ansaugkrümmer") and gets a grounded answer that **cites the exact manual
page(s)** and links back to the note + scan.

The corpus is **static** (a finished manual), so the expensive work — chunking + embedding —
runs **once, offline**, and the resulting search index is **committed to the repo**. Only the
final LLM answer call needs the network at query time.

---

## Confirmed decisions
- **Runtime split:** offline **Python indexer** (under `.pipeline/`) builds the index; an
  **Obsidian plugin** (`rag-chat`) loads it and runs hybrid retrieval + chat inside Obsidian.
- **Vector DB:** **Orama** (`@orama/orama`) — 100% TypeScript, zero external services, runs
  natively in Obsidian, supports **hybrid search** (BM25 keyword + vector). Chosen for the
  "E30 advantage": exact alphanumeric part/torque codes (`11121312173`, `S14B23`) are matched
  by BM25 while vague visual descriptions are matched by vectors, merged into one result set.
- **Embedding model:** **`gemini-embedding-2`** — natively multimodal (text + image in the
  same vector space), 3072-dim default (Matryoshka-truncatable), 8192 input tokens,
  ≤ 6 images/request. **CORRECTED (verified against live docs, Aug 2026):**
  `gemini-embedding-2` does **not** support the `task_type` parameter via `EmbedContentConfig`
  — that only exists on the older `gemini-embedding-001`. Task steering for `gemini-embedding-2`
  is done via a **text prefix baked into the input string**: documents use
  `"title: {title} | text: {content}"`, queries use `"task: search result | query: {content}"`.
  Also, `gemini-embedding-2` **aggregates every input passed in one request into a single
  vector** (unlike `-001`, which returns one vector per string) — so each text chunk **must be
  its own API call**; never pass multiple distinct chunks as separate strings in one request's
  `contents` list, or they will collapse into one incorrect merged vector. (This aggregation
  behavior is exactly what we *want* for the multimodal note vector: image + description
  interleaved in one request on purpose, to get one combined vector.)
- **Generation model:** **`gemini-3.6-flash`** — 1M-token context, multimodal, strong
  instruction following. NOTE: `temperature`/`top_p`/`top_k` are **deprecated** on 3.x Flash;
  we **do not set them** and steer determinism via the system prompt instead.
- **Embedding dimensions:** **3072** (max quality; safest for exact-spec recall). **Verified via
  `chunk.py` run on the full vault: 2,822 vectors total** (1,569 text chunks + 1,253 multimodal
  note vectors, from 1,253 page notes — 42 non-page notes like `Startseite.md`/`Glossar*.md`
  correctly excluded), storage is trivial.
- **Multimodality:** **one interleaved (scan image + German description) vector per note**,
  plus per-chunk text vectors. Enables cross-modal "text query → diagram" retrieval without the
  cost/complexity of embedding every image standalone.
- **Index shipping:** the prebuilt Orama index **is committed to the repo** (offline-first,
  self-contained handoff), inside the plugin folder.
- **Plugin build tool:** **Vite** (library mode, CommonJS output → `main.js`).
- **Two-provider split** (see the Provider/auth matrix below):
  - *Embeddings* (`gemini-embedding-2`) are **hard-wired to Google `GEMINI_API_KEY`** — OpenCode
    Zen offers **no** embedding model (verified against the live Zen model list).
  - *Generation* (`gemini-3.6-flash`) defaults to **OpenCode Zen `OPENCODE_API_KEY`** everywhere
    (dev + shipped), switchable to Google in plugin settings.
- **API key handling:**
  - *Build time (indexer):* `.env` at repo root (gitignored) already holds **both**
    `GEMINI_API_KEY` and `OPENCODE_API_KEY` (verified). Embeddings use the Google key;
    generation smoke tests use the Zen key.
  - *Query time (chat):* keys + provider choice stored in the plugin's Obsidian settings
    (`data.json`) — the "better key solution via Obsidian". `.env` is **not** shipped.
- **Embedding budget:** a small paid budget is provisioned on the Google key, so the one-time
  embedding build runs at **paid Tier-1** limits and completes in a single pass (no free-tier
  throttling to manage). Est. one-time cost **well under ~$1–2**.

---

## Provider / auth matrix
Two providers, one clean split. Verified against the live OpenCode Zen model list
(`https://opencode.ai/zen/v1/models`) and docs: Zen exposes **generation models only** — it has
**no embedding endpoint**, so embeddings must go to Google directly.

| Task | Model | Dev / testing | Shipped default | Switchable? |
| --- | --- | --- | --- | --- |
| Embeddings (index + query) | `gemini-embedding-2` (3072-d) | Google `GEMINI_API_KEY` | Google `GEMINI_API_KEY` | **No** (Zen has none) |
| Generation (chat answer) | `gemini-3.6-flash` | **Zen `OPENCODE_API_KEY`** | **Zen `OPENCODE_API_KEY`** | **Yes** → Google |

**Endpoints & request shapes**
- **Google embeddings** — `google-genai` SDK. `gemini-embedding-2` takes task steering via a
  **text prefix**, not `EmbedContentConfig.task_type` (that param is `-001`-only):
  `client.models.embed_content(model="gemini-embedding-2",
   contents=["title: {title} | text: {content}"] (doc) | ["task: search result | query: {q}"] (query),
   config=EmbedContentConfig(output_dimensionality=3072))`. One chunk per call (see aggregation
  note above). Auth: `GEMINI_API_KEY`.
- **Zen generation** — Google `generateContent` shape via the Zen gateway:
  `POST https://opencode.ai/zen/v1/models/gemini-3.6-flash:generateContent`
  (or `:streamGenerateContent` for streaming). Auth header `x-goog-api-key: $OPENCODE_API_KEY`,
  plus a browser-like `User-Agent` (Cloudflare requirement — same as existing `analyze.py`).
- **Google generation** (switchable prod path) — same `generateContent` shape on
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash`, auth `GEMINI_API_KEY`.

**Why this split**
- Zen generation keeps the Google **generation** free-tier/budget untouched; the Google key is
  spent only on the one-time embedding build.
- Shipping Zen-by-default means chat "just works" with the key already used across this repo,
  while power users can point generation at their own Google key in settings.

**Free-tier / budget note**
- The Google key now has a small **paid budget**, so embedding runs at Tier-1 limits and finishes
  in one pass. Free-tier throttling is therefore a non-issue; the `embeddings-cache/` resume + 429
  backoff remain purely as defensive nets. If a spend/RPM ceiling is ever hit, the build pauses
  and resumes from cache with no lost work.

---

## Config constants (single source of truth)
Mirrored in the Python indexer (`build_rag_index.py`) and the plugin (`settings.ts` defaults):
```
EMBEDDING_MODEL   = "gemini-embedding-2"     # Google only
EMBEDDING_DIMS    = 3072       # cache/API fidelity (embeddings-cache/, gitignored, local only)
SHIPPED_INDEX_DIMS = 768       # Orama index + query-time dims (see "Shipped index dims" below)
# NOTE: gemini-embedding-2 has NO task_type EmbedContentConfig param (that's -001-only).
# Task steering is a text prefix baked into the input string instead:
DOC_PREFIX_TMPL   = "title: {title} | text: {content}"        # indexing (parent-note title + chunk)
QUERY_PREFIX_TMPL = "task: search result | query: {content}"  # query time
GENERATION_MODEL  = "gemini-3.6-flash"       # Zen default; Google switchable
GEN_PROVIDER      = "zen" | "google"         # default "zen"
ZEN_GEN_ENDPOINT  = "https://opencode.ai/zen/v1/models/gemini-3.6-flash"
GOOGLE_GEN_BASE   = "https://generativelanguage.googleapis.com/v1beta/models"
TOP_K             = 8
SIMILARITY        = 0.55  # CORRECTED (see settings.ts): 0.75 empirically returned ZERO vector
                          # candidates on real colloquial queries, silently disabling the vector leg
CHUNK_TOKENS      = 800
CHUNK_OVERLAP     = 100
```
`gemini-3.6-flash` sampling params (`temperature`/`top_p`/`top_k`) are **deprecated** and are
**never sent**; determinism is steered by the system prompt.

**Shipped index dims — CRITICAL, discovered during Phase 3 build (verified against the real repo
remote: `github.com/dotMortis/E30-M3-320is`):** GitHub hard-blocks any pushed file over **100MB**.
A binary Orama index built at the full **3072** dims came out to **164.7MB** — would fail to push.
Since `gemini-embedding-2` uses Matryoshka Representation Learning, the already-cached 3072-dim
vectors can be **truncated to the first N floats + L2-renormalized, with no re-embedding and no
extra API cost**, to shrink the shipped index. Measured on the real corpus (2,822 rows, full
schema): 1536 dims → 90.3MB (too close to the 100MB ceiling for comfort), **768 dims → 53.1MB**
(safe margin, and 768 is one of Google's three explicitly "recommended" dimensionalities — "little
quality loss" per their docs). **Decision: cache at 3072 (max fidelity, local-only/gitignored,
repo size irrelevant), truncate+renormalize to 768 only when building the shipped
`rag-index.orama.msp`.** Query-time embeddings in the plugin should simply request
`output_dimensionality: 768` directly from the API (the API does the truncation+renormalization
server-side) — no truncation logic needed in the TypeScript plugin. `rag-manifest.json` records
`embeddingDims: 768` (the shipped/query dims), which is what the plugin validates against, not the
cache's 3072.

---

## Repository facts (from exploration)
- Repo root **is** the Obsidian vault. **1,295 markdown notes + 1,243 scans** (`.jpg`, verified
  count), grouped into German BMW-section folders (`11 - Motor`, `34 - Bremsen`, …). Total note
  text ≈ 4.6 MB.
- Each note has YAML frontmatter (`titel`, `seitencode`, `sektion_nr`, `sektion`, `titel_en`,
  `seitentyp`, `konfidenz`, `bilddatei`, `tags`) plus body sections in order: title, info callout,
  scan embed, `*Originaltitel (EN)*`, **Beschreibung**, **Transkription**,
  **Fachbegriffe (EN → DE)** (near-universal: 1,253/1,295 pages), optional **Anzugsdrehmomente**
  (188/1,295 pages — a `[!tip]` callout + bullet list of **wikilinks** to dedicated torque-spec
  pages, e.g. `- [[11-10 — Anzugsdrehmomente Zylinderkopfhaube ...]]`; **not** inline torque
  values), optional **Verwandte Seiten** (828/1,295 pages — auto-linked related notes), footer nav
  links. Actual torque *numbers* appear as inline prose inside `## Transkription`
  (e.g. "Anzugsdrehmoment: 20 Nm") on the pages that describe a torque-relevant procedure, while
  dedicated tabular torque-spec pages live under `BMW N 600 02.0 - Anzugsdrehmomente/` (see the
  `seitencode`-collision note below — that folder's subpages reuse codes like `00-01`, `23-01`
  from the main section folders, disambiguated only by `sektion`). `chunk.py` should parse
  Beschreibung + Transkription + Fachbegriffe always, and include the Anzugsdrehmomente
  wikilink-list (resolved to target note titles/paths, not raw `[[...]]` syntax) and Verwandte
  Seiten in `parent_note_text` when present, since they're useful cross-reference context for the
  LLM even though they're skipped for the embedding input (per Phase 1's embed-input stripping
  rule).
- Existing offline pipeline under `.pipeline/scripts/` (`build_vault.py`, `build_techdata.py`, …)
  with a resumable `.pipeline/cache/` (1,248 page-analysis JSONs). This RAG work mirrors that
  pattern (resumable cache, budget awareness, `.env` key).
- Existing custom plugins ship as pre-compiled `main.js` (`vault-search`, `websearch`) under
  `.obsidian/plugins/`. `rag-chat` follows the same install layout.
- Tooling: Node v26, Python 3.14, git. `.gitignore` already ignores `.env`, `.pipeline/cache/`,
  `__pycache__`, `.venv`.

---

## Target file layout
```
.pipeline/
  rag/
    PLAN.md                      # this document
    build_rag_index.py           # NEW  orchestrator: parse → chunk → embed → emit chunks.json
    chunk.py                     # NEW  note parsing + token-aware chunking (parent-note map)
    embed_gemini.py              # NEW  gemini-embedding-2 client (text + multimodal), cached, Google key
    gen_client.py                # NEW  gemini-3.6-flash caller (Zen default / Google switchable)
    qa_rag.py                    # NEW  offline retrieval sanity checks (tiny query-embed cost only)
    test_generate.py             # NEW  end-to-end generation smoke test (Zen key)
    requirements.txt             # NEW  google-genai, python-frontmatter, tiktoken (or heuristic)
    embeddings-cache/            # NEW  resumable per-item vector cache (GITIGNORED)
    build/                       # NEW  (build/*.json GITIGNORED - regenerable, ~100MB+; scripts tracked)
      package.json                #      @orama/orama, @orama/plugin-data-persistence, @orama/stemmers
      chunks.json                 #      indexer output: rows + 3072-dim vectors (GITIGNORED)
      pre_embed.json              #      chunk.py output, pre-embedding (GITIGNORED)
      orama_schema.mjs            #      NEW  shared schema + German tokenizer config + loadIndex() helper
      build_orama.mjs             #      NEW  Node: read chunks.json → truncate to 768d → Orama → binary persist
      orama_search.mjs            #      NEW  CLI search helper (qa_rag.py shells out to this; Python can't
                                   #           read Orama's binary format)

.obsidian/plugins/rag-chat/      # NEW  the plugin (shipped)
  manifest.json                  #      id/name/version/minAppVersion/isDesktopOnly:true
  main.js                        #      Vite build output (committed)
  styles.css                     #      chat panel styling
  rag-index.orama.msp            #      prebuilt Orama binary index (committed, offline-first)
  rag-manifest.json              #      model ids, dims, chunk→note map, corpus hash, counts

# Plugin source (compiled to main.js by Vite; kept under the plugin dir or .pipeline)
.obsidian/plugins/rag-chat/src/
  main.ts                        #      plugin entry: load index, register view + command
  view.ts                        #      right-sidebar chat view (ItemView)
  retriever.ts                   #      embed query + Orama hybrid search + parent-note expansion
  gemini.ts                      #      gemini-embedding-2 (query) + gemini-3.6-flash (chat, stream)
  settings.ts                    #      API key, model ids, topK, similarity, dims
  package.json  tsconfig.json  vite.config.ts
```

---

## Phase 0 — Setup & safety
- Work on a branch (e.g. `rag-system`).
- Add to `.gitignore`: `.pipeline/rag/embeddings-cache/`, `.obsidian/plugins/rag-chat/node_modules/`.
- Confirm `GEMINI_API_KEY` loads from `.env` (never printed, never committed).
- `pip install -r .pipeline/rag/requirements.txt` into the existing `.venv`.

## Phase 1 — Chunking (`chunk.py`)
Follows the research guidance: **500–1,000 token chunks** for precise vector hits, but retrieval
uses the **"Parent Note" pattern** — the whole note is fed to the LLM, not a truncated snippet,
so surrounding torque specs / part lists are never severed.

- **Unit = one note.** Parse frontmatter + body with `python-frontmatter`.
- Build a canonical, LLM-facing note text (`parent_note_text`) keyed by `notePath` (unique;
  `seitencode` is not — see collision note above): title + Beschreibung + Transkription +
  Fachbegriffe table + Anzugsdrehmomente wikilinks (resolved, when present) + Verwandte Seiten
  (when present). Strip Obsidian embed syntax and footer nav for the embedding input, but keep it
  in the parent text for the LLM.
- **Chunking:** target ~800 tokens, ~100-token overlap. Token count via `tiktoken` if available,
  else a chars/4 heuristic (embedding cap is 8192 tokens, so chunks are always safe).
  Prefer to split on section/paragraph boundaries; never cut a Transkription line mid-sentence.
- Each chunk row records parent metadata: `seitencode`, `sektion_nr`, `sektion`, `titel`,
  `bilddatei`, `notePath` (vault-relative), `tags`, `chunkIndex`, `kind:"text"`.
- **CORRECTED (verified against the live vault):** `seitencode` is **not globally unique** — 47
  codes collide across the corpus (1,253 `seitencode` occurrences, only 1,200 unique values). The
  collisions are systematic: the `BMW N 600 02.0 - Anzugsdrehmomente/` folder contains subfolders
  (e.g. `... (00-0xx)`, `... (23-0xx)`, `... (25-0xx)`, `... (26-0xx)`) whose pages reuse the same
  `00-01`, `00-02`, `23-01`, … codes as pages in the corresponding main section folders, but with a
  different `sektion` (e.g. `sektion: "BMW N 600 02.0 - Anzugsdrehmomente"` vs `sektion: "Wartung
  und allgemeine Daten"`). **The parent-note map, all dedup logic, and all identity joins must key
  on `notePath` (the unique vault-relative file path)** — never on `seitencode` alone.
  `seitencode` + `sektion` remain useful as a **display pair** for citations (e.g. "`00-01`
  (BMW N 600 02.0 - Anzugsdrehmomente)"), since together they do disambiguate in practice.
- Emit the `parent_note_text` map keyed by `notePath` (loaded lazily by the plugin from the
  vault at query time via `vault.read`, so the shipped index stays small).

## Phase 2 — Embedding (`embed_gemini.py`)
- SDK: `google-genai`. Key = `GEMINI_API_KEY` from `.env` (Google only — Zen has no embeddings).
  Model `gemini-embedding-2`, `output_dimensionality=3072`.
- **Text chunks:** one API call **per chunk** (never batch distinct chunks into one request —
  `gemini-embedding-2` aggregates all inputs of a single request into one vector). Input string =
  `DOC_PREFIX_TMPL.format(title=parent_titel, content=chunk_text)`. One vector per chunk.
- **Multimodal note vector:** per note, one request interleaving the scan (`inlineData`, base64
  PNG/JPEG) **+** the German Beschreibung text → the model's aggregation behavior gives exactly the
  single combined 3072-d vector we want, `kind:"multimodal"`. No `task_type` param is sent (not
  supported on this model); the Beschreibung text still gets the `DOC_PREFIX_TMPL` treatment. One
  image ≤ the 6-image limit; no batching hazard.
- **Throughput:** runs at **paid Tier-1** (budget provisioned), so the whole build (~2.5k calls)
  finishes in one pass. Modest concurrency cap (4–8 parallel) for stability/politeness; exponential
  backoff on HTTP 429 as a defensive net (not expected to trigger).
- **Resumable cache:** key = sha256(model + dims + prefix-template-id + (text | image-bytes-hash));
  value = vector JSON in `embeddings-cache/`. Reruns are free; only new/changed items call the API;
  a mid-build interruption loses no work.
- **Pilot mode:** `--pilot N` embeds only the first N items (chunks + multimodal rows), prints
  token/cost accounting, and exits — used as a spend checkpoint before the full run.
- **Cost/observability:** the plain Gemini Developer API (`GEMINI_API_KEY`, not
  Vertex/Enterprise) does **not** return usage/token metadata on embedding responses (that field
  is Enterprise-platform-only) — cost is estimated **client-side** from our own tokenizer (the
  same `count_tokens` heuristic as `chunk.py`) using confirmed live pricing: text $0.20/1M tokens,
  images $0.45/1M tokens (≈258 tokens/image ⇒ ~$0.000116/image). Running total logged to
  `embeddings-cache/cost_log.json` (mirrors `analyze.py`'s pattern). Est. one-time cost
  **well under ~$1–2** (~1,569 text chunks × ~a few hundred tokens each + 1,253 images).
 - Output `build/chunks.json`: `{ model, dims:3072, docPrefixTemplate, corpusHash,
   rows:[{...,embedding:[…3072 floats…]}] }` (full-fidelity cache; NOT shipped/committed — see
   Phase 3 for the dimensionality reduction applied only at Orama-build time).

## Phase 3 — Build the Orama index (`build/build_orama.mjs`, Node)
- **Verified live against `@orama/orama` 3.1.18 + `@orama/plugin-data-persistence` 3.1.18:**
  `create`/`insertMultiple`/`search` are async (`await`); file persistence is
  `persistToFile`/`restoreFromFile` from the `/server` subpath; enum `where` filters need
  `{ field: { eq: value } }`, not a bare value; extra fields not in the schema (e.g. `chunkIndex`)
  still ride along on each stored document even though they aren't indexed for search.
- **Dimensionality reduction (see "Shipped index dims" above):** truncate each cached 3072-dim
  vector to the first **768** floats and L2-renormalize before inserting — required to stay under
  GitHub's 100MB file limit (3072 dims measured at 164.7MB; 768 dims measured at 53.1MB, full
  schema, real corpus). No re-embedding, no extra API cost.
- Schema:
  ```js
  {
    seitencode: 'string', sektionNr: 'string', sektion: 'string',
    titel: 'string', tags: 'string[]', notePath: 'string', bilddatei: 'string',
    kind: 'enum',                 // 'text' | 'multimodal'
    text: 'string',               // chunk text (or note description) → BM25
    embedding: 'vector[768]'      // truncated + renormalized from the cached 3072-dim vector
  }
  ```
- `insertMultiple` all rows (text-chunk vectors + one multimodal row per note).
- Persist with `@orama/plugin-data-persistence/server`'s `persistToFile(db, 'binary', path)` →
  `.obsidian/plugins/rag-chat/rag-index.orama.msp`. **Binary beats `json` persistence** (measured:
  164.7MB binary vs 299.6MB json at 3072 dims, same data) — binary is the only format to use.
- **CRITICAL — German tokenizer required (discovered via `qa_rag.py`):** Orama's default
  tokenizer is English and does prefix matching, so a bare query term like `"hinter"` (the German
  preposition "behind") spuriously matched every `"Hinterachse..."` (rear axle) page, badly
  polluting BM25/hybrid ranking for natural-language German queries — a real bug, verified and
  reproduced on the live index, not a theoretical concern. Fix: `@orama/stemmers` ships a German
  stemmer/language pair (no bundled German stopwords, though) — configure
  `components: { tokenizer: { stemming: true, stemmer, language, stopWords: GERMAN_STOPWORDS } }`
  at `create()` time, with a hand-curated German stopword list (articles, prepositions,
  conjunctions, common auxiliary verbs — see `build/orama_schema.mjs`).
- **CRITICAL — custom tokenizers do not survive `restoreFromFile`:** verified live — a bare
  `restoreFromFile('binary', path)` **silently reverts to the default English tokenizer**
  (stemmer functions and stopword lists aren't serializable, so Orama's internal `restore()`
  builds a placeholder db with default components, then `load()`s only the index *data* into it).
  The correct restore pattern, used by both `orama_search.mjs` and the plugin's `retriever.ts`:
  ```js
  const placeholder = await restoreFromFile('binary', path, 'node')
  const exported = await save(placeholder)              // re-export as plain data
  const db = await create({ schema, components: { tokenizer } })  // correct config
  await load(db, exported)                                // hydrate into it
  ```
  Schema + tokenizer config are centralized in `build/orama_schema.mjs` (a `loadIndex(path)`
  helper implementing this pattern) so `build_orama.mjs`, `orama_search.mjs`, and the plugin all
  share byte-identical config — this MUST be ported to `retriever.ts` in Phase 4, not
  reimplemented from scratch.
- Write `rag-manifest.json`: `embeddingModel`, `embeddingDims: 768` (the shipped/query dims, not
  the cache's 3072), `docPrefixTemplate`, `queryPrefixTemplate`, generation model, counts,
  `corpusHash` (for staleness detection), build timestamp.

## Phase 4 — Obsidian plugin `rag-chat` (Vite → `main.js`)
- **Build:** Vite library mode — `build.lib.entry = src/main.ts`, `formats: ['cjs']`,
  `fileName: 'main'`; externalize `obsidian`, `electron`, Node builtins, CodeMirror packages;
  bundle `@orama/*` in. Output `main.js` beside `manifest.json`. `npm run build` = `vite build`.
- **On load:** `restoreFromFile('binary', <pluginDir>/rag-index.orama.msp, 'node')` — instant,
  offline (pass the explicit `'node'` runtime hint; Electron's runtime auto-detection can be
  unreliable). Validate `rag-manifest.json` dims/model against settings; warn if the index is
  stale.
- **Chat view** (right sidebar `ItemView` + command "RAG: Frage stellen"):
  1. Embed the question with `gemini-embedding-2`, **`output_dimensionality: 768`** (matching the
     shipped index's truncated dims — see "Shipped index dims" above; request 768 directly from
     the API rather than truncating client-side), input string built from `QUERY_PREFIX_TMPL` (no
     `task_type` param — not supported on this model).
  2. `search(db,{ mode:'hybrid', term, vector:{value,property:'embedding'}, similarity, limit })`
     → top **5–10** hits (configurable).
  3. **Parent-note expansion:** dedupe hits by `notePath` (unique; `seitencode` alone is **not**
     unique — see Phase 1 correction); `vault.read` each source note in full; assemble `<context>`
     blocks, each labelled with the note file name + `seitencode` + `sektion` (that pair
     disambiguates the 47 known `seitencode` collisions).
  4. Call the **generation provider** (default **Zen** `gemini-3.6-flash`; switchable to Google)
     with the pinned system instruction (see below). No temperature/top_p (deprecated).
     **Stream** the answer into the panel.
  5. Render **clickable citations** that open the cited note (and its embedded scan) in Obsidian.
- **Settings tab:**
  - `OPENCODE_API_KEY` (Zen — used for generation by default)
  - `GEMINI_API_KEY` (Google — **required** for query embeddings; also used if generation provider
    is switched to Google)
  - `GEN_PROVIDER` toggle: `zen` (default) | `google`
  - embedding model id, generation model id, `output_dim` (default **768** — must match the
    shipped index's truncated dims, not the 3072 cache dims), `topK`, `similarity`
  - All persisted in Obsidian `data.json`; embedding always routes to Google regardless of toggle.

### System prompt (superseded — kept for history, see "Phase 6" below)
Derived from the research (grounding via `<context>`/`<question>`, image #3 §4). German output:
```
Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.
Beantworte die Frage AUSSCHLIESSLICH anhand der Informationen im <context>.
- Fehlt eine genaue Teilenummer oder ein Spezifikationswert im Kontext, sage das
  ausdrücklich ("Diese Information ist im Kontext nicht enthalten.").
- Nutze KEIN Allgemeinwissen, außer der Nutzer verlangt es ausdrücklich.
- Nenne den Dateinamen (Seitencode) der Quelle bei technischen Angaben.
Antworte auf Deutsch.
```
Context assembly: `<context>` = full parent notes (dedup by `notePath`), each block tagged with
its note filename + `seitencode` + `sektion` (disambiguates the known `seitencode` collisions);
`<question>` = the user query.

**Superseded (Aug 2026):** this prompt forced strict "context-only" answers and, combined with
the original workflow's hidden early-return on empty retrieval (see workflow.ts's git history),
meant the model never extended an answer with its own knowledge or live web results even when
explicitly asked to — see "Phase 6" below for the replacement design (extend-with-knowledge +
web search + bounded agent loop) and its exact current prompt text in `src/gemini.ts`.

## Phase 6 — Agentic extend-with-knowledge upgrade (Aug 2026)

Motivation: the strict context-only prompt above was *too* conservative for general use — it
refused to add general knowledge or look anything up on the web even when the manual didn't
cover a question, and the workflow didn't even call the LLM at all when retrieval came back
empty (a hardcoded "not found" message was shown instead). This phase replaces that with a
system that always extends manual answers with clearly labeled general knowledge and live web
search, and gives the model its own tools to decide when the initial retrieval isn't enough.

**Answer structure** (see `src/gemini.ts`'s current `SYSTEM_PROMPT` for the exact text):
1. **Aus dem Werkstatthandbuch** — strictly grounded in retrieved `<context>`, cited by
   Seitencode; numeric specs (torque, part numbers) may ONLY be stated here if they're literally
   present in a retrieved page.
2. **Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert)** — always
   populated, even when section 1 already answers the question; sourced from the model's own
   knowledge and from Gemini's native Google Search grounding tool (`tools: [{google_search:{}}]`
   on every `generateContent` call). Explicitly flagged as unverified against the factory manual,
   with manual values taking precedence for safety-relevant numbers.

**Bounded agent loop** (`src/agent.ts`, replacing the old deterministic
`isWeak`/`widenSettings`/`rewriteQuery`/`critiqueAnswer` retry stack in `workflow.ts` entirely —
no separate forced grounding-check call remains; grounding relies on the prompt wording + the
model's own tool use):
- Tools: `search_manual(query)`, `search_manual_fuzzy(query)`, `get_manual_page(notePath,
  seitencode, sektion, titel)`, `google_search` (native), `ask_user(question)`.
- Hard cap: `settings.maxAgentRounds` (default 4) — each round is one non-streaming
  `generateContent` call; once the round budget is exhausted while the model still wants to call
  tools, one final tools-stripped call forces a plain-text answer.
- `ask_user` pauses the turn (in-memory `PendingAgentState`, not persisted across app restarts):
  the question is shown as its own chat turn, and the user's next message resumes the *same*
  loop/round budget via `resumeAgentLoop()` rather than starting an independent new turn.
- Trade-off accepted: since each tool-calling round needs to inspect the response for
  `functionCall` parts, generation is no longer token-streamed — the final answer is revealed in
  one shot (same pattern the old self-critique step already used). Live per-round status labels
  ("Runde 2/4: durchsuche Handbuch nach '…'") substitute for token-level streaming feedback.

Also removed: `enableQueryRewriteFallback`, `enableSelfCritique`, `maxRetries`,
`weakResultScoreThreshold`, `weakResultMinHits` settings (all superseded by the agent loop).
`enableFuzzySearchLeg` was repurposed from "always merge Vault Search into every query" to
"offer `search_manual_fuzzy` as a tool the model can choose to call".

## Phase 5 — QA, docs, ship

### Testing strategy
- **`qa_rag.py` — offline retrieval (no LLM/generation cost; a handful of tiny query embeddings
  only).** Python can't read Orama's binary index format, so `qa_rag.py` embeds each query via the
  real Google API (matching plugin behavior) and shells out to `build/orama_search.mjs` (Node) to
  run the actual search — the same `loadIndex()` restore pattern the plugin uses. Fixed query set
  with expected `notePath`s (unique key; not bare `seitencode`, which has 47 known collisions) in
  top-K:
  - torque query ("Anzugsdrehmoment Zylinderkopf") → `11-09 — Anzugsdrehmomente
    Zylinderkopfschrauben` (validates BM25 exact-term-match leg)
  - exact engine code ("S14 B23") → `11-100 — Motorübersicht S14 B20 B23` (validates BM25 exact
    alphanumeric-code-match leg)
  - vague visual query ("silbernes Blech hinter dem Ansaugkrümmer") → `11-33 — Anzugsdrehmomente
    Ansaugkrümmer und Schallschutzhaube` (validates the vector/multimodal leg; **this exact query
    is what surfaced the German-tokenizer bug above** — pure vector search ranked the right page
    #2 on its own, but the default English tokenizer's prefix-matching bug buried it below
    "Hinterachse" false positives until the German tokenizer fix)
  **Verified: all 3 pass on the real built index** (ranks 3, 1, 4 respectively among de-duplicated
  notes, TOP_K=8, SIMILARITY=0.75). Prints rank + score for tuning `TOP_K`/`SIMILARITY`.
- **`test_generate.py` — end-to-end generation smoke test (uses Zen `OPENCODE_API_KEY`).**
  A handful of canned questions → retrieve → generate via **Zen `gemini-3.6-flash`**; assert the
  answer cites the expected page filename and refuses when the spec is absent. Keeps LLM iteration
  off the Google budget/quota.
- **Embedding-parity guard.** Query embeddings must match the index's model + dims (**768**, the
  shipped/query dims — not the cache's 3072).
  `rag-manifest.json` records `embeddingModel`, `dims`, `corpusHash`; `qa_rag.py` and the plugin
  fail fast on any mismatch (prevents comparing incompatible vector spaces).
- **Plugin dev loop.** `vite build --watch` → reload Obsidian; use the `GEN_PROVIDER=zen` toggle so
  chat testing spends the Zen key, not the Google one.

### Docs & ship
- Update `LIESMICH.md`: how to rebuild the index, the two-provider key story (Zen for chat, Google
  for embeddings), and where keys live (build: `.env`; chat: plugin settings).
- Commit: plugin source, `main.js`, `manifest.json`, `styles.css`, `rag-index.orama.msp`,
  `rag-manifest.json`, and the indexer scripts. Do **not** commit `embeddings-cache/`,
  `.pipeline/rag/build/` (the intermediate `pre_embed.json`/`chunks.json` — raw-float JSON,
  **~118MB verified** for the full corpus; fully regenerable from `embeddings-cache/` + `chunk.py`
  in seconds, so it must never enter git history), `node_modules/`, `.env`.

---

## Data flow (summary)
```
notes + scans ──chunk.py──▶ chunks + parent-note map
        │                          │
        └──embed_gemini.py (gemini-embedding-2, 3072-d, cached · GOOGLE key)──▶ vectors
                                   │
                         build_orama.mjs ──▶ rag-index.orama.msp  (committed)
                                                     │
                              Obsidian plugin loads index (offline)
                                                     │
   user question ─▶ embed (query-prefix · GOOGLE) ─▶ Orama hybrid search ─▶ top-K chunks
                                                     │
                        dedupe → read FULL parent notes → <context>
                                                     │
        gemini-3.6-flash (stream · ZEN default / GOOGLE switchable) ─▶ answer + citations
```

## Cost & rebuild
- **One-time build:** embeddings only (~4.6 MB text + ~1,254 images) via the paid Google key,
  est. **well under ~$1–2**, fully resumable via `embeddings-cache/`. Rebuild only when notes
  change (`corpusHash` mismatch).
- **Per query:** 1 small embedding call (Google) + 1 `gemini-3.6-flash` call (Zen by default).
  Cheap; the recurring generation spend lands on the Zen key, not the Google budget.

## Open risks / notes
- `gemini-embedding-2` and `gemini-embedding-001` spaces are **incompatible** — changing the
  embedding model requires a full re-embed (guarded by `rag-manifest.json`).
- **Zen has no embedding model** (verified) — embeddings are permanently a Google-only path; only
  generation is dual-provider.
- ~~`task_type` on `gemini-embedding-2`: pass via `EmbedContentConfig`...~~ **RESOLVED (verified
  against live Google AI docs, Aug 2026):** `gemini-embedding-2` does not accept `task_type` at
  all — use the `DOC_PREFIX_TMPL` / `QUERY_PREFIX_TMPL` text prefixes exclusively. Also confirmed:
  the model aggregates multi-input requests into one vector, so chunk embedding must be one-call-
  per-chunk (see Phase 2).
- Zen generation uses the Google `generateContent` shape at
  `…/zen/v1/models/gemini-3.6-flash:generateContent` with `x-goog-api-key` + browser UA
  (Cloudflare). **RESOLVED (live-tested against the real Zen endpoint with the real
  `OPENCODE_API_KEY`, Aug 2026):** `POST …/gemini-3.6-flash:streamGenerateContent?alt=sse` returns
  HTTP 200 with standard SSE `data: {...}` chunks (each a partial `GenerateContentResponse`,
  `candidates[0].content.parts[0].text` holds the incremental text; no `[DONE]` sentinel — the
  connection just closes after the final chunk, which carries `finishReason`). Zen appends one
  extra non-standard trailing event after the model's own stream ends:
  `data: {"type":"ping","cost":"0.00179700"}` (a cost-reporting ping, no `candidates` field) — the
  SSE parser must tolerate/skip events without `candidates` rather than erroring on them.
  **CRITICAL — Obsidian's `requestUrl` helper (the usual CORS-safe HTTP path for plugins) does
  NOT expose a readable stream** (it only resolves a full `RequestUrlResponse`), so it cannot be
  used for the streaming call. Since the plugin is `isDesktopOnly: true`, Node's built-in `https`
  module (already externalized in `vite.config.ts`) is used instead for the streaming
  request/response — Node's http client isn't a browser `fetch()`, so it isn't subject to CORS at
  all. `requestUrl` is still used for the (non-streaming) query-embedding call, which doesn't need
  a stream.
- Plugin is **desktop-only** (`isDesktopOnly: true`) — reads the local index file and the vault.
- **RESOLVED (verified against the live vault):** `seitencode` is not a globally unique key (47
  collisions, e.g. `00-01` exists in both `00 - Wartung und allgemeine Daten/` and a
  `BMW N 600 02.0 - Anzugsdrehmomente/.../(00-0xx)/` subfolder with a different `sektion`). Every
  identity join, dedup step, and QA assertion in this plan uses `notePath` as the unique key;
  `seitencode` + `sektion` together are used only for human-facing citation labels.
```