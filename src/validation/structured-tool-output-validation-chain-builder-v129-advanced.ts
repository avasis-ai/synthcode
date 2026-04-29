import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Validator = (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
type Condition = (output: Record<string, unknown>) => boolean;

interface ValidationStep {
  validator: Validator;
  condition: Condition | (() => boolean);
}

export class StructuredToolOutputValidationChainBuilder {
  private schema: Record<string, unknown>;
  private steps: ValidationStep[] = [];

  constructor(schema: Record<string, unknown>) {
    this.schema = schema;
  }

  addValidator(validator: Validator): this {
    this.steps.push({ validator, condition: () => true });
    return this;
  }

  addConditionalStep(condition: Condition, validator: Validator): this {
    this.steps.push({ validator, condition });
    return this;
  }

  build(): {
    validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[]; result: Record<string, unknown> };
  } {
    const validate = (output: Record<string, unknown>): { isValid: boolean; errors: string[]; result: Record<string, unknown> } => {
      const allErrors: string[] = [];
      let currentOutput: Record<string, unknown> = { ...output };

      for (const step of this.steps) {
        const conditionMet = typeof step.condition === 'function' ? step.condition(currentOutput) : true;

        if (conditionMet) {
          const validationResult = step.validator(currentOutput);
          if (!validationResult.isValid) {
            allErrors.push(...validationResult.errors);
          }
          // In a real scenario, we might update currentOutput based on validation,
          // but for simplicity, we pass the original output through.
        }
      }

      const isValid = allErrors.length === 0;

      return {
        isValid,
        errors: allErrors,
        result: currentOutput,
      };
    };

    return { validate };
  }
}