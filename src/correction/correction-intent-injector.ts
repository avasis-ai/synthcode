import { Message, ContentBlock, TextBlock } from "./types";

export interface AgentContext {
  currentGoal: string;
  constraints: Record<string, string>;
  history: Message[];
  plannedSteps: string[];
}

export interface CorrectionIntent {
  correctedGoal: string;
  modifiedConstraints: Record<string, string>;
  confidenceScore: number;
  source: string;
}

export class CorrectionIntentInjector {
  private readonly defaultConfidence: number = 0.8;

  constructor() {}

  private analyzeFeedbackToIntent(rawFeedback: string, source: string): CorrectionIntent {
    // In a real implementation, this method would call an LLM endpoint
    // with a structured prompt to reliably extract the intent.
    // For this simulation, we use simple heuristic parsing.

    let correctedGoal = rawFeedback;
    let modifiedConstraints = {};

    if (rawFeedback.toLowerCase().includes("must not")) {
      // Simple extraction simulation for constraints
      const constraintMatch = rawFeedback.match(/must not (.*)/i);
      if (constraintMatch && constraintMatch[1]) {
        modifiedConstraints["exclusion"] = constraintMatch[1].trim();
      }
    }

    if (rawFeedback.toLowerCase().includes("instead")) {
      // Simple extraction simulation for goals
      const goalMatch = rawFeedback.match(/instead of (.*)/i);
      if (goalMatch && goalMatch[1]) {
        correctedGoal = goalMatch[1].trim();
      }
    }

    return {
      correctedGoal: correctedGoal || "No specific goal correction provided.",
      modifiedConstraints: modifiedConstraints,
      confidenceScore: this.defaultConfidence,
      source: source,
    };
  }

  private mergeIntentIntoContext(context: AgentContext, intent: CorrectionIntent): AgentContext {
    const newContext: AgentContext = {
      currentGoal: intent.correctedGoal,
      constraints: {
        ...context.constraints,
        ...intent.modifiedConstraints,
      },
      history: [...context.history],
      plannedSteps: context.plannedSteps, // Steps might need recalculation, but we keep them for now
    };

    return newContext;
  }

  /**
   * Processes raw, unstructured feedback into a structured CorrectionIntent and applies it
   * to the current AgentContext, providing immediate course correction.
   * @param rawFeedback The raw text feedback (e.g., "Wait, you missed X, and must not do Y.").
   * @param source The origin of the feedback (e.g., "User", "ExternalMonitor").
   * @param context The current state of the agent.
   * @returns The updated AgentContext after applying the correction.
   */
  processCorrection(
    rawFeedback: string,
    source: string,
    context: AgentContext
  ): AgentContext {
    if (!rawFeedback || rawFeedback.trim() === "") {
      return context;
    }

    const intent = this.analyzeFeedbackToIntent(rawFeedback, source);

    console.log(`[Injector] Detected Correction Intent from ${source}. Confidence: ${intent.confidenceScore.toFixed(2)}`);

    return this.mergeIntentIntoContext(context, intent);
  }
}