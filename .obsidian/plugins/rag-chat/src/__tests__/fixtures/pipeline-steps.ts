import type { PipelineStep } from "../../retrieval/types";

let counter = 0;

export function fakeStep(overrides: Partial<PipelineStep> = {}): PipelineStep {
  return {
    id: `fake-step-${++counter}`,
    kind: "retrieval",
    title: "Schritt",
    status: "done",
    startedAt: Date.now(),
    ...overrides,
  };
}
