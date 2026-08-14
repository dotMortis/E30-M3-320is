export const SHORT_ANSWER_START = "%%%SHORT_ANSWER_START%%%";
export const SHORT_ANSWER_END = "%%%SHORT_ANSWER_END%%%";
export const ANSWER_START = "%%%ANSWER_START%%%";
export const ANSWER_END = "%%%ANSWER_END%%%";

export interface AnswerBlocks {
  shortAnswer?: string;
  shortAnswerComplete: boolean;
  answer: string;
}

function stripAnswerMarkers(text: string): string {
  return text.replace(ANSWER_START, "").replace(ANSWER_END, "").trim();
}

function removeAll(text: string, marker: string): string {
  return text.split(marker).join("");
}

function stripAllMarkers(text: string): string {
  return [SHORT_ANSWER_START, SHORT_ANSWER_END, ANSWER_START, ANSWER_END]
    .reduce(removeAll, text)
    .trim();
}

export function splitAnswerBlocks(text: string): AnswerBlocks {
  const shortStartIdx = text.indexOf(SHORT_ANSWER_START);
  if (shortStartIdx === -1) {
    return { shortAnswerComplete: false, answer: stripAnswerMarkers(text) };
  }

  const shortEndIdx = text.indexOf(SHORT_ANSWER_END, shortStartIdx + SHORT_ANSWER_START.length);
  if (shortEndIdx === -1) {
    return { shortAnswerComplete: false, answer: "" };
  }

  const shortAnswer = text.slice(shortStartIdx + SHORT_ANSWER_START.length, shortEndIdx).trim();
  const rest = text.slice(shortEndIdx + SHORT_ANSWER_END.length);
  return { shortAnswer, shortAnswerComplete: true, answer: stripAnswerMarkers(rest) };
}

export interface FinalAnswer {
  text: string;
  shortAnswer?: string;
}

export function extractFinalAnswer(fullText: string): FinalAnswer {
  const blocks = splitAnswerBlocks(fullText);
  if (blocks.shortAnswerComplete) {
    return { text: blocks.answer, shortAnswer: blocks.shortAnswer };
  }
  return { text: stripAllMarkers(fullText) };
}
