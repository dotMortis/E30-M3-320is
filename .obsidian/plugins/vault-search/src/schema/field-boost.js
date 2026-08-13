/**
 * Per-field Orama boost ratios applied at query time.
 * @type {Record<string, number>}
 */
export const FIELD_BOOST = {
  code: 15,
  titel: 10,
  titleEn: 6,
  tags: 4,
  notePath: 3,
  section: 2,
  content: 1,
};

/**
 * Orama schema for a single indexed note.
 */
export const SCHEMA = {
  rowId: "string",
  notePath: "string",
  code: "string",
  titel: "string",
  titleEn: "string",
  section: "string",
  tags: "string[]",
  content: "string",
};
