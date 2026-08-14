import { TTS_AUDIO_ENCODING } from "../constants";
import { readResponseJson } from "../http/read-json";
import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";

const ACCESS_DENIED_MESSAGE =
  "Zugriff verweigert - Cloud Text-to-Speech API und Billing im Projekt dieses API-Keys aktivieren.";

export async function synthesizeSpeech(
  text: string,
  settings: RagChatSettings,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  const apiKey = settings.ttsApiKey;
  if (!apiKey) {
    throw new Error(
      "TTS Google API key is required - set it in RAG Chat settings.",
    );
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
        headers: {
          "X-Goog-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      { label: "Sprachsynthese", signal: opts?.signal },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("status 403")) {
      throw new Error(ACCESS_DENIED_MESSAGE);
    }
    throw err;
  }

  const json = readResponseJson(response);
  const audioContent = json?.audioContent;
  if (typeof audioContent !== "string" || audioContent.length === 0) {
    throw new Error(
      `Unexpected text:synthesize response shape: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }

  return audioContent;
}
