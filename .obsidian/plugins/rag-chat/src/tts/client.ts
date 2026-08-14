import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";
import { TTS_AUDIO_ENCODING } from "../constants";

const ACCESS_DENIED_MESSAGE =
  "Zugriff verweigert - Cloud Text-to-Speech API und Billing im Projekt dieses API-Keys aktivieren.";

/**
 * Synthesizes `text` via Google Cloud Text-to-Speech (Chirp 3: HD) and
 * returns the resulting audio as a base64-encoded string (the raw
 * `audioContent` field from the API response).
 *
 * Uses `settings.ttsApiKey` if set, otherwise falls back to
 * `settings.geminiApiKey` - an AI Studio key can authenticate to this API,
 * but only if the Cloud project behind it has the Text-to-Speech API and
 * billing enabled (otherwise expect an HTTP 403, mapped below to a clear
 * German error).
 *
 * Character-usage accounting is the caller's responsibility (see
 * tts/usage.ts) - this module is a pure HTTP client and must not be called
 * for cached/replayed audio.
 */
export async function synthesizeSpeech(
  text: string,
  settings: RagChatSettings,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = settings.ttsApiKey || settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }

  const url = "https://texttospeech.googleapis.com/v1/text:synthesize";
  const body = {
    input: { text },
    voice: {
      languageCode: settings.ttsLanguageCode,
      name: settings.ttsVoiceName,
    },
    audioConfig: { audioEncoding: TTS_AUDIO_ENCODING },
  };

  let response;
  try {
    response = await requestUrlWithRetry(
      {
        url,
        method: "POST",
        headers: { "X-Goog-Api-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      { label: "Sprachsynthese", signal: opts?.signal }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("status 403")) {
      throw new Error(ACCESS_DENIED_MESSAGE);
    }
    throw err;
  }

  let json: any;
  try {
    json = response.json;
  } catch (err) {
    throw new Error(
      `Antwort konnte nicht als JSON gelesen werden: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const audioContent = json?.audioContent;
  if (typeof audioContent !== "string" || audioContent.length === 0) {
    throw new Error(`Unexpected text:synthesize response shape: ${JSON.stringify(json).slice(0, 300)}`);
  }

  return audioContent;
}
