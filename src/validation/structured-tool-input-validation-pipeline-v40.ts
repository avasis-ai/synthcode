import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
}

export interface ValidationStep {
  name: string;
  validate: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<ValidationResult>;
  asyncExternalCall?: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export class StructuredToolInputValidationPipelineV40 {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static build(steps: ValidationStep[]): StructuredToolInputValidationPipelineV40 {
    return new StructuredToolInputValidationPipelineV40(steps);
  }

  public async validate(input: Record<string, unknown>, initialContext: Record<string, unknown> = {}): Promise<ValidationResult> {
    let currentContext: Record<string, unknown> = { ...initialContext };
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      try {
        // 1. Handle External Service Call (if present)
        if (step.asyncExternalCall) {
          const externalData = await step.asyncExternalCall(input, currentContext);
          currentContext = { ...currentContext, ...externalData };
        }

        // 2. Run Validation Step
        const result = await step.validate(input, currentContext);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
      } catch (e) {
        allErrors.push(`Critical failure in step ${step.name}: ${(e as Error).message}`);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      context: currentContext,
    };
  }
}

export const createTemporalConstraintValidator = (fieldName: string, requiredDate: Date): ValidationStep => ({
  name: `TemporalConstraintValidator:${fieldName}`,
  validate: async (input, context) => {
    const value = input[fieldName];
    if (typeof value !== 'string') {
      return { isValid: true, errors: [] };
    }
    const inputDate = new Date(value);
    if (isNaN(inputDate.getTime())) {
      return { isValid: false, errors: [`${fieldName} must be a valid date string.`] };
    }
    const timeDiff = requiredDate.getTime() - inputDate.getTime();
    const daysDifference = timeDiff / (1000 * 60 * 60 * 24);

    if (Math.abs(daysDifference) > 365) {
      return { isValid: false, errors: [`Date in ${fieldName} is too far from the required date.`] };
    }
    return { isValid: true, errors: [] };
  },
});

export const createCrossFieldDependencyValidator = (fieldA: string, fieldB: string): ValidationStep => ({
  name: `CrossFieldDependencyValidator:${fieldA}->${fieldB}`,
  validate: async (input, context) => {
    const valueA = input[fieldA];
    const valueB = input[fieldB];

    if (typeof valueA !== 'string' || typeof valueB !== 'string') {
      return { isValid: true, errors: [] };
    }

    if (valueA.toLowerCase().includes("premium") && !valueB.toLowerCase().includes("upgrade")) {
      return { isValid: false, errors: [`If ${fieldA} is premium, ${fieldB} must contain 'upgrade'.`] };
    }

    return { isValid: true, errors: [] };
  },
});

export const createExternalDataValidator = (fieldName: string, lookupService: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<Record<string, unknown>>): ValidationStep & { asyncExternalCall?: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<Record<string, unknown>> } => {
  return {
    name: `ExternalDataValidator:${fieldName}`,
    validate: async (input, context) => {
      // Validation runs after external context is populated
      if (!context[fieldName]) {
        return { isValid: true, errors: [] };
      }
      // Simple check based on context data
      if (typeof context[fieldName] !== 'string' || context[fieldName].length < 5) {
        return { isValid: false, errors: [`External data for ${fieldName} is insufficient.`] };
      }
      return { isValid: true, errors: [] };
    },
    asyncExternalCall: async (input, context) => {
      const externalData = await lookupService(input, context);
      return { [fieldName]: externalData };
    },
  };
};