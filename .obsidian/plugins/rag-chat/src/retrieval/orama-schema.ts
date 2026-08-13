import { create, load, save, type AnyOrama } from "@orama/orama";
import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";

export const EMBEDDING_DIMS = 3072;

export const GERMAN_STOPWORDS = [
  "der", "die", "das", "des", "dem", "den", "ein", "eine", "einer", "eines", "einem", "einen",
  "und", "oder", "aber", "sowie", "sowohl", "weder", "noch",
  "hinter", "vor", "über", "unter", "zwischen", "neben", "an", "auf", "in", "im", "am", "zu",
  "zum", "zur", "für", "von", "vom", "mit", "bei", "aus", "nach", "durch", "gegen", "ohne", "bis",
  "seit", "während", "wegen", "trotz", "innerhalb", "außerhalb", "oberhalb", "unterhalb",
  "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden", "hat", "haben", "hatte",
  "hatten", "kann", "können", "muss", "müssen", "soll", "sollen", "darf", "dürfen", "sich",
  "als", "wie", "so", "nicht", "kein", "keine", "auch", "nur", "noch", "schon", "dass", "daß",
  "diese", "dieser", "dieses", "diesem", "diesen", "jene", "jener", "jenes",
];

export const GERMAN_TOKENIZER = {
  stemming: true,
  stemmer: germanStemmer,
  language: germanLanguage,
  stopWords: GERMAN_STOPWORDS,
};

const METADATA_FIELDS = {
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

export const TEXT_SCHEMA = {
  ...METADATA_FIELDS,
  text: "string",
} as const;

export const VECTOR_SCHEMA = {
  ...METADATA_FIELDS,
  embedding: `vector[${EMBEDDING_DIMS}]`,
} as const;

export interface RagMetadata {
  rowId: string;
  seitencode: string;
  sektionNr: string;
  sektion: string;
  titel: string;
  tags: string[];
  notePath: string;
  bilddatei: string;
  kind: "text" | "multimodal" | "reference";
}

export interface RagTextDocument extends RagMetadata {
  text: string;
}

export interface RagVectorDocument extends RagMetadata {
  embedding: number[] | null;
}

export async function loadTextIndex(indexPath: string): Promise<AnyOrama> {
  const placeholder = await restoreFromFile("binary", indexPath, "node");
  const exported = await save(placeholder);
  const db = await create({
    schema: TEXT_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });
  await load(db, exported);
  return db;
}

export async function loadVectorShard(indexPath: string): Promise<AnyOrama> {
  return (await restoreFromFile("binary", indexPath, "node")) as AnyOrama;
}
