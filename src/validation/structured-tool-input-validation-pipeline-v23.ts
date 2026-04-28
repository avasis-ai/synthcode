import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationContext = {
  inputData: Record<string, unknown>;
  messages: Message[];
  state: Record<string, unknown>;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  contextUpdates: Record<string, unknown>;
};

export interface ValidationStep {
  execute(context: ValidationContext): Promise<ValidationResult>;
}

export class StructuredToolInputValidationPipelineV23 {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public async execute(initialContext: ValidationContext): Promise<ValidationResult> {
    let currentContext: ValidationContext = {
      inputData: initialContext.inputData,
      messages: [...initialContext.messages],
      state: { ...initialContext.state },
    };

    let accumulatedResult: ValidationResult = {
      isValid: true,
      errors: [],
      contextUpdates: {},
    };

    for (const step of this.steps) {
      try {
        const stepResult = await step.execute(currentContext);

        accumulatedResult.isValid = accumulatedResult.isValid && stepResult.isValid;
        accumulatedResult.errors = [...accumulatedResult.errors, ...stepResult.errors];
        
        // Merge context updates: later steps overwrite earlier ones for the same key
        accumulatedResult.contextUpdates = {
            ...accumulatedResult.contextUpdates,
            ...(stepResult.contextUpdates || {})
        };
        
        // Update context state for the next step
        currentContext = {
            ...currentContext,
            state: { ...currentContext.state, ...stepResult.contextUpdates }
        };

      } catch (error) {
        accumulatedResult.isValid = false;
        accumulatedResult.errors.push(`Pipeline execution failed at a step: ${error instanceof Error ? error.message : "Unknown error"}`);
        break;
      }
    }

    return accumulatedResult;
  }
}

type StepFactory<T extends ValidationContext> = (context: T) => ValidationStep;

export const buildValidationPipeline = <T extends ValidationContext>(
  stepFactories: { factory: StepFactory<T>; name: string }[]
): StructuredToolInputValidationPipelineV23 => {
  const steps: ValidationStep[] = stepFactories.map(item => {
    // In a real scenario, we might need to pass configuration here, 
    // but adhering to the interface, we assume the factory returns the executable step.
    return item.factory(item.name); 
  });
  return new StructuredToolInputValidationPipelineV23(steps);
};

export class RequiredFieldValidator implements ValidationStep {
  private fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    const value = context.inputData[this.fieldName];
    const isValid = value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');

    const result: ValidationResult = {
      isValid: isValid,
      errors: [],
      contextUpdates: {},
    };

    if (!isValid) {
      result.errors.push(`The required field '${this.fieldName}' is missing or empty.`);
    }
    
    return result;
  }
}

export class CrossFieldConsistencyValidator implements ValidationStep {
  private requiredFields: { field: string, dependsOn: string }[];

  constructor(requiredFields: { field: string, dependsOn: string }[]) {
    this.requiredFields = requiredFields;
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    const errors: string[] = [];
    let contextUpdates: Record<string, unknown> = {};

    for (const { field, dependsOn } of this.requiredFields) {
      const value = context.inputData[field];
      const dependencyValue = context.inputData[dependsOn];

      if (value && dependencyValue && typeof value === 'string' && typeof dependencyValue === 'string') {
        if (!value.toLowerCase().includes(dependencyValue.toLowerCase())) {
          errors.push(`Field '${field}' must contain the value from '${dependsOn}'.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      contextUpdates: { consistencyChecked: true }
    };
  }
}

export class ConditionalValidator implements ValidationStep {
  private condition: (context: ValidationContext) => boolean;
  private validator: (context: ValidationContext) => Promise<ValidationResult>;

  constructor(condition: (context: ValidationContext) => boolean, validator: (context: ValidationContext) => Promise<ValidationResult>) {
    this.condition = condition;
    this.validator = validator;
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    if (this.condition(context)) {
      return this.validator(context);
    }
    return { isValid: true, errors: [], contextUpdates: {} };
  }
}