import { requestUrlWithRetry } from "../http/retry";

export interface Chirp3VoiceInfo {
  name: string;
  languageCodes: string[];
}

interface CloudTtsVoice {
  name: string;
  languageCodes?: string[];
}

interface ListVoicesResponse {
  voices?: CloudTtsVoice[];
}

const CHIRP3_HD_NAME_PATTERN = /Chirp3-HD/i;

/**
 * Lists Chirp 3: HD voices available via Cloud Text-to-Speech. Mirrors
 * gemini/models.ts's listFlashModels shape/error-swallowing: returns an
 * empty array on any failure (missing key, network error, non-2xx, ...) and
 * never throws into the settings UI.
 */
export async function listChirp3Voices(apiKey: string, signal?: AbortSignal): Promise<Chirp3VoiceInfo[]> {
  if (!apiKey) return [];

  try {
    const url = "https://texttospeech.googleapis.com/v1/voices";
    const response = await requestUrlWithRetry(
      { url, method: "GET", headers: { "X-Goog-Api-Key": apiKey } },
      { label: "Stimmenliste", signal }
    );

    const json = response.json as ListVoicesResponse;
    const voices: Chirp3VoiceInfo[] = [];
    for (const voice of json.voices ?? []) {
      if (!CHIRP3_HD_NAME_PATTERN.test(voice.name)) continue;
      voices.push({ name: voice.name, languageCodes: voice.languageCodes ?? [] });
    }
    voices.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    return voices;
  } catch {
    return [];
  }
}
