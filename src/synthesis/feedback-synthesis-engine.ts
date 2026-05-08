import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface FeedbackSource {
  sourceType: "CONFLICT" | "FAILURE" | "OBSERVATION" | "REVIEW";
  severity: Severity;
  description: string;
  suggestedAdjustment: string;
  weight: number;
}

export interface SynthesisReport {
  overallConfidenceScore: number;
  primaryAction: string;
  recommendedPlanAdjustment: string;
  weightedSources: {
    sourceType: FeedbackSource["sourceType"];
    weight: number;
    summary: string;
  }[];
}

class SynthesisEngine {
  private static readonly SOURCE_WEIGHTS: Record<FeedbackSource["sourceType"], number> = {
    CONFLICT: 0.4,
    FAILURE: 0.5,
    OBSERVATION: 0.2,
    REVIEW: 0.1,
  };

  private static getSeverityWeight(severity: Severity): number {
    switch (severity) {
      case "CRITICAL":
        return 1.5;
      case "HIGH":
        return 1.2;
      case "MEDIUM":
        return 1.0;
      case "LOW":
        return 0.8;
    }
  }

  private static calculateSourceScore(source: FeedbackSource): number {
    const typeWeight = SynthesisEngine.SOURCE_WEIGHTS[source.sourceType] || 0.1;
    const severityWeight = SynthesisEngine.getSeverityWeight(source.severity);
    return typeWeight * severityWeight;
  }

  public synthesize(feedbackSources: FeedbackSource[]): SynthesisReport {
    if (!feedbackSources || feedbackSources.length === 0) {
      return {
        overallConfidenceScore: 0.1,
        primaryAction: "No feedback provided. Proceed with current plan.",
        recommendedPlanAdjustment: "No adjustments necessary.",
        weightedSources: [],
      };
    }

    let totalScore = 0;
    const weightedSources: {
      sourceType: FeedbackSource["sourceType"];
      weight: number;
      summary: string;
    }[] = [];

    for (const source of feedbackSources) {
      const score = SynthesisEngine.calculateSourceScore(source);
      totalScore += score;

      weightedSources.push({
        sourceType: source.sourceType,
        weight: score,
        summary: `${source.sourceType} (${source.severity}): ${source.description} -> Suggestion: ${source.suggestedAdjustment}`,
      });
    }

    // Sort sources by weight descending
    weightedSources.sort((a, b) => b.weight - a.weight);

    // Determine primary action and adjustment based on the highest weighted source
    const primarySource = weightedSources[0];
    let primaryAction = "Review all feedback.";
    let recommendedAdjustment = "Implement the most critical suggestion.";

    if (primarySource) {
      if (primarySource.sourceType === "FAILURE") {
        primaryAction = "Immediate Plan Halt and Root Cause Analysis.";
        recommendedAdjustment = `Failure detected. Focus on mitigating the cause described: ${primarySource.summary}`;
      } else if (primarySource.sourceType === "CONFLICT") {
        primaryAction = "Reconcile Conflicting Inputs.";
        recommendedAdjustment = `Conflict detected. Prioritize the adjustment suggested by the highest weighted source: ${primarySource.summary}`;
      } else if (primarySource.sourceType === "OBSERVATION") {
        primaryAction = "Minor Plan Refinement.";
        recommendedAdjustment = `Observation noted. Consider incorporating the suggested refinement: ${primarySource.summary}`;
      } else {
        primaryAction = "General Review and Confirmation.";
        recommendedAdjustment = `General feedback received. Proceed with caution and verify assumptions.`;
      }
    }

    // Confidence score is normalized total score (max possible score is roughly 0.5 * 1.5 * N)
    // We normalize it to a 0.0 to 1.0 range based on the total score relative to a theoretical maximum.
    const overallConfidenceScore = Math.min(1.0, totalScore / (feedbackSources.length * 2.5));


    return {
      overallConfidenceScore: parseFloat(overallConfidenceScore.toFixed(2)),
      primaryAction: primaryAction,
      recommendedPlanAdjustment: recommendedAdjustment,
      weightedSources: weightedSources,
    };
  }
}

export { SynthesisEngine };