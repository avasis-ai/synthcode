import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface TemporalContext {
  timestamp: number;
  user_focus_area: string;
  recent_keywords: string[];
}

interface StateDiffReport {
  structural_diff: Record<string, any>;
  semantic_score: number;
  weighted_difference: Record<string, any>;
}

abstract class BaseStateDiffingService {
  abstract diff(oldState: any, newState: any, context?: any): StateDiffReport;
}

class ContextualStateDiffingV11 extends BaseStateDiffingService {
  private calculateSemanticSimilarity(state1: any, state2: any): number {
    const serialize = (state: any): string => JSON.stringify(state);
    const vec1 = this.vectorize(serialize(state1));
    const vec2 = this.vectorize(serialize(state2));

    if (vec1.length === 0 || vec2.length === 0) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
      dotProduct += vec1[i] * vec2[i];
    }

    for (let i = 0; i < vec1.length; i++) {
      magnitude1 += vec1[i] * vec1[i];
    }
    for (let i = 0; i < vec2.length; i++) {
      magnitude2 += vec2[i] * vec2[i];
    }

    return Math.sqrt(dotProduct) / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  private vectorize(text: string): number[] {
    // Simple frequency vectorization based on character presence for demonstration
    const chars = text.toLowerCase().split('');
    const vocab = new Set<string>();
    chars.forEach(char => vocab.add(char));
    const vocabArray = Array.from(vocab).sort();
    const vector: number[] = vocabArray.map(char => 0);

    for (const char of chars) {
      const index = vocabArray.indexOf(char);
      if (index !== -1) {
        vector[index] += 1;
      }
    }
    return vector;
  }

  private calculateStructuralDiff(oldState: any, newState: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of keys) {
      const oldValue = oldState[key];
      const newValue = newState[key];

      if (oldValue === undefined && newValue !== undefined) {
        diff[key] = { added: newValue };
      } else if (oldValue !== undefined && newValue === undefined) {
        diff[key] = { removed: oldValue };
      } else if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        const nestedDiff = this.calculateStructuralDiff(oldValue, newValue);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (oldValue !== newValue) {
        diff[key] = { changed: { old: oldValue, new: newValue } };
      }
    }
    return diff;
  }

  public diff(oldState: any, newState: any, context?: TemporalContext): StateDiffReport {
    const structuralDiff = this.calculateStructuralDiff(oldState, newState);
    const semanticScore = this.calculateSemanticSimilarity(oldState, newState);

    let weightedDifference: Record<string, any> = {};

    if (context) {
      const contextWeightFactor = context.user_focus_area ? 1.5 : 1.0;
      const keywordMatchBonus = context.recent_keywords.some(kw => JSON.stringify(newState).toLowerCase().includes(kw.toLowerCase())) ? 0.2 : 0;

      for (const key in structuralDiff) {
        const diffItem = structuralDiff[key];
        let weight = 1.0;

        if (key.includes("content") || key.includes("text")) {
          weight = contextWeightFactor * 1.5;
        } else if (key.includes("tool_use")) {
          weight = contextWeightFactor * 1.2;
        }

        const finalWeight = Math.max(1.0, weight + keywordMatchBonus);

        if (diffItem.changed) {
          weightedDifference[key] = {
            ...diffItem,
            weight: finalWeight,
            context_impact: `Contextual weight applied: ${finalWeight.toFixed(2)}`,
          };
        } else if (diffItem.added) {
          weightedDifference[key] = {
            ...diffItem,
            weight: finalWeight * 0.8,
            context_impact: `Contextual weight applied: ${finalWeight.toFixed(2)}`,
          };
        }
      }
    } else {
      weightedDifference = structuralDiff;
    }

    return {
      structural_diff: structuralDiff,
      semantic_score: parseFloat(semanticScore.toFixed(4)),
      weighted_difference: weightedDifference,
    };
  }
}

export const ContextualStateDiffingV11 = new ContextualStateDiffingV11();