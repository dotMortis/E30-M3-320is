import { create, insert } from "@orama/orama";
import type { RagMetadata } from "../../retrieval/orama-schema";
import type { CachedIndices, ReferenceChunkMap } from "../../retrieval/types";

const TEST_METADATA_FIELDS = {
  rowId: "string",
  seitencode: "string",
  sektionNr: "string",
  sektion: "string",
  titel: "string",
  tags: "string[]",
  notePath: "string",
  bilddatei: "string",
  kind: "enum",
} as const;

export const TEST_VECTOR_DIMS = 4;

const TEST_TEXT_SCHEMA = { ...TEST_METADATA_FIELDS, text: "string" } as const;
const TEST_VECTOR_SCHEMA = { ...TEST_METADATA_FIELDS, embedding: `vector[${TEST_VECTOR_DIMS}]` } as const;

export interface FakeRow extends RagMetadata {
  text?: string;
  embedding?: number[];
  shard?: number;
}

export async function buildFakeIndices(
  rows: FakeRow[],
  opts: { shardCount?: number; referenceChunks?: ReferenceChunkMap } = {}
): Promise<CachedIndices> {
  const textDb = await create({ schema: TEST_TEXT_SCHEMA });
  for (const row of rows) {
    await insert(textDb, {
      rowId: row.rowId,
      seitencode: row.seitencode,
      sektionNr: row.sektionNr,
      sektion: row.sektion,
      titel: row.titel,
      tags: row.tags,
      notePath: row.notePath,
      bilddatei: row.bilddatei,
      kind: row.kind,
      text: row.text ?? "",
    });
  }

  const shardCount = opts.shardCount ?? 1;
  const vectorDbs = await Promise.all(
    Array.from({ length: shardCount }, () => create({ schema: TEST_VECTOR_SCHEMA }))
  );
  for (const row of rows) {
    if (!row.embedding) continue;
    const shardIndex = row.shard ?? 0;
    await insert(vectorDbs[shardIndex], {
      rowId: row.rowId,
      seitencode: row.seitencode,
      sektionNr: row.sektionNr,
      sektion: row.sektion,
      titel: row.titel,
      tags: row.tags,
      notePath: row.notePath,
      bilddatei: row.bilddatei,
      kind: row.kind,
      embedding: row.embedding,
    });
  }

  return { textDb, vectorDbs, referenceChunks: opts.referenceChunks ?? new Map() };
}

export function fakeRow(overrides: Partial<FakeRow> & { rowId: string }): FakeRow {
  return {
    seitencode: "",
    sektionNr: "",
    sektion: "",
    titel: overrides.rowId,
    tags: [],
    notePath: `${overrides.rowId}.md`,
    bilddatei: "",
    kind: "text",
    ...overrides,
  };
}
