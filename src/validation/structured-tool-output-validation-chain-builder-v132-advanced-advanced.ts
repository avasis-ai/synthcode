import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationContext {
  input: Record<string, unknown>;
  executionPath: string[];
  errors: Record<string, string[]>;
}

type ValidationStep = (context: ValidationContext) => {
  isValid: boolean;
  context: ValidationContext;
  error?: string;
};

interface Condition {
  check: (context: ValidationContext) => boolean;
}

export class StructuredToolOutputValidationChainBuilderAdvancedAdvanced {
  private steps: {
    condition: Condition | (() => boolean);
    validator: ValidationStep;
  }[] = [];

  private constructor() {}

  private static getInstance(): StructuredToolOutputValidationChainBuilderAdvancedAdvanced {
    if (!StructuredToolOutputValidationChainBuilderAdvancedAdvanced.instance) {
      StructuredToolOutputValidationChainBuilderAdvancedAdvanced.instance = new StructuredToolOutputValidationChainBuilderAdvancedAdvanced();
    }
    return StructuredToolOutputValidationChainBuilderAdvancedAdvanced.instance;
  }

  public static get instance(): StructuredToolOutputValidationChainBuilderAdvancedAdvanced {
    return StructuredToolOutputValidationChainBuilderAdvancedAdvanced.getInstance();
  }

  public addStep(validator: ValidationStep): this {
    this.steps.push({
      condition: () => true,
      validator: validator,
    });
    return this;
  }

  public when(conditionCheck: (context: ValidationContext) => boolean): this {
    this.steps.push({
      condition: {
        check: conditionCheck,
      },
      validator: (context: ValidationContext) => {
        if (!conditionCheck(context)) {
          return {
            isValid: true,
            context: context,
          };
        }
        // This path should ideally not be hit if the caller checks the condition first,
        // but we must return a valid structure.
        return {
          isValid: true,
          context: context,
        };
      },
    });
    return this;
  }

  public build(): {
    execute: (initialContext: ValidationContext) => {
      context: ValidationContext;
      result: { isValid: boolean; context: ValidationContext; error?: string };
    };
  } {
    return {
      execute: (initialContext: ValidationContext): {
        isValid: boolean;
        context: ValidationContext;
        error?: string;
      } => {
        let context: ValidationContext = {
          input: initialContext.input,
          executionPath: [...initialContext.executionPath],
          errors: { ...initialContext.errors },
        };

        for (const step of this.steps) {
          const conditionMet = typeof step.condition.check === 'function'
            ? step.condition.check(context)
            : true;

          if (conditionMet) {
            const result = step.validator(context);
            context = result.context;

            if (!result.isValid) {
              context.errors[context.executionPath.join('|')] = [
                (context.errors[context.executionPath.join('|')] || [])
                .concat(result.error || "Validation failed")
              ];
              return {
                isValid: false,
                context: context,
                error: `Validation failed at step: ${context.executionPath.pop()}`,
              };
            }
          }
        }

        return {
          isValid: true,
          context: context,
        };
      },
    };
  }
}