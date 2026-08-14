import type { RequestUrlResponse } from "obsidian";

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, 300) : "";
}

export function extractErrorMessageFromText(text: string): string | undefined {
  try {
    const msg = JSON.parse(text)?.error?.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  } catch {}
  return truncate(text) || undefined;
}

export function extractResponseErrorMessage(response: RequestUrlResponse): string | undefined {
  try {
    const jsonMsg = response.json?.error?.message;
    if (typeof jsonMsg === "string" && jsonMsg.trim()) return jsonMsg.trim();
  } catch {}
  return truncate(response.text ?? "") || undefined;
}
