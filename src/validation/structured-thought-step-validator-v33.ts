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

export interface StepContext {
  previousStepOutput: any;
  globalContext: Record<string, unknown>;
}

export interface StepValidator<T> {
  validate(input: T, context: StepContext): { isValid: boolean; errors: string[] };
}

export interface StructuredThoughtStepValidator {
  validateSequence(
    steps: {
      input: any;
      validator: StepValidator<any>;
      context: StepContext;
    }[],
  ): { isValid: boolean; report: { stepIndex: number; errors: string[]; message: string }[] };
}

export class StructuredThoughtStepValidatorV33 implements StructuredThoughtStepValidator {
  validateSequence(
    steps: {
      input: any;
      validator: StepValidator<any>;
      context: StepContext;
    }[],
  ): { isValid: boolean; report: { stepIndex: number; errors: string[]; message: string }[] } {
    const report: { stepIndex: number; errors: string[]; message: string }[] = [];
    let overallValid = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepIndex = i;
      const stepReport: { errors: string[]; message: string } = {
        errors: [],
        message: "",
      };

      // 1. Validate the current step's input against its specific validator
      const validationResult = step.validator.validate(step.input, step.context);
      if (!validationResult.isValid) {
        stepReport.errors.push(...validationResult.errors);
        stepReport.message = `Validation failed for step ${stepIndex}.`;
        overallValid = false;
      }

      // 2. Inter-step consistency check (N -> N+1)
      if (i > 0) {
        const previousStep = steps[i - 1];
        const currentStep = steps[i];

        // Simulate checking if the output of the previous step constrains the current input
        const previousOutput = previousStep.validator.validate(
          previousStep.input,
          {
            previousStepOutput: undefined, // Placeholder, actual logic would use the result
            globalContext: step.context.globalContext,
          }
        );

        // In a real scenario, we would compare previousOutput's derived constraints
        // against currentStep.input's structure. Here, we simulate a check.
        if (previousOutput.isValid && currentStep.input && typeof currentStep.input === 'object' && Object.keys(currentStep.input).length > 0) {
          // Example constraint check: If step N-1 produced a 'resultId', step N must use it.
          if (previousStep.input && (previousStep.input as any).resultId && !('resultId' in currentStep.input)) {
            stepReport.errors.push(
              `Inter-step inconsistency: Step ${i} input must reference resultId from step ${i-1}.`
            );
            overallValid = false;
          }
        }
      }

      if (stepReport.errors.length > 0) {
        report.push({
          stepIndex: stepIndex,
          errors: stepReport.errors,
          message: stepReport.message,
        });
      }
    }

    return {
      isValid: overallValid,
      report: report,
    };
  }
}