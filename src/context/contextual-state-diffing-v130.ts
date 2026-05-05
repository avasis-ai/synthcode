import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface StateDiffPayload {
  rawDiff: Record<string, any>;
  temporalMetadata: {
    timestamp: number;
    timeDeltaMs: number;
  };
  causalMetadata: {
    causalChainId: string;
    influencingEvents: string[];
  };
}

export interface ContextualStateDiffReport {
  payload: StateDiffPayload;
  significanceScore: number;
  summary: string;
  isSignificant: boolean;
}

export class ContextualStateDiffingV130 {
  private readonly contextAnchors: {
    goal: string;
    history: Message[];
    currentGoalFocus: string;
  };

  constructor(contextAnchors: {
    goal: string;
    history: Message[];
    currentGoalFocus: string;
  }) {
    this.contextAnchors = contextAnchors;
  }

  private calculateSignificance(
    rawDiff: Record<string, any>,
    payload: StateDiffPayload
  ): { score: number; summary: string; isSignificant: boolean } {
    let score = 0;
    let summary = "No significant changes detected.";

    if (Object.keys(rawDiff).length === 0) {
      return { score: 0, summary: "State is identical.", isSignificant: false };
    }

    const diffKeys = Object.keys(rawDiff);
    let significantChanges = 0;

    for (const key of diffKeys) {
      const diffValue = rawDiff[key];
      if (typeof diffValue === 'string' && diffValue.length > 0) {
        if (key.includes("error") || key.includes("failure")) {
          score += 0.3;
          summary += `[Error Detected in ${key}]. `;
          significantChanges++;
        } else if (key.includes("goal") || key.includes("focus")) {
          score += 0.5;
          summary += `[Goal Shift Detected in ${key}]. `;
          significantChanges++;
        } else {
          score += 0.1;
          significantChanges++;
        }
      }
    }

    // Incorporate temporal/causal context into score
    if (payload.temporalMetadata.timeDeltaMs > 5000) {
      score += 0.2;
      summary += " (Large time gap suggests external intervention). ";
    }
    if (payload.causalMetadata.influencingEvents.length > 0) {
      score += 0.15;
      summary += ` (Influenced by ${payload.causalMetadata.influencingEvents.length} events). `;
    }

    const finalScore = Math.min(1.0, score);
    const isSignificant = finalScore > 0.4;

    return {
      score: finalScore,
      summary: summary.trim(),
      isSignificant: isSignificant,
    };
  }

  public generateReport(
    currentState: any,
    previousState: any,
    context: {
      timestamp: number;
      timeDeltaMs: number;
      causalChainId: string;
      influencingEvents: string[];
    }
  ): ContextualStateDiffReport {
    // Simple deep diff simulation for demonstration
    const rawDiff: Record<string, any> = this.deepDiff(previousState, currentState);

    const payload: StateDiffPayload = {
      rawDiff: rawDiff,
      temporalMetadata: {
        timestamp: context.timestamp,
        timeDeltaMs: context.timeDeltaMs,
      },
      causalMetadata: {
        causalChainId: context.causalChainId,
        influencingEvents: context.influencingEvents,
      },
    };

    const { score, summary, isSignificant } = this.calculateSignificance(
      rawDiff,
      payload
    );

    return {
      payload: payload,
      significanceScore: score,
      summary: summary,
      isSignificant: isSignificant,
    };
  }

  private deepDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
        const nestedDiff = this.deepDiff(val1, val2);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (val1 !== val2) {
        diff[key] = {
          old: val1,
          new: val2,
        };
      }
    }
    return diff;
  }
}

export { ContextualStateDiffingV130 };