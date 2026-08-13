#!/usr/bin/env python3
"""
chunk.py — Phase 1 of the RAG indexer (see .pipeline/rag/PLAN.md).

Parses every page note in the Obsidian vault, builds a canonical LLM-facing
"parent note" text per note, and splits the embedding-relevant portion of
each note into ~800-token chunks (100-token overlap) for vector indexing.

Identity note (see PLAN.md "seitencode collision" correction): `seitencode`
is NOT globally unique across the vault (47 duplicate values — e.g. "00-01"
exists both under `00 - Wartung und allgemeine Daten/` and under a
`BMW N 600 02.0 - Anzugsdrehmomente/.../(00-0xx)/` subfolder, with a
different `sektion`). The unique key used everywhere in this pipeline is
`notePath` (the vault-relative file path). `seitencode` + `sektion` are
carried along purely as a human-facing citation label.

Output: writes build/pre_embed.json:
{
  "corpusHash": "<sha256 over all included note file contents>",
  "generatedAt": "<iso8601>",
  "noteCount": N,
  "chunkCount": M,
  "rows": [
    {kind:"text", notePath, seitencode, sektionNr, sektion, titel, bilddatei,
     tags, chunkIndex, text},
    ...
    {kind:"multimodal", notePath, seitencode, sektionNr, sektion, titel,
     bilddatei, tags, chunkIndex: null, text: <Beschreibung>, imagePath},
    ...
  ],
  "parentNoteText": { "<notePath>": "<full LLM-facing note text>", ... }
}

`parentNoteText` is a build-time convenience only (used by qa_rag.py /
test_generate.py to simulate the plugin's `vault.read` step without needing
a running Obsidian instance). It is NOT shipped — the plugin reads parent
notes live from the vault via `vault.read(notePath)`.

No network calls, no API keys needed. Safe to run repeatedly; pure function
of the vault contents.
"""

from __future__ import annotations

import argparse
import dataclasses
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import frontmatter

# --- Config constants (mirrored from PLAN.md "Config constants" table) -----
CHUNK_TOKENS = 800
CHUNK_OVERLAP = 100
EMBEDDING_MAX_INPUT_TOKENS = 8192  # gemini-embedding-2 hard cap; chunks stay far below this

# Directories to never treat as vault content when walking for notes.
EXCLUDED_DIR_NAMES = {".git", ".obsidian", ".pipeline", ".trash"}

try:
    import tiktoken

    _ENC = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text: str) -> int:
        return len(_ENC.encode(text, disallowed_special=()))
except ImportError:  # pragma: no cover - defensive fallback, see requirements.txt
    def count_tokens(text: str) -> int:
        return max(1, len(text) // 4)


WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
HEADER_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def strip_wikilinks(text: str) -> str:
    """[[Target]] -> Target ; [[Target|Alias]] -> Alias"""

    def _sub(m: re.Match) -> str:
        target, alias = m.group(1), m.group(2)
        return alias if alias else target

    return WIKILINK_RE.sub(_sub, text)


def split_sections(body: str) -> dict[str, str]:
    """Split a note body into {header_text: section_content} by '## ' headers.

    Content runs from just after a header line up to (but not including) the
    next '## ' header, or the closing '---' footer rule, or end of body.
    """
    matches = list(HEADER_RE.finditer(body))
    sections: dict[str, str] = {}
    for i, m in enumerate(matches):
        header = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        content = body[start:end]
        # Trim a trailing footer '---\n[[Startseite]] · ...' line if it leaked in
        # (only relevant for the last section).
        content = re.sub(r"\n---\s*\n\[\[Startseite\]\].*$", "", content, flags=re.DOTALL)
        sections[header] = content.strip()
    return sections


def clean_transkription(raw: str) -> str:
    """Strip the Obsidian collapsible-callout syntax from a Transkription block.

    Input looks like:
        > [!note]- Transkription (aufklappen)
        > 11-101
        >
        > some line
    Output: plain paragraphs, blank lines preserved as paragraph breaks.
    """
    lines = raw.splitlines()
    out_lines = []
    for line in lines:
        if line.strip().startswith("> [!note]-"):
            continue  # drop the callout header line
        stripped = line
        if stripped.startswith("> "):
            stripped = stripped[2:]
        elif stripped.startswith(">"):
            stripped = stripped[1:]
        out_lines.append(stripped.rstrip())
    return "\n".join(out_lines).strip()


def clean_fachbegriffe(raw: str) -> str:
    """Convert the '| Englisch | Deutsch |' markdown table into readable
    'englisch -> deutsch' lines (better BM25/embedding signal than pipe syntax).
    """
    rows = []
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) != 2:
            continue
        en, de = cells
        if en.lower() in ("englisch",) or set(en) <= {"-", " "}:
            continue  # header row / separator row
        rows.append(f"{en} -> {de}")
    if not rows:
        return ""
    return "Fachbegriffe (EN -> DE):\n" + "\n".join(rows)


def clean_wikilink_list(raw: str, prefix: str) -> str:
    """Convert a bullet list of wikilinks (optionally with a [!tip] callout
    header line) into plain readable lines, dropping the callout line.
    """
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith(">"):
            continue  # drop [!tip] callout lines
        if line.startswith("-"):
            line = line[1:].strip()
        line = strip_wikilinks(line)
        if line:
            lines.append(line)
    if not lines:
        return ""
    return f"{prefix}:\n" + "\n".join(f"- {l}" for l in lines)


@dataclasses.dataclass
class Note:
    note_path: str  # vault-relative path, e.g. "11 - Motor/11-101 — ....md"
    seitencode: str
    sektion_nr: str
    sektion: str
    titel: str
    titel_en: str
    bilddatei: str
    tags: list[str]
    image_path: str  # vault-relative path to the .jpg scan
    beschreibung: str
    transkription: str
    fachbegriffe: str  # cleaned "EN -> DE" lines
    anzugsdrehmomente: str  # cleaned wikilink list (may be empty)
    verwandte_seiten: str  # cleaned wikilink list (may be empty)
    raw_bytes_hash: str  # sha256 of the raw file bytes, for corpusHash


def parse_note(path: Path, vault_root: Path) -> Note | None:
    raw_bytes = path.read_bytes()
    try:
        post = frontmatter.loads(raw_bytes.decode("utf-8"))
    except Exception as e:  # pragma: no cover
        print(f"WARN: failed to parse frontmatter for {path}: {e}", file=sys.stderr)
        return None

    seitencode = post.get("seitencode")
    if not seitencode:
        return None  # not a page note (Startseite, Glossar, _Übersicht, ...)

    bilddatei = post.get("bilddatei", "") or ""
    note_path = str(path.relative_to(vault_root))
    image_path = str((path.parent / bilddatei).relative_to(vault_root)) if bilddatei else ""

    sections = split_sections(post.content)
    beschreibung = sections.get("Beschreibung", "").strip()
    transkription = clean_transkription(sections.get("Transkription", ""))
    fachbegriffe = clean_fachbegriffe(sections.get("Fachbegriffe (EN → DE)", ""))
    anzugsdrehmomente = clean_wikilink_list(
        sections.get("Anzugsdrehmomente", ""), "Siehe auch (Anzugsdrehmomente-Tabellen)"
    )
    verwandte_seiten = clean_wikilink_list(sections.get("Verwandte Seiten", ""), "Verwandte Seiten")

    tags = post.get("tags", []) or []
    if not isinstance(tags, list):
        tags = [str(tags)]

    return Note(
        note_path=note_path,
        seitencode=str(seitencode),
        sektion_nr=str(post.get("sektion_nr", "")),
        sektion=str(post.get("sektion", "")),
        titel=str(post.get("titel", "")),
        titel_en=str(post.get("titel_en", "")),
        bilddatei=bilddatei,
        tags=[str(t) for t in tags],
        image_path=image_path,
        beschreibung=beschreibung,
        transkription=transkription,
        fachbegriffe=fachbegriffe,
        anzugsdrehmomente=anzugsdrehmomente,
        verwandte_seiten=verwandte_seiten,
        raw_bytes_hash=hashlib.sha256(raw_bytes).hexdigest(),
    )


def iter_vault_notes(vault_root: Path):
    for path in sorted(vault_root.rglob("*.md")):
        rel_parts = path.relative_to(vault_root).parts
        if any(part in EXCLUDED_DIR_NAMES for part in rel_parts[:-1]):
            continue
        yield path


def build_parent_note_text(note: Note) -> str:
    """Full LLM-facing text for a note (fed to the generation model in full,
    never truncated — the 'Parent Note' retrieval pattern)."""
    parts = [f"# {note.titel}", f"Seitencode: {note.seitencode} (Abschnitt: {note.sektion})"]
    if note.beschreibung:
        parts.append(f"## Beschreibung\n{note.beschreibung}")
    if note.transkription:
        parts.append(f"## Transkription\n{note.transkription}")
    if note.fachbegriffe:
        parts.append(note.fachbegriffe)
    if note.anzugsdrehmomente:
        parts.append(note.anzugsdrehmomente)
    if note.verwandte_seiten:
        parts.append(note.verwandte_seiten)
    return "\n\n".join(parts)


def build_embedding_source_text(note: Note) -> str:
    """Text actually used to generate chunk vectors: Beschreibung +
    Transkription + Fachbegriffe only (per PLAN.md Phase 1). Anzugsdrehmomente
    / Verwandte Seiten wikilink lists are cross-reference metadata, useful to
    the LLM in the full parent text, but not useful as embedding signal.
    """
    parts = [note.titel]
    if note.beschreibung:
        parts.append(note.beschreibung)
    if note.transkription:
        parts.append(note.transkription)
    if note.fachbegriffe:
        parts.append(note.fachbegriffe)
    return "\n\n".join(parts)


def chunk_text(text: str, max_tokens: int = CHUNK_TOKENS, overlap_tokens: int = CHUNK_OVERLAP) -> list[str]:
    """Greedy paragraph-boundary chunker. Splits `text` on blank lines into
    paragraph units, then packs units into chunks up to `max_tokens`, carrying
    the trailing ~`overlap_tokens` worth of units into the next chunk. Never
    splits a paragraph/table/Transkription-line unit mid-line.
    """
    units = [u for u in re.split(r"\n\s*\n", text) if u.strip()]
    if not units:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    def flush():
        if current:
            chunks.append("\n\n".join(current).strip())

    i = 0
    while i < len(units):
        unit = units[i]
        unit_tokens = count_tokens(unit)

        if current and current_tokens + unit_tokens > max_tokens:
            flush()
            # Build overlap: walk backwards through `current` accumulating
            # units until we have ~overlap_tokens, seed the next chunk with them.
            overlap_units: list[str] = []
            overlap_count = 0
            for prev_unit in reversed(current):
                pu_tokens = count_tokens(prev_unit)
                if overlap_count and overlap_count + pu_tokens > overlap_tokens:
                    break
                overlap_units.insert(0, prev_unit)
                overlap_count += pu_tokens
            current = overlap_units
            current_tokens = overlap_count

        current.append(unit)
        current_tokens += unit_tokens
        i += 1

    flush()
    return chunks


def process_vault(vault_root: Path, limit: int | None = None) -> dict:
    rows: list[dict] = []
    parent_note_text: dict[str, str] = {}
    content_hashes: list[str] = []
    note_count = 0

    paths = list(iter_vault_notes(vault_root))
    if limit:
        paths = paths[:limit]

    for path in paths:
        note = parse_note(path, vault_root)
        if note is None:
            continue
        note_count += 1
        content_hashes.append(note.raw_bytes_hash)
        parent_note_text[note.note_path] = build_parent_note_text(note)

        base_meta = dict(
            notePath=note.note_path,
            seitencode=note.seitencode,
            sektionNr=note.sektion_nr,
            sektion=note.sektion,
            titel=note.titel,
            bilddatei=note.bilddatei,
            tags=note.tags,
        )

        source_text = build_embedding_source_text(note)
        pieces = chunk_text(source_text)
        for idx, piece in enumerate(pieces):
            rows.append({**base_meta, "kind": "text", "chunkIndex": idx, "text": piece})

        if note.image_path and note.beschreibung:
            rows.append(
                {
                    **base_meta,
                    "kind": "multimodal",
                    "chunkIndex": None,
                    "text": note.beschreibung,
                    "imagePath": note.image_path,
                }
            )

    corpus_hash = hashlib.sha256("".join(sorted(content_hashes)).encode()).hexdigest()

    return {
        "corpusHash": corpus_hash,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "noteCount": note_count,
        "chunkCount": len(rows),
        "rows": rows,
        "parentNoteText": parent_note_text,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--vault-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Path to the Obsidian vault root (default: repo root)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent / "build" / "pre_embed.json",
        help="Output path for pre_embed.json",
    )
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N notes (dev/testing)")
    args = parser.parse_args()

    result = process_vault(args.vault_root, limit=args.limit)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    text_rows = [r for r in result["rows"] if r["kind"] == "text"]
    multimodal_rows = [r for r in result["rows"] if r["kind"] == "multimodal"]
    over_cap = [r for r in text_rows if count_tokens(r["text"]) > EMBEDDING_MAX_INPUT_TOKENS]

    print(f"Notes parsed:        {result['noteCount']}")
    print(f"Text chunks:         {len(text_rows)}")
    print(f"Multimodal rows:     {len(multimodal_rows)}")
    print(f"Total rows:          {result['chunkCount']}")
    print(f"Corpus hash:         {result['corpusHash'][:16]}...")
    print(f"Chunks over {EMBEDDING_MAX_INPUT_TOKENS} tokens: {len(over_cap)}")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
