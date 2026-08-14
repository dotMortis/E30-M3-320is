import { requestUrlWithRetry } from "../http/retry";

export interface FlashModelInfo {
  id: string;
  displayName: string;
}

interface GeminiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

interface ListModelsResponse {
  models?: GeminiModel[];
  nextPageToken?: string;
}

const FLASH_NAME_PATTERN = /flash/i;
const EXCLUDED_NAME_PATTERN = /preview|tts|lite|latest/i;
const GEMINI_NAME_PATTERN = /gemini/i;
const LIST_MODELS_PAGE_SIZE = 1000;

export async function listFlashModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<FlashModelInfo[]> {
  if (!apiKey) return [];

  const models: FlashModelInfo[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=${LIST_MODELS_PAGE_SIZE}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

      const response = await requestUrlWithRetry(
        { url, method: "GET", headers: { "x-goog-api-key": apiKey } },
        { label: "Modellliste", signal },
      );

      const json = response.json as ListModelsResponse;
      for (const model of json.models ?? []) {
        const id = model.name.replace(/^models\//, "");
        if (!FLASH_NAME_PATTERN.test(id)) continue;
        if (EXCLUDED_NAME_PATTERN.test(id)) continue;
        if (!GEMINI_NAME_PATTERN.test(id)) continue;
        if (!model.supportedGenerationMethods?.includes("generateContent"))
          continue;
        models.push({ id, displayName: model.displayName ?? id });
      }
      pageToken = json.nextPageToken;
    } while (pageToken);
  } catch {
    return [];
  }

  models.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
  return models;
}
