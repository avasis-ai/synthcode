import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalResourceConstraint {
  max_latency_ms: number;
  required_precision: 'high' | 'medium' | 'low';
  resource_budget_bytes: number;
}

export interface ContextualMetadata {
  user_focus_area: string;
  session_history_length: number;
  current_user_intent: string;
}

export interface ContextualStateDiffPayload {
  diff_summary: string;
  prioritized_updates: {
    key: string;
    value: any;
    score: number;
    reason: string;
  }[];
  is_significant_change: boolean;
}

abstract class BaseStateDiffingService {
  abstract diff(oldState: any, newState: any): any;
}

export class ContextualStateDiffingV16 extends BaseStateDiffingService {
  private constraints: TemporalResourceConstraint;
  private metadata: ContextualMetadata;

  constructor(constraints: TemporalResourceConstraint, metadata: ContextualMetadata) {
    super();
    this.constraints = constraints;
    this.metadata = metadata;
  }

  diff(oldState: any, newState: any): ContextualStateDiffPayload {
    const rawDiff = this.calculateRawDiff(oldState, newState);
    const scoredUpdates = this.scoreUpdates(rawDiff);
    const payload: ContextualStateDiffPayload = this.generatePayload(scoredUpdates);
    return payload;
  }

  private calculateRawDiff(oldState: any, newState: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of keys) {
      if (typeof oldState[key] === 'undefined' && typeof newState[key] === 'undefined') continue;

      if (typeof oldState[key] === 'undefined' && typeof newState[key] !== 'undefined') {
        diff[key] = { added: newState[key] };
      } else if (typeof oldState[key] !== 'undefined' && typeof newState[key] === 'undefined') {
        diff[key] = { removed: oldState[key] };
      } else if (oldState[key] !== newState[key]) {
        diff[key] = { old: oldState[key], new: newState[key] };
      }
    }
    return diff;
  }

  private scoreUpdates(rawDiff: Record<string, any>): { key: string; value: any; score: number; reason: string; }[] {
    const scored: { key: string; value: any; score: number; reason: string; }[] = [];

    for (const key in rawDiff) {
      const diff = rawDiff[key];
      let score = 0;
      let reason = "";
      let value: any = null;

      if (diff.added) {
        score = 1.0 + (this.metadata.user_focus_area.includes(key) ? 0.5 : 0);
        reason = `New addition in focus area.`;
        value = diff.added;
      } else if (diff.removed) {
        score = 0.5;
        reason = `Data removal detected.`;
        value = diff.removed;
      } else if (diff.old !== undefined && diff.new !== undefined) {
        const valueChange = JSON.stringify(diff.old) !== JSON.stringify(diff.new);
        if (valueChange) {
          score = 1.5 + (this.constraints.required_precision === 'high' ? 1.0 : 0);
          reason = `Significant change detected (${this.constraints.required_precision} precision required).`;
          value = diff.new;
        } else {
          continue;
        }
      }

      if (score > 0) {
        scored.push({ key, value: value, score, reason });
      }
    }

    // Apply resource constraint penalty/bonus
    const resourcePenalty = Math.min(1.0, this.constraints.resource_budget_bytes / 1000);
    scored.forEach(item => {
      item.score *= (1.0 + resourcePenalty * 0.2);
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  private generatePayload(scoredUpdates: { key: string; value: any; score: number; reason: string; }[]): ContextualStateDiffPayload {
    const significantChange = scoredUpdates.length > 0 && scoredUpdates[0].score > 1.0;
    const summary = `Contextual diff calculated. Found ${scoredUpdates.length} prioritized updates. Significance: ${significantChange ? 'High' : 'Low'}.`;

    return {
      diff_summary: summary,
      prioritized_updates: scoredUpdates,
      is_significant_change: significantChange,
    };
  }
}