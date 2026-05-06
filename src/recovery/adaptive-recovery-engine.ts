import { Message } from "./types";

type FailureType = "RateLimit" | "SchemaMismatch" | "ToolFailure" | "Unknown";

interface FailureContext {
  type: FailureType;
  message: string;
  originalAttempt: any;
  attemptCount: number;
}

type RecoveryStepAction = (context: FailureContext) => Promise<{ success: boolean; result: any; nextFailure?: FailureContext }>;

interface RecoveryPolicy {
  [failureType: string]: RecoveryStepAction[];
}

export class AdaptiveRecoveryEngine {
  private policyGraph: RecoveryPolicy;

  constructor(policyGraph: RecoveryPolicy) {
    this.policyGraph = policyGraph;
  }

  private async executeStep(step: RecoveryStepAction, context: FailureContext): Promise<{ success: boolean; result: any; nextFailure?: FailureContext }> {
    try {
      const result = await step(context);
      return result;
    } catch (error) {
      console.error("Error executing recovery step:", error);
      return { success: false, result: null, nextFailure: { type: "Unknown", message: String(error), originalAttempt: null, attemptCount: context.attemptCount + 1 } };
    }
  }

  public async runRecovery(failureContext: FailureContext): Promise<{ success: boolean; finalResult: any; remainingContext: FailureContext | null }> {
    let currentContext: FailureContext = {
      type: failureContext.type,
      message: failureContext.message,
      originalAttempt: failureContext.originalAttempt,
      attemptCount: failureContext.attemptCount,
    };

    const steps = this.policyGraph[currentContext.type];

    if (!steps || steps.length === 0) {
      return { success: false, finalResult: null, remainingContext: currentContext };
    }

    let lastResult: { success: boolean; result: any; nextFailure?: FailureContext } | null = null;

    for (const step of steps) {
      const result = await this.executeStep(step, currentContext);
      lastResult = result;

      if (result.success) {
        if (result.nextFailure) {
          currentContext = result.nextFailure;
        } else {
          return { success: true, finalResult: result.result, remainingContext: null };
        }
      } else {
        // Step failed, check if it provides a new failure context to continue the graph traversal
        if (result.nextFailure) {
          currentContext = result.nextFailure;
        } else {
          return { success: false, finalResult: null, remainingContext: currentContext };
        }
      }
    }

    return { success: false, finalResult: lastResult?.result, remainingContext: currentContext };
  }
}