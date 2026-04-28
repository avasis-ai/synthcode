import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationContext {
  payload: Record<string, unknown>;
  history: Message[];
  stepResults: Record<string, any>;
  state: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: "error" | "warning";
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  context: ValidationContext;
}

export interface ValidationStep {
  name: string;
  execute: (context: ValidationContext) => {
    report: {
      errors: ValidationError[];
      warnings: ValidationError[];
    };
    updatedContext: ValidationContext;
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

  public validateInput(
    payload: Record<string, unknown>,
    history: Message[],
    initialState: Record<string, unknown> = {}
  ): ValidationReport {
    let context: ValidationContext = {
      payload,
      history,
      stepResults: {},
      state: initialState,
    };

    let allErrors: ValidationError[] = [];
    let allWarnings: ValidationError[] = [];

    for (const step of this.steps) {
      try {
        const { report: stepReport, updatedContext } = step.execute(context);
        allErrors.push(...stepReport.errors);
        allWarnings.push(...stepReport.warnings);
        context = updatedContext;
      } catch (e) {
        allErrors.push({
          field: "pipeline_execution",
          message: `Step ${step.name} failed unexpectedly: ${(e as Error).message}`,
          code: "PIPELINE_ERROR",
          severity: "error",
        });
        // Stop processing on critical failure
        break;
      }
    }

    const isValid = allErrors.length === 0;

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      context: context,
    };
  }
}