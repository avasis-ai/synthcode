import { Message, ContentBlock, TextBlock } from "./types";

export interface FeedbackPayload {
  critique: string;
  failureReport: string;
  currentContext: Message[];
  relevanceScore: number;
}

export interface CorrectionPlan {
  rootCauseAnalysis: string;
  steps: string[];
  contextInjectionInstructions: string;
}

export class RefinementEngine {
  constructor() {}

  private analyzeRootCause(payload: FeedbackPayload): string {
    return `[RCA] Analyzing feedback: Critique=${payload.critique.substring(0, 50)}... Failure=${payload.failureReport.substring(0, 50)}...`;
  }

  private generateCorrectionPlan(payload: FeedbackPayload, rootCause: string): CorrectionPlan {
    const steps: string[] = [
      "Review the root cause identified.",
      "Adjust the planning steps based on the critique.",
      "Re-execute the goal arbitration with the refined context."
    ];

    return {
      rootCauseAnalysis: rootCause,
      steps: steps,
      contextInjectionInstructions: `The agent must prioritize the following constraints: ${payload.critique}.`,
    };
  }

  public processFeedback(payload: FeedbackPayload): CorrectionPlan {
    const rootCause = this.analyzeRootCause(payload);
    const plan = this.generateCorrectionPlan(payload, rootCause);
    return plan;
  }

  public injectPlan(plan: CorrectionPlan, context: Message[]): Message[] {
    const refinedContext: Message[] = [...context];

    const injectionBlock: TextBlock = {
      type: "text",
      text: `[SYSTEM INJECTION: REFINEMENT PLAN]\nRoot Cause: ${plan.rootCauseAnalysis}\nSteps: ${plan.steps.join(' -> ')}\nInstructions: ${plan.contextInjectionInstructions}`,
    };

    const newContext: Message[] = [...context];
    newContext.push({
      role: "system",
      content: [injectionBlock],
    });

    return newContext;
  }
}

export { RefinementEngine };