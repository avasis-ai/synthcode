import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
  metadata: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
  context: ValidationContext;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  path: string[];
}

export interface TemporalViolationEvidence {
  field: string;
  violation: string;
  context: {
    timestamp: number;
    relatedField: string;
    value: unknown;
  }[];
}

export interface ValidationStep {
  name: string;
  execute: (
    context: ValidationContext,
    data: Record<string, unknown>
  ) => {
    result: ValidationResult;
    evidence?: TemporalViolationEvidence;
  };
}

export class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): StructuredToolInputValidationPipeline {
    return new StructuredToolInputValidationPipeline(this.steps);
  }
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  validate(
    inputData: Record<string, unknown>,
    history: Message[],
    metadata: Record<string, unknown> = {}
  ): ValidationReport {
    const initialContext: ValidationContext = {
      inputData,
      history,
      metadata,
    };

    let currentContext: ValidationContext = {
      inputData: { ...inputData },
      history: [...history],
      metadata: { ...metadata },
    };

    let allErrors: ValidationError[] = [];
    let temporalEvidence: TemporalViolationEvidence[] = [];

    for (const step of this.steps) {
      const { result, evidence } = step.execute(currentContext, inputData);

      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      if (evidence) {
        temporalEvidence.push(evidence);
      }
    }

    const finalReport: ValidationReport = {
      isValid: allErrors.length === 0 && temporalEvidence.length === 0,
      errors: [...allErrors],
      context: currentContext,
    };

    return finalReport;
  }
}

export const createValidationStep = <T extends (context: ValidationContext, data: Record<string, unknown>) => {
  result: ValidationResult;
  evidence?: TemporalViolationEvidence;
}>({
  name: "UnnamedStep",
  execute: (context: ValidationContext, data: Record<string, unknown>) => {
    throw new Error("Must implement the step logic.");
  }
}): ValidationStep => ({
  name: "UnnamedStep",
  execute: (context: ValidationContext, data: Record<string, unknown>) => {
    throw new Error("Must implement the step logic.");
  },
});