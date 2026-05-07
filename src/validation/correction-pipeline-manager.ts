export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

export interface ValidationFailure {
  field: string;
  reason: string;
  severity: "error" | "warning";
}

export interface FailureReport {
  failures: ValidationFailure[];
  escalationPath: string;
}

export type PipelineContext = Record<string, unknown>;

export interface CorrectionStep {
  name: string;
  /**
   * Runs the corrective action.
   * @param context The current state/context.
   * @param failure The initial failure that triggered the pipeline.
   * @returns An object containing the updated context and a boolean indicating if the step was successful.
   */
  run(context: PipelineContext, failure: FailureReport): { context: PipelineContext; success: boolean };
  /**
   * Determines if this step should be attempted given the current failure state.
   */
  retryCondition(failure: FailureReport): boolean;
}

export interface Validator {
  /**
   * Validates the final context/output.
   * @param context The final state to validate.
   * @returns An array of failures, or an empty array if valid.
   */
  validate(context: PipelineContext): ValidationFailure[];
}

export class CorrectionPipelineManager {
  private steps: CorrectionStep[];
  private validator: Validator;

  constructor(steps: CorrectionStep[], validator: Validator) {
    if (!steps || steps.length === 0) {
      throw new Error("CorrectionPipelineManager requires at least one CorrectionStep.");
    }
    this.steps = steps;
    this.validator = validator;
  }

  public async execute(initialContext: PipelineContext, initialFailure: FailureReport): Promise<{ finalContext: PipelineContext; success: boolean; report: FailureReport }> {
    let currentContext: PipelineContext = { ...initialContext };
    let currentFailure: FailureReport = { ...initialFailure };
    let stepSuccessful = false;

    for (const step of this.steps) {
      if (!step.retryCondition(currentFailure)) {
        continue;
      }

      try {
        const result = step.run(currentContext, currentFailure);
        currentContext = result.context;
        stepSuccessful = result.success;

        if (!stepSuccessful) {
          // If a step fails, we might update the failure report or just continue to the next step
          // depending on the step's internal logic. For simplicity, we assume the failure report
          // remains the primary guide unless explicitly updated.
        }
      } catch (error) {
        console.error(`Error executing step ${step.name}:`, error);
        // Treat execution failure as a critical failure
        currentFailure = {
          failures: [{ field: "pipeline_execution", reason: `Step ${step.name} failed: ${(error as Error).message}`, severity: "error" }],
          escalationPath: "Manual Review Required"
        };
        break;
      }
    }

    // Final validation after all steps
    const finalFailures = this.validator.validate(currentContext);

    if (finalFailures.length === 0) {
      return { finalContext: currentContext, success: true, report: { failures: [], escalationPath: "Success" } };
    } else {
      // Update the failure report with validation failures
      const finalReport: FailureReport = {
        failures: [...currentFailure.failures, ...finalFailures],
        escalationPath: "Escalation needed due to persistent validation failures."
      };
      return { finalContext: currentContext, success: false, report: finalReport };
    }
  }
}

export { CorrectionPipelineManager, CorrectionStep, Validator, FailureReport, PipelineContext };