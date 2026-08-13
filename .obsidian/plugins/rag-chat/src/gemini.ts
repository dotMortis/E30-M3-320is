import * as https from "node:https";
import type { RagChatSettings } from "./settings";

/**
 * Pinned system instruction (see PLAN.md Phase 4 "System prompt", shipped
 * verbatim). Steers determinism via the prompt since temperature/top_p/top_k
 * are deprecated on gemini-3.6-flash and are never sent.
 */
export const SYSTEM_PROMPT = `Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.
Beantworte die Frage AUSSCHLIESSLICH anhand der Informationen im <context>.
- Fehlt eine genaue Teilenummer oder ein Spezifikationswert im Kontext, sage das
  ausdrücklich ("Diese Information ist im Kontext nicht enthalten.").
- Nutze KEIN Allgemeinwissen, außer der Nutzer verlangt es ausdrücklich.
- Nenne den Dateinamen (Seitencode) der Quelle bei technischen Angaben.
Antworte auf Deutsch.`;

/**
 * Streams a generation response via gemini-3.6-flash, calling onChunk for
 * every text delta as it arrives.
 *
 * IMPORTANT (see PLAN.md - verified live against the real Zen endpoint, Aug
 * 2026): Obsidian's requestUrl helper (the usual CORS-safe HTTP path for
 * plugins) does NOT expose a readable stream - it only resolves a full
 * response. Since this plugin is isDesktopOnly, Node's built-in `https`
 * module is used instead (externalized in vite.config.ts) - it isn't a
 * browser fetch(), so it isn't subject to CORS at all.
 *
 * Wire format: `:streamGenerateContent?alt=sse` returns standard SSE
 * `data: {...}` chunks, each a partial GenerateContentResponse. There is no
 * `[DONE]` sentinel - the connection just closes after the final chunk
 * (which carries finishReason). Zen appends one extra trailing event with
 * no `candidates` field: `data: {"type":"ping","cost":"..."}` - this and any
 * other candidate-less event are silently skipped.
 */
export function streamGenerate(
  contextXml: string,
  question: string,
  settings: RagChatSettings,
  onChunk: (text: string) => void
): Promise<void> {
  const provider = settings.genProvider;
  const apiKey = provider === "google" ? settings.geminiApiKey : settings.opencodeApiKey;
  if (!apiKey) {
    const keyName = provider === "google" ? "Google API key" : "OpenCode Zen API key";
    return Promise.reject(new Error(`${keyName} is required for generation - set it in RAG Chat settings.`));
  }

  const host = provider === "google" ? "generativelanguage.googleapis.com" : "opencode.ai";
  const path =
    provider === "google"
      ? `/v1beta/models/${settings.generationModel}:streamGenerateContent?alt=sse`
      : `/zen/v1/models/${settings.generationModel}:streamGenerateContent?alt=sse`;

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `${contextXml}\n\n<question>\n${question}\n</question>` }],
      },
    ],
  });

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        host,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
          "x-goog-api-key": apiKey,
          // Zen sits behind Cloudflare and expects a browser-like UA (see .pipeline/scripts/analyze.py).
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 400) {
          let errBody = "";
          res.on("data", (chunk) => (errBody += chunk));
          res.on("end", () => reject(new Error(`HTTP ${res.statusCode}: ${errBody.slice(0, 500)}`)));
          return;
        }

        let buffer = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk: string) => {
          buffer += chunk;
          // SSE events are separated by a blank line; process complete events only.
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            for (const line of event.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (typeof text === "string" && text.length > 0) onChunk(text);
              } catch {
                // Malformed/partial JSON in a data: event (or a non-candidate event like
                // Zen's trailing cost ping) - skip rather than crash the stream.
              }
            }
          }
        });
        res.on("end", () => resolve());
        res.on("error", (err) => reject(err));
      }
    );
    req.on("error", (err) => reject(err));
    req.write(requestBody);
    req.end();
  });
}
