import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationContext = {
  input: Record<string, unknown>;
  history: Message[];
  metadata: Record<string, unknown>;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contextUpdates?: Record<string, unknown>;
}

export interface ValidationStep {
  name: string;
  execute: (context: ValidationContext) => ValidationResult;
}

export class StructuredToolInputValidationPipelineV50 {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static create(steps: ValidationStep[]): StructuredToolInputValidationPipelineV50 {
    return new StructuredToolInputValidationPipelineV50(steps);
  }

  public validate(context: ValidationContext): ValidationResult {
    let currentContext: ValidationContext = {
      input: { ...context.input },
      history: [...context.history],
      metadata: { ...context.metadata },
    };

    let accumulatedResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const step of this.steps) {
      const result = step.execute(currentContext);

      if (!result.isValid) {
        accumulatedResult.isValid = false;
        accumulatedResult.errors.push(...result.errors);
      } else {
        accumulatedResult.warnings.push(...result.warnings);
      }

      if (result.contextUpdates) {
        currentContext.input = { ...currentContext.input, ...result.contextUpdates.input };
        currentContext.metadata = { ...currentContext.metadata, ...result.contextUpdates.metadata };
      }
    }

    return {
      isValid: accumulatedResult.isValid,
      errors: accumulatedResult.errors,
      warnings: accumulatedResult.warnings,
    };
  }
}

export class PipelineBuilder {
  private steps: ValidationStep[] = [];

  public addStep(step: ValidationStep): PipelineBuilder {
    this.steps.push(step);
    return this;
  }

  public build(): StructuredToolInputValidationPipelineV50 {
    return StructuredToolInputValidationPipelineV50.create(this.steps);
  }
}

export const buildValidator = (): PipelineBuilder => {
  return new PipelineBuilder();
};

export const buildRequiredFieldValidator = (fieldName: string): ValidationStep => ({
  name: `RequiredFieldValidator:${fieldName}`,
  execute: (context) => {
    const value = context.input[fieldName];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        errors: [`Field '${fieldName}' is required and cannot be empty.`],
        warnings: [],
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  },
});

export const buildTypeValidator = (fieldName: string, expectedType: 'string' | 'number' | 'boolean'): ValidationStep => ({
  name: `TypeValidator:${fieldName}:${expectedType}`,
  execute: (context) => {
    const value = context.input[fieldName];
    if (value === undefined || value === null) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const typeCheck = typeof value === expectedType;

    if (!typeCheck) {
      return {
        isValid: false,
        errors: [`Field '${fieldName}' must be of type ${expectedType}, but got ${typeof value}.`],
        warnings: [],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  },
});

export const buildCrossFieldDependencyValidator = (
  dependentField: string,
  dependencyField: string,
  condition: (a: unknown, b: unknown) => boolean
): ValidationStep => ({
  name: `CrossFieldDependencyValidator:${dependentField} depends on ${dependencyField}`,
  execute: (context) => {
    const dependentValue = context.input[dependentField];
    const dependencyValue = context.input[dependencyField];

    if (dependentValue === undefined || dependencyValue === undefined) {
      return { isValid: true, errors: [], warnings: [] };
    }

    if (!condition(dependentValue, dependencyValue)) {
      return {
        isValid: false,
        errors: [`Dependency failed: '${dependentField}' (${String(dependentValue)}) is invalid given '${dependencyField}' (${String(dependencyValue)}).`],
        warnings: [],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  },
});

export const buildTemporalConstraintValidator = (
  fieldName: string,
  comparison: 'after' | 'before',
  referenceField: string
): ValidationStep => ({
  name: `TemporalValidator:${fieldName} vs ${referenceField}`,
  execute: (context) => {
    const dateStr = context.input[fieldName] as string | undefined;
    const refDateStr = context.input[referenceField] as string | undefined;

    if (!dateStr || !refDateStr) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const date = new Date(dateStr);
    const refDate = new Date(refDateStr);

    if (isNaN(date.getTime()) || isNaN(refDate.getTime())) {
      return {
        isValid: false,
        errors: [`Invalid date format in one or both fields.`],
        warnings: [],
      };
    }

    let isValid = true;
    if (comparison === 'after' && date <= refDate) {
      isValid = false;
    } else if (comparison === 'before' && date >= refDate) {
      isValid = false;
    }

    return {
      isValid: isValid,
      errors: isValid ? [] : [`${fieldName} must be ${comparison} ${referenceField}.`],
      warnings: [],
    };
  },
});

export const buildCustomLogicValidator = (
  name: string,
  logic: (context: ValidationContext) => { isValid: boolean; errors: string[]; warnings: string[]; contextUpdates?: { input: Record<string, unknown>; metadata: Record<string, unknown> } }
): ValidationStep => ({
  name: name,
  execute: (context) => {
    return logic(context);
  },
});