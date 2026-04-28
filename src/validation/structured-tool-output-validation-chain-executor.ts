import { Message } from "./message-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
}

export type ValidationStep = (output: Record<string, unknown>) => ValidationResult;

export class StructuredToolOutputValidationChainExecutor {
  private readonly steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  execute(output: Record<string, unknown>): { finalResult: ValidationResult; executionLog: { stepName: string; result: ValidationResult }[] } {
    const executionLog: { stepName: string; result: ValidationResult }[] = [];
    let currentOutput: Record<string, unknown> = { ...output };
    let overallSuccess = true;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const stepName = `Step ${i + 1}`;

      try {
        const result = step(currentOutput);
        executionLog.push({ stepName, result });

        if (!result.isValid) {
          overallSuccess = false;
          // In a real-world scenario, we might decide whether to continue or break here.
          // For this implementation, we log the failure but continue to allow for comprehensive logging.
        }
      } catch (error) {
        overallSuccess = false;
        executionLog.push({
          stepName: stepName,
          result: {
            isValid: false,
            errors: [`Execution failed: ${(error as Error).message}`],
          },
        });
        // Stop on critical runtime failure
        break;
      }
    }

    const finalResult: ValidationResult = {
      isValid: overallSuccess,
      errors: overallSuccess ? [] : this.steps.map((_, index) => {
        const log = executionLog[index];
        return log ? log.result.errors.join("; ") : "Unknown validation failure";
      }),
      context: currentOutput,
    };

    return { finalResult, executionLog };
  }
}