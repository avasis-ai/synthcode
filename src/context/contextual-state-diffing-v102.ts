import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContextualDiffReport {
  structuralDiff: Record<string, any>;
  semanticScore: number;
  temporalWeight: number;
  overallContextualDifference: number;
}

interface StateSnapshot {
  state: Record<string, any>;
  timestamp: number;
}

export class ContextualStateDiffer {
  private readonly DECAY_RATE: number;
  private readonly SEMANTIC_WEIGHT: number;

  constructor(decayRate: number = 0.01, semanticWeight: number = 0.6) {
    this.DECAY_RATE = decayRate;
    this.SEMANTIC_WEIGHT = semanticWeight;
  }

  private calculateSemanticSimilarity(fieldA: any, fieldB: any): number {
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      // Placeholder for actual embedding comparison (e.g., cosine similarity)
      // For this implementation, we use a simple length-based heuristic.
      const maxLength = Math.max(fieldA.length, fieldB.length);
      if (maxLength === 0) return 1.0;
      return Math.min(1.0, Math.abs(fieldA.length - fieldB.length) / maxLength * 1.5 + 0.5);
    }
    if (typeof fieldA === 'object' && fieldA !== null && typeof fieldB === 'object' && fieldB !== null) {
      // Recursive deep comparison for objects
      let totalScore = 0;
      let count = 0;
      for (const key in fieldA) {
        if (Object.prototype.hasOwnProperty.call(fieldA, key)) {
          const score = this.calculateSemanticSimilarity(
            (fieldA as any)[key],
            (fieldB as any)[key]
          );
          totalScore += score;
          count++;
        }
      }
      return count > 0 ? totalScore / count : 1.0;
    }
    return 1.0; // Default for non-comparable types or identical primitives
  }

  private calculateTemporalWeight(timeDiffMs: number): number {
    // Weight decays exponentially: weight = e^(-rate * time_diff)
    return Math.exp(-this.DECAY_RATE * timeDiffMs / 1000);
  }

  public diff(
    previousState: StateSnapshot,
    currentState: StateSnapshot
  ): ContextualDiffReport {
    const timeDiffMs = currentState.timestamp - previousState.timestamp;

    // 1. Structural Diff (Simple comparison)
    const structuralDiff: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(previousState.state), ...Object.keys(currentState.state)]);

    for (const key of allKeys) {
      const prevVal = (previousState.state as any)[key];
      const currVal = (currentState.state as any)[key];

      if (prevVal !== currVal) {
        structuralDiff[key] = {
          previous: prevVal,
          current: currVal,
        };
      }
    }

    // 2. Semantic Score Calculation
    let totalSemanticScore = 0;
    let comparableFieldsCount = 0;

    const stateKeys = Object.keys(previousState.state).filter(
      (key) => Object.prototype.hasOwnProperty.call(currentState.state, key)
    );

    for (const key of stateKeys) {
      const prevVal = (previousState.state as any)[key];
      const currVal = (currentState.state as any)[key];

      const score = this.calculateSemanticSimilarity(prevVal, currVal);
      totalSemanticScore += score;
      comparableFieldsCount++;
    }

    const averageSemanticScore = comparableFieldsCount > 0 ? totalSemanticScore / comparableFieldsCount : 1.0;

    // 3. Temporal Weight Calculation
    const temporalWeight = this.calculateTemporalWeight(timeDiffMs);

    // 4. Overall Contextual Difference (Weighted combination)
    // We normalize the semantic score (0 to 1) and combine it with the temporal weight.
    const overallContextualDifference = (
      (averageSemanticScore * this.SEMANTIC_WEIGHT) + (temporalWeight * (1 - this.SEMANTIC_WEIGHT))
    );

    return {
      structuralDiff,
      semanticScore: averageSemanticScore,
      temporalWeight: temporalWeight,
      overallContextualDifference: overallContextualDifference,
    };
  }
}