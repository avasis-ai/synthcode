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
  errors: string[];
  updatedContext: ValidationContext;
}

export type ValidationStep = (
  context: ValidationContext
) => Promise<ValidationResult>;

export class StructuredToolInputValidationPipelineV33 {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static create(steps: ValidationStep[]): StructuredToolInputValidationPipelineV33 {
    return new StructuredToolInputValidationPipelineV33(steps);
  }

  public async execute(initialContext: ValidationContext): Promise<ValidationResult> {
    let currentContext: ValidationContext = {
      inputData: initialContext.inputData,
      history: initialContext.history,
      metadata: initialContext.metadata,
    };

    let accumulatedErrors: string[] = [];

    for (const step of this.steps) {
      try {
        const result = await step(currentContext);
        if (!result.isValid) {
          accumulatedErrors.push(...result.errors);
        }
        currentContext = result.updatedContext;
      } catch (error) {
        accumulatedErrors.push(`Pipeline step failed: ${error instanceof Error ? error.message : String(error)}`);
        // Stop processing on critical failure, but return current state
        break;
      }
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      updatedContext: currentContext,
    };
  }
}

export const buildPipeline = (
  initialInput: Record<string, unknown>,
  history: Message[],
  metadata: Record<string, unknown>
): StructuredToolInputValidationPipelineV33 => {
  const context: ValidationContext = {
    inputData: initialInput,
    history: history,
    metadata: metadata,
  };

  const steps: ValidationStep[] = [
    async (context) => {
      const input = context.inputData;
      const errors: string[] = [];

      if (typeof input !== 'object' || input === null) {
        errors.push("Input data must be a non-null object.");
      } else {
        // Example: Check for required field 'toolName'
        if (!('toolName' in input) || typeof input.toolName !== 'string') {
          errors.push("Missing or invalid 'toolName' in input.");
        }
        // Example: Check for required field 'parameters'
        if (!('parameters' in input) || typeof input.parameters !== 'object' || input.parameters === null) {
          errors.push("Missing or invalid 'parameters' object.");
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors: errors,
        updatedContext: { ...context, inputData: { ...context.inputData } },
      };
      return result;
    },
    async (context) => {
      const input = context.inputData;
      const errors: string[] = [];

      if (input.parameters && typeof input.parameters === 'object' && !Array.isArray(input.parameters)) {
        const params = input.parameters;
        // Example: Cross-field consistency check (e.g., 'startDate' must precede 'endDate')
        if (params.startDate && params.endDate) {
          const start = new Date(params.startDate).getTime();
          const end = new Date(params.endDate).getTime();
          if (start > end) {
            errors.push("startDate cannot be after endDate.");
          }
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors: errors,
        updatedContext: { ...context, inputData: { ...context.inputData } },
      };
      return result;
    },
    async (context) => {
      // Simulate an external API lookup validation step
      const input = context.inputData;
      const errors: string[] = [];

      if (input.userId && typeof input.userId === 'string') {
        // Mock API call check
        const isValidUser = await new Promise<boolean>(resolve => {
          setTimeout(() => {
            resolve(input.userId.length > 5); // Mock validation
          }, 10);
        });

        if (!isValidUser) {
          errors.push(`User ID '${input.userId}' failed external validation.`);
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors: errors,
        updatedContext: { ...context, inputData: { ...context.inputData } },
      };
      return result;
    },
  ];

  return StructuredToolInputValidationPipelineV33.create(steps);
};