import * as https from "node:https";
import { requestUrl } from "obsidian";
import type { ChatTurn } from "./retriever";
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
 * Streams a generation response via gemini-3.6-flash (Google), calling
 * onChunk for every text delta as it arrives.
 *
 * IMPORTANT (see PLAN.md): Obsidian's requestUrl helper (the usual CORS-safe
 * HTTP path for plugins) does NOT expose a readable stream - it only
 * resolves a full response. Since this plugin is isDesktopOnly, Node's
 * built-in `https` module is used instead (externalized in vite.config.ts) -
 * it isn't a browser fetch(), so it isn't subject to CORS at all.
 *
 * Wire format: `:streamGenerateContent?alt=sse` returns standard SSE
 * `data: {...}` chunks, each a partial GenerateContentResponse. There is no
 * `[DONE]` sentinel - the connection just closes after the final chunk
 * (which carries finishReason). Any candidate-less event is silently
 * skipped.
 *
 * CRITICAL (confirmed by inspecting the raw response, Aug 2026): Google's
 * real endpoint terminates each SSE event with CRLF (`\r\n\r\n`), NOT the
 * bare `\n\n` a naive parser might assume - `"\r\n\r\n".includes("\n\n")`
 * is false (there's a `\r` between the two `\n`s), so splitting on a
 * literal `"\n\n"` NEVER finds an event boundary, onChunk is never called,
 * and the promise still resolves cleanly via the normal 'end' event (no
 * error) - producing a silent empty answer with no visible failure. Every
 * `\r` is stripped from incoming chunks before buffering to normalize this.
 *
 * `history` carries prior turns of THIS chat session so follow-up questions
 * ("und was ist mit dem S14?") resolve correctly - previously this plugin
 * sent only the current question, making every turn effectively stateless.
 * Only each turn's text is replayed (not its retrieved <context>), to keep
 * token cost from growing unboundedly across a long session; the current
 * turn always gets a fresh context block built from this turn's retrieval.
 */
export function streamGenerate(
  contextXml: string,
  question: string,
  history: ChatTurn[],
  settings: RagChatSettings,
  onChunk: (text: string) => void
): Promise<void> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    return Promise.reject(new Error("Google API key is required for generation - set it in RAG Chat settings."));
  }

  const host = "generativelanguage.googleapis.com";
  const path = `/v1beta/models/${settings.generationModel}:streamGenerateContent?alt=sse`;

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...buildHistoryContents(history),
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
        let chunksEmitted = 0;
        res.setEncoding("utf-8");
        res.on("data", (chunk: string) => {
          // Normalize CRLF to LF (see CRITICAL note above) before buffering,
          // so the "\n\n" event-boundary scan below actually matches.
          buffer += chunk.replace(/\r\n/g, "\n");
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
                if (typeof text === "string" && text.length > 0) {
                  chunksEmitted++;
                  onChunk(text);
                }
              } catch {
                // Malformed/partial JSON in a data: event - skip rather than crash the stream.
              }
            }
          }
        });
        res.on("end", () => {
          if (chunksEmitted === 0) {
            // The stream completed with HTTP 200 and no error, but produced
            // no visible text (e.g. a future wire-format change, all content
            // filtered, or a parsing regression like the CRLF bug this guard
            // was added for) - surface this instead of resolving silently
            // with a blank answer next to fully-populated citations.
            reject(new Error("Generation completed but returned no text (empty response from Gemini)."));
            return;
          }
          resolve();
        });
        res.on("error", (err) => reject(err));
      }
    );
    req.on("error", (err) => reject(err));
    req.write(requestBody);
    req.end();
  });
}

/** Maps prior chat turns onto Gemini's `contents[]` shape (role "assistant"
 * -> "model", per the API's naming). Empty-text turns (e.g. an in-progress
 * assistant turn) are dropped - the API rejects empty parts. */
function buildHistoryContents(history: ChatTurn[]): { role: "user" | "model"; parts: { text: string }[] }[] {
  return history
    .filter((t) => t.text.trim().length > 0)
    .map((t) => ({
      role: t.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: t.text }],
    }));
}

/** Non-streaming single-turn Gemini call, used for the small "planning" and
 * "validation" workflow steps (query rewriting, self-critique) - these need
 * one short, complete response, not a token stream, so Obsidian's CORS-safe
 * requestUrl (used already by retriever.ts's embedQuery) is simpler here
 * than the raw `https` SSE path streamGenerate needs. */
async function generateOnce(prompt: string, settings: RagChatSettings, systemPrompt?: string): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.generationModel}:generateContent`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  const response = await requestUrl({
    url,
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = response.json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }
  return text;
}

const REWRITE_SYSTEM_PROMPT = `Du hilfst, eine Nutzerfrage zu einem BMW E30 M3/320is-Werkstatthandbuch in eine
knappe, stichwortartige Suchanfrage umzuformulieren, damit sie besser zu den technischen
Begriffen des Handbuchs passt (z.B. Fachbegriffe statt umgangssprachlicher Wörter, ganze
zusammengesetzte Wörter statt getrennter Verbteile wie "baue ... ein" -> "einbauen").
Löse Rückbezüge auf vorherige Nachrichten im Gesprächsverlauf auf, sodass die Suchanfrage
für sich allein verständlich ist. Antworte NUR mit der umformulierten Suchanfrage - keine
Erklärung, keine Anführungszeichen, keine Einleitung.`;

/**
 * LLM-based query rewrite - the fallback tier of the query-planning step
 * (see retriever.ts's resolveFollowupQuery for the free/deterministic tier).
 * Only called by workflow.ts when deterministic retrieval still comes back
 * thin, since it costs one extra non-streaming Gemini call.
 */
export async function rewriteQuery(question: string, history: ChatTurn[], settings: RagChatSettings): Promise<string> {
  const historyText = history
    .filter((t) => t.text.trim())
    .map((t) => `${t.role === "user" ? "Nutzer" : "Assistent"}: ${t.text}`)
    .join("\n");
  const prompt = historyText
    ? `Bisheriger Gesprächsverlauf:\n${historyText}\n\nAktuelle Frage: ${question}`
    : `Aktuelle Frage: ${question}`;
  const text = await generateOnce(prompt, settings, REWRITE_SYSTEM_PROMPT);
  return text.trim();
}

const CRITIQUE_SYSTEM_PROMPT = `Du prüfst, ob eine gegebene Antwort durch den bereitgestellten <context> tatsächlich
belegt ist und die <question> sinnvoll beantwortet. Antworte NUR mit genau einer Zeile:
- "OK" wenn die Antwort durch den Kontext gestützt wird und die Frage adressiert (auch wenn
  sie ausdrücklich sagt, dass eine Angabe im Kontext fehlt - das ist eine ehrliche, gültige
  Antwort).
- "RETRY: <kurzer Grund>" wenn die Antwort vage ist, nicht durch den Kontext belegt ist, oder
  die im Kontext eigentlich vorhandene Hauptseite zum Thema übersehen wurde (z.B. es werden
  nur verwandte/angrenzende Seiten zitiert statt der Seite, die die Frage direkt behandelt).
Keine weitere Erklärung, keine zusätzliche Zeile.`;

export interface CritiqueVerdict {
  ok: boolean;
  reason?: string;
}

/**
 * Post-generation self-critique (see workflow.ts): asks the model to judge
 * its own draft answer against the retrieved context before it's shown to
 * the user. Fails OPEN (treats an unparseable/erroring critique as "OK")
 * rather than blocking the user on a broken validation call.
 */
export async function critiqueAnswer(
  question: string,
  contextXml: string,
  draftAnswer: string,
  settings: RagChatSettings
): Promise<CritiqueVerdict> {
  const prompt = `${contextXml}\n\n<question>\n${question}\n</question>\n\n<answer>\n${draftAnswer}\n</answer>`;
  const text = (await generateOnce(prompt, settings, CRITIQUE_SYSTEM_PROMPT)).trim();
  if (/^OK\b/i.test(text)) return { ok: true };
  const match = /^RETRY:\s*(.*)/is.exec(text);
  if (match) return { ok: false, reason: match[1]?.trim() };
  // Unparseable response - fail open rather than looping on a broken critique.
  return { ok: true };
}
