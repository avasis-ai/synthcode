import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type FieldName = string;
type InputData = Record<FieldName, unknown>;

export enum ConstraintType {
  SCHEMA_VALIDATION = "SCHEMA_VALIDATION",
  RUNTIME_PATTERN = "RUNTIME_PATTERN",
  CROSS_FIELD_LOGIC = "CROSS_FIELD_LOGIC",
}

export interface ValidationError {
  field: FieldName;
  message: string;
  constraint: ConstraintType;
}

export interface ValidationStep {
  type: ConstraintType;
  validate: (
    data: InputData,
    context: Record<string, unknown>
  ) => ValidationError[] | null;
}

export interface CustomLogicValidator {
  validate: (
    data: InputData,
    context: Record<string, unknown>
  ) => ValidationError[] | null;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];
  private customLogicValidators: CustomLogicValidator[] = [];

  private constructor() {}

  private static instance: StructuredToolInputValidationPipeline;

  private static getInstance(): StructuredToolInputValidationPipeline {
    if (!StructuredToolInputValidationPipeline.instance) {
      StructuredToolInputValidationPipeline.instance = new StructuredToolInputValidationPipeline();
    }
    return StructuredToolInputValidationPipeline.instance;
  }

  public addSchemaStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addRuntimePatternStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addCrossFieldLogicStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addCustomLogicValidator(validator: CustomLogicValidator): StructuredToolInputValidationPipeline {
    this.customLogicValidators.push(validator);
    return this;
  }

  public buildPipeline(): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.getInstance();
  }

  public validate(
    data: InputData,
    context: Record<string, unknown> = {}
  ): ValidationError[] {
    let errors: ValidationError[] = [];

    for (const step of this.steps) {
      const stepErrors = step.validate(data, context);
      if (stepErrors) {
        errors.push(...stepErrors);
      }
    }

    for (const validator of this.customLogicValidators) {
      const customErrors = validator.validate(data, context);
      if (customErrors) {
        errors.push(...customErrors);
      }
    }

    return errors;
  }
}

export const buildValidationPipeline = (): StructuredToolInputValidationPipeline => {
  const pipeline = new StructuredToolInputValidationPipeline();

  return pipeline;
};