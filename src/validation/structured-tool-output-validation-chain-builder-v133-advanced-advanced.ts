import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
}

type ValidationStep = (
  context: Record<string, unknown>,
  input: Record<string, unknown>
) => Promise<{
  result: ValidationResult;
  output: Record<string, unknown>;
}>;

interface ChainBuilder {
  addStep(
    step: ValidationStep,
    condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean,
    name: string = "Unnamed Step"
  ): this;
  addParallelSteps(
    steps: {
      step: ValidationStep;
      condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean;
      name: string;
    }[],
    condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean,
    name: string = "Parallel Validation"
  ): this;
  build(): {
    run: (
      initialContext: Record<string, unknown>,
      initialInput: Record<string, unknown>
    ) => Promise<ValidationResult>;
  };
}

class StructuredToolOutputValidationChainBuilder implements ChainBuilder {
  private steps: {
    step: ValidationStep;
    condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean;
    name: string;
  }[] = [];

  addStep(
    step: ValidationStep,
    condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean,
    name: string = "Unnamed Step"
  ): this {
    this.steps.push({ step, condition, name });
    return this;
  }

  addParallelSteps(
    steps: {
      step: ValidationStep;
      condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean;
      name: string;
    }[],
    condition?: (context: Record<string, unknown>, input: Record<string, unknown>) => boolean,
    name: string = "Parallel Validation"
  ): this {
    this.steps.push({
      step: async (context, input) => {
        const results: Promise<ValidationResult>[] = steps.map(async (s) => {
          if (s.condition && !(await s.condition(context, input))) {
            return { isValid: true, errors: [], output: {} }; // Skip if condition fails
          }
          const result = await s.step(context, input);
          return {
            result: result.result,
            output: { ...result.output, [s.name]: result.output[s.name] },
          };
        });

        const parallelResults = await Promise.all(results);
        const aggregatedOutput: Record<string, unknown> = {};
        const allErrors: string[] = [];
        let allValid = true;

        for (const res of parallelResults) {
          if (!res.result.isValid) {
            allErrors.push(...res.result.errors);
            allValid = false;
          }
          Object.assign(aggregatedOutput, res.output);
        }

        return {
          result: {
            isValid: allValid,
            errors: allErrors,
            context: { ...context, ...aggregatedOutput },
          },
          output: aggregatedOutput,
        };
      },
      condition,
      name,
    });
    return this;
  }

  build(): {
    run: (
      initialContext: Record<string, unknown>,
      initialInput: Record<string, unknown>
    ) => Promise<ValidationResult>;
  } {
    return {
      run: async (
        initialContext: Record<string, unknown>,
        initialInput: Record<string, unknown>
      ): Promise<ValidationResult> => {
        let currentContext: Record<string, unknown> = {
          ...initialContext,
          _input: initialInput,
        };
        let currentOutput: Record<string, unknown> = {};
        const allErrors: string[] = [];
        let allValid = true;

        for (const stepDef of this.steps) {
          if (stepDef.condition && !(stepDef.condition(currentContext, initialInput))) {
            continue;
          }

          const stepResult = await stepDef.step(currentContext, initialInput);
          currentOutput = { ...currentOutput, ...stepResult.output };

          if (!stepResult.result.isValid) {
            allErrors.push(...stepResult.result.errors);
            allValid = false;
          }
          currentContext = {
            ...currentContext,
            ...stepResult.result.context,
          };
        }

        return {
          isValid: allValid,
          errors: allErrors,
          context: currentContext,
        };
      },
    };
  }
}

export const createValidationChainBuilder = (): StructuredToolOutputValidationChainBuilder => {
  return new StructuredToolOutputValidationChainBuilder();
};