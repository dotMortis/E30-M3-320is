import type { ChatTurn, PipelineStep, PipelineStepKind, PipelineStepStatus } from "../retrieval/types";

export { showsStatus, showsStreamingText } from "./turn-state";

const KIND_LABELS: Record<PipelineStepKind, string> = {
  retrieval: "Suche",
  embedding: "Embedding",
  llm_round: "Modell-Runde",
  tool_call: "Werkzeugaufruf",
  clarification: "Rückfrage",
  budget_exhausted: "Budget",
  final_answer: "Antwort",
};

const STATUS_LABELS: Record<PipelineStepStatus, string> = {
  running: "läuft …",
  done: "fertig",
  error: "Fehler",
};

export interface StatusLogElements {
  listEl: HTMLElement;
  summaryEl: HTMLElement;
  stepEls: Map<string, HTMLElement>;
}

function formatDuration(step: PipelineStep): string | null {
  if (typeof step.durationMs !== "number") return null;
  return step.durationMs >= 1000 ? `${(step.durationMs / 1000).toFixed(1)}s` : `${step.durationMs}ms`;
}

function renderStepMeta(metaEl: HTMLElement, step: PipelineStep): void {
  if (step.round) metaEl.createSpan({ cls: "rag-chat-step-round", text: `Runde ${step.round}` });
  if (step.model) metaEl.createSpan({ cls: "rag-chat-step-model", text: `Modell: ${step.model}` });
  const duration = formatDuration(step);
  if (duration) metaEl.createSpan({ cls: "rag-chat-step-duration", text: duration });
}

function renderJsonDetails(container: HTMLElement, summaryText: string, cls: string, value: Record<string, unknown>): void {
  const jsonDetails = container.createEl("details", { cls: `rag-chat-step-json ${cls}` });
  jsonDetails.createEl("summary", { text: summaryText });
  jsonDetails.createEl("pre", { text: JSON.stringify(value, null, 2) });
}

function renderStepBody(bodyEl: HTMLElement, step: PipelineStep): void {
  if (step.narration) bodyEl.createDiv({ cls: "rag-chat-step-narration", text: step.narration });
  if (step.errorMessage) bodyEl.createDiv({ cls: "rag-chat-step-error", text: step.errorMessage });

  if (step.hits && step.hits.length > 0) {
    const hitsList = bodyEl.createEl("ul", { cls: "rag-chat-step-hits" });
    for (const hit of step.hits) {
      const scoreText = typeof hit.score === "number" ? ` (${hit.score.toFixed(2)})` : "";
      hitsList.createEl("li", { text: `${hit.titel} [${hit.seitencode || "Referenz"}]${scoreText}` });
    }
  }

  if (step.toolArgs && Object.keys(step.toolArgs).length > 0) {
    renderJsonDetails(bodyEl, "Argumente", "rag-chat-step-json-args", step.toolArgs);
  }
  if (step.toolResult) {
    renderJsonDetails(bodyEl, "Ergebnis", "rag-chat-step-json-result", step.toolResult);
  }
}

function fillStepEl(itemEl: HTMLElement, step: PipelineStep): void {
  itemEl.empty();
  itemEl.addClass("rag-chat-step");
  itemEl.addClass(`rag-chat-step-${step.status}`);

  const details = itemEl.createEl("details", { cls: "rag-chat-step-details" });
  if (step.status === "error") details.setAttribute("open", "");

  const summary = details.createEl("summary", { cls: "rag-chat-step-summary" });
  summary.createSpan({ cls: "rag-chat-step-kind", text: KIND_LABELS[step.kind] });
  summary.createSpan({ cls: "rag-chat-step-title", text: step.title });
  summary.createSpan({ cls: `rag-chat-step-status rag-chat-step-status-${step.status}`, text: STATUS_LABELS[step.status] });

  const metaEl = details.createDiv({ cls: "rag-chat-step-meta" });
  renderStepMeta(metaEl, step);

  const bodyEl = details.createDiv({ cls: "rag-chat-step-body" });
  renderStepBody(bodyEl, step);
}

export function renderStatusLog(turnEl: HTMLElement, turn: ChatTurn): StatusLogElements {
  const steps = turn.steps!;
  const details = turnEl.createEl("details", { cls: "rag-chat-status-log" });
  const summaryEl = details.createEl("summary", { text: `Rechercheverlauf (${steps.length} Schritte)` });
  const listEl = details.createEl("ul", { cls: "rag-chat-status-log-list" });
  const stepEls = new Map<string, HTMLElement>();
  for (const step of steps) {
    const itemEl = listEl.createEl("li");
    fillStepEl(itemEl, step);
    stepEls.set(step.id, itemEl);
  }
  return { listEl, summaryEl, stepEls };
}

export function appendStatusLogLine(elements: StatusLogElements, turn: ChatTurn): void {
  const steps = turn.steps;
  if (!steps || steps.length === 0) return;
  for (const step of steps) {
    const existing = elements.stepEls.get(step.id);
    if (existing) {
      fillStepEl(existing, step);
    } else {
      const itemEl = elements.listEl.createEl("li");
      fillStepEl(itemEl, step);
      elements.stepEls.set(step.id, itemEl);
    }
  }
  elements.summaryEl.setText(`Rechercheverlauf (${steps.length} Schritte)`);
}
