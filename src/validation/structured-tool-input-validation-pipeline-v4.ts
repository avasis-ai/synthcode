import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

export type ValidationStep = (context: Record<string, unknown>, input: Record<string, unknown>) => {
  result: ValidationResult;
  nextContext: Record<string, unknown>;
};

export class StructuredToolInputValidationPipelineV4 {
  private steps: ValidationStep[];

  constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  public addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public validate(initialContext: Record<string, unknown>, input: Record<string, unknown>): ValidationResult {
    let currentContext = { ...initialContext };
    let currentInput = { ...input };

    for (const step of this.steps) {
      const { result, nextContext } = step(currentContext, currentInput);
      currentContext = nextContext;

      if (!result.isValid) {
        return {
          isValid: false,
          errors: [...result.errors, ...this.steps.slice(this.steps.indexOf(step) + 1).map(s => `Skipping subsequent steps due to failure in ${s.name || 'an unknown step'}.`)]
          .filter(e => e !== `Skipping subsequent steps due to failure in ${s.name || 'an unknown step'}.`),
          context: currentContext,
        };
      }
    }

    return {
      isValid: true,
      errors: [],
      context: currentContext,
    };
  }

  public static createDependencyStep(
    dependencyKey: keyof Record<string, unknown>,
    validator: (value: unknown) => { isValid: boolean; error: string }
  ): ValidationStep {
    return (context, input) => {
      const dependencyValue = context[dependencyKey];
      if (dependencyValue === undefined) {
        return {
          result: { isValid: false, errors: [`Dependency '${String(dependencyKey)}' not found in context.`], context: context },
          nextContext: context,
        };
      }

      const validation = validator(dependencyValue);

      if (!validation.isValid) {
        return {
          result: { isValid: false, errors: [validation.error], context: context },
          nextContext: context,
        };
      }

      return {
        result: { isValid: true, errors: [], context: context },
        nextContext: { ...context, [dependencyKey]: dependencyValue },
      };
    };
  }
}