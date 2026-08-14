export const TRANSCRIPT_START = "%%%TRANSCRIPT_START%%%";
export const TRANSCRIPT_END = "%%%TRANSCRIPT_END%%%";

export interface TranscriptBlock {
  transcript?: string;
  transcriptComplete: boolean;
}

export function splitTranscriptBlock(text: string): TranscriptBlock {
  const startIdx = text.indexOf(TRANSCRIPT_START);
  if (startIdx === -1) {
    return { transcriptComplete: false };
  }

  const endIdx = text.indexOf(TRANSCRIPT_END, startIdx + TRANSCRIPT_START.length);
  if (endIdx === -1) {
    return { transcriptComplete: false };
  }

  const transcript = text.slice(startIdx + TRANSCRIPT_START.length, endIdx).trim();
  return { transcript, transcriptComplete: true };
}

export function extractFinalTranscript(fullText: string): string {
  const block = splitTranscriptBlock(fullText);
  if (block.transcriptComplete) {
    return block.transcript ?? "";
  }
  return fullText.trim();
}
