import { AgentContext } from "../context/agent-context";

export interface FailureReport {
  error: Error;
  context: Record<string, any>;
  failedStep: string;
  attemptCount: number;
}

export interface RemediationStep {
  action: "retry" | "scope_adjustment" | "external_check" | "halt";
  details: string;
  parameters?: Record<string, unknown>;
}

export interface RemediationPlan {
  diagnosis: string;
  confidenceScore: number;
  steps: RemediationStep[];
}

export class FailureAnalysisService {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  private analyzeError(report: FailureReport): { diagnosis: string; confidence: number } {
    const errorName = report.error.name;
    const errorMessage = report.error.message;

    if (errorName === "TimeoutError" && report.attemptCount < 3) {
      return {
        diagnosis: "The operation timed out. This suggests transient network issues or resource contention. A controlled retry with backoff is recommended.",
        confidence: 0.85,
      };
    }

    if (errorMessage.includes("Permission denied")) {
      return {
        diagnosis: "The failure is due to insufficient permissions. Review the required scopes or credentials for the current step.",
        confidence: 0.95,
      };
    }

    if (report.failedStep.includes("database") && report.attemptCount >= 3) {
      return {
        diagnosis: "Multiple attempts failed on the database step. The underlying data structure or schema might be incorrect, requiring a scope adjustment or manual data validation.",
        confidence: 0.90,
      };
    }

    return {
      diagnosis: `Unspecified failure (${errorName}): ${errorMessage}. Further investigation into the context is required.`,
      confidence: 0.6,
    };
  }

  private determineSteps(report: FailureReport): RemediationStep[] {
    const steps: RemediationStep[] = [];

    if (report.error instanceof ReferenceError) {
      steps.push({
        action: "scope_adjustment",
        details: "The failure suggests a variable or dependency was not defined in the current scope. Review the input parameters for the failed step.",
      });
    } else if (report.error instanceof TypeError && report.attemptCount < 2) {
      steps.push({
        action: "retry",
        details: "The type mismatch might be transient. Attempting a retry with minor input sanitization.",
        parameters: { maxRetries: 1 },
      });
    } else if (report.attemptCount >= 3) {
      steps.push({
        action: "halt",
        details: "The failure has persisted across multiple attempts. Halting execution to prevent cascading errors and requiring human intervention.",
      });
    } else {
      steps.push({
        action: "external_check",
        details: "The failure might be due to an external service status. Check the status of dependent APIs.",
      });
    }

    return steps;
  }

  public async analyzeFailure(report: FailureReport): Promise<RemediationPlan> {
    const { diagnosis: initialDiagnosis, confidence: initialConfidence } = this.analyzeError(report);
    const steps = this.determineSteps(report);

    const finalPlan: RemediationPlan = {
      diagnosis: initialDiagnosis,
      confidenceScore: initialConfidence,
      steps: steps,
    };

    return finalPlan;
  }
}

export { FailureAnalysisService };