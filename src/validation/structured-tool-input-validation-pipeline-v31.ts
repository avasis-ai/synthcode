import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
};

export interface ExecutionContext {
  input: Record<string, unknown>;
  history: Message[];
  state: Record<string, unknown>;
}

export interface ValidationStep {
  execute: (context: ExecutionContext, history: Message[]): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolInputValidationPipeline {
    if (!StructuredToolInputValidationPipeline.instance) {
      StructuredToolInputValidationPipeline.instance = new StructuredToolInputValidationPipeline();
    }
    return StructuredToolInputValidationPipeline.instance;
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public validate(context: ExecutionContext, history: Message[]): ValidationResult {
    let currentResult: ValidationResult = { isValid: true, errors: [] };
    let contextState: Record<string, unknown> = { ...context.state };

    for (const step of this.steps) {
      const result = step.execute(context, history);
      if (!result.isValid) {
        currentResult.isValid = false;
        currentResult.errors = [...currentResult.errors, ...result.errors];
        // Optionally, stop on first failure or accumulate all errors
        // For this implementation, we accumulate errors but continue execution
      }
      if (result.context) {
        contextState = { ...contextState, ...result.context };
      }
    }

    return {
      isValid: currentResult.isValid,
      errors: currentResult.errors,
      context: contextState,
    };
  }

  public static build(): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.getInstance();
  }
}

export class CrossFieldValidator implements ValidationStep {
  private requiredFields: { field: string; dependsOn: string; message: string }[];

  constructor(requiredFields: { field: string; dependsOn: string; message: string }[]) {
    this.requiredFields = requiredFields;
  }

  execute(context: ExecutionContext, history: Message[]): ValidationResult {
    const errors: string[] = [];
    for (const { field, dependsOn, message } of this.requiredFields) {
      if (context.input[field] === undefined || context.input[field] === null) {
        if (context.input[dependsOn] !== undefined && context.input[dependsOn] !== null) {
          errors.push(message);
        }
      }
    }
    return { isValid: errors.length === 0, errors: errors, context: { crossFieldChecks: true } };
  }
}

export class TemporalValidator implements ValidationStep {
  private fieldName: string;
  private unit: "seconds" | "minutes" | "hours";
  private maxDuration: number;

  constructor(fieldName: string, unit: "seconds" | "minutes" | "hours", maxDuration: number) {
    this.fieldName = fieldName;
    this.unit = unit;
    this.maxDuration = maxDuration;
  }

  execute(context: ExecutionContext, history: Message[]): ValidationResult {
    const input = context.input as Record<string, unknown>;
    const startTime = input[this.fieldName] as (number | string) | undefined;

    if (startTime === undefined || typeof startTime === 'unknown') {
      return { isValid: true, errors: [], context: { temporalCheck: true } };
    }

    const startTimeMs = typeof startTime === 'string' ? new Date(String(startTime)).getTime() : Number(startTime);
    if (isNaN(startTimeMs)) {
      return { isValid: false, errors: [`Invalid date format for ${this.fieldName}`], context: { temporalCheck: true } };
    }

    const now = Date.now();
    const elapsedMs = Math.abs(now - startTimeMs);
    const maxMs = this.maxDuration * (this.unit === "seconds" ? 1000 : this.unit === "minutes" ? 60 * 1000 : 60 * 60 * 1000);

    if (elapsedMs > maxMs) {
      return { isValid: false, errors: [`Field ${this.fieldName} exceeds ${this.maxDuration} ${this.unit} limit`], context: { temporalCheck: true } };
    }

    return { isValid: true, errors: [], context: { temporalCheck: true } };
  }
}

export const createValidationPipeline = (): StructuredToolInputValidationPipeline => {
  return StructuredToolInputValidationPipeline.build();
};