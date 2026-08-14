import type { PipelineStep } from "../retrieval/types";

export type StartStepInput = Omit<PipelineStep, "id" | "status" | "startedAt" | "finishedAt" | "durationMs">;

export interface StepReporter {
  start(input: StartStepInput): PipelineStep;
  update(step: PipelineStep, patch: Partial<PipelineStep>): void;
  finish(step: PipelineStep, patch?: Partial<PipelineStep>): void;
  fail(step: PipelineStep, errorMessage: string): void;
  record(input: StartStepInput): PipelineStep;
}

export function createStepReporter(onStep?: (step: PipelineStep) => void): StepReporter {
  let counter = 0;

  const start: StepReporter["start"] = (input) => {
    const step: PipelineStep = { id: `step-${++counter}`, status: "running", startedAt: Date.now(), ...input };
    onStep?.(step);
    return step;
  };

  const update: StepReporter["update"] = (step, patch) => {
    Object.assign(step, patch);
    onStep?.(step);
  };

  const finish: StepReporter["finish"] = (step, patch) => {
    if (patch) Object.assign(step, patch);
    step.status = "done";
    step.finishedAt = Date.now();
    step.durationMs = step.finishedAt - step.startedAt;
    onStep?.(step);
  };

  const fail: StepReporter["fail"] = (step, errorMessage) => {
    step.status = "error";
    step.errorMessage = errorMessage;
    step.finishedAt = Date.now();
    step.durationMs = step.finishedAt - step.startedAt;
    onStep?.(step);
  };

  const record: StepReporter["record"] = (input) => {
    const step = start(input);
    finish(step);
    return step;
  };

  return { start, update, finish, fail, record };
}

export const NOOP_STEP_REPORTER: StepReporter = createStepReporter();
