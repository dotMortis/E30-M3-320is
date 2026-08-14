const BLOCK_REASON_MESSAGES: Record<string, string> = {
  SAFETY: "Die Antwort wurde von Sicherheitsfiltern blockiert (SAFETY).",
  RECITATION: "Die Antwort wurde blockiert - möglicherweise wörtliche Wiedergabe urheberrechtlich geschützten Materials (RECITATION).",
  MAX_TOKENS: "Die Antwort wurde wegen Erreichens des Token-Limits abgebrochen, bevor Inhalt erzeugt wurde (MAX_TOKENS).",
  OTHER: "Die Antwort wurde aus einem nicht näher spezifizierten Grund blockiert (OTHER).",
};

export function blockReasonMessage(json: any, candidate: any): string | undefined {
  const blockReason = json?.promptFeedback?.blockReason as string | undefined;
  const finishReason = candidate?.finishReason as string | undefined;
  const reason = blockReason ?? (finishReason && finishReason !== "STOP" ? finishReason : undefined);
  if (!reason) return undefined;
  return BLOCK_REASON_MESSAGES[reason] ?? `Die Antwort wurde blockiert/abgebrochen (Grund: ${reason}).`;
}
