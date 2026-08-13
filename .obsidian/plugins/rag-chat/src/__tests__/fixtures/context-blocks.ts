import type { ContextBlock } from "../../retrieval/types";

export const TORQUE_BLOCK: ContextBlock = {
  notePath: "11-09/anzugsdrehmomente-zylinderkopfschrauben.md",
  seitencode: "11-09",
  sektion: "Motor",
  titel: "Anzugsdrehmomente Zylinderkopfschrauben",
  fullText: "# Anzugsdrehmomente Zylinderkopfschrauben\n\nZylinderkopfschrauben: 30 Nm + 90° + 90°.",
};

export const ENGINE_OVERVIEW_BLOCK: ContextBlock = {
  notePath: "11-100/motoruebersicht.md",
  seitencode: "11-100",
  sektion: "Motor",
  titel: "Motorübersicht S14 B20 B23",
  fullText: "# Motorübersicht S14 B20 B23\n\nÜbersicht des S14-Motors.",
};

/** Same seitencode as TORQUE_BLOCK but a different note - simulates the "47
 * known seitencode collisions" case from PLAN.md. */
export const TORQUE_COLLISION_BLOCK: ContextBlock = {
  notePath: "11-09/anzugsdrehmomente-anhang.md",
  seitencode: "11-09",
  sektion: "Anhang",
  titel: "Anzugsdrehmomente Anhang",
  fullText: "# Anzugsdrehmomente Anhang\n\nZusätzliche Drehmomentwerte.",
};

export const REFERENCE_BLOCK: ContextBlock = {
  notePath: "Referenz/Sonderwerkzeuge.md",
  seitencode: "",
  sektion: "Referenz",
  titel: "Sonderwerkzeuge",
  fullText: "# Sonderwerkzeuge\n\nSpezialwerkzeug 11 1 210 für Zylinderkopfschrauben.",
};

export const REFERENCE_BLOCK_TWO: ContextBlock = {
  notePath: "Referenz/Glossar-A.md",
  seitencode: "",
  sektion: "Referenz",
  titel: "Glossar A-D",
  fullText: "# Glossar A-D\n\nAnzugsdrehmoment: siehe Drehmoment.",
};
