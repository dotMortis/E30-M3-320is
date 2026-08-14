import type { RequestUrlResponse } from "obsidian";

export function readResponseJson(response: RequestUrlResponse): any {
  try {
    return response.json;
  } catch (err) {
    throw new Error(
      `Antwort konnte nicht als JSON gelesen werden: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
