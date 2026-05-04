import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextualContext {
  timestamp: number;
  previous_state: any;
  current_state: any;
  context_metadata: Record<string, unknown>;
}

export interface StateDiff {
  is_different: boolean;
  diff_details: Record<string, any>;
  semantic_drift_detected: boolean;
  temporal_inconsistency: boolean;
}

export class ContextualStateDiffer {
  private context: ContextualContext;

  constructor(context: ContextualContext) {
    this.context = context;
  }

  private compareNodes(oldNode: any, newNode: any): { diff: boolean; details: Record<string, any> } {
    if (!oldNode || !newNode) {
      return { diff: true, details: { missing: true } };
    }

    const keys = new Set([...Object.keys(oldNode), ...Object.keys(newNode)]);
    const details: Record<string, any> = {};
    let hasDiff = false;

    for (const key of keys) {
      const oldValue = oldNode[key];
      const newValue = newNode[key];

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          const arrayDiff = this.compareArrays(oldValue, newValue);
          details[key] = arrayDiff;
          if (arrayDiff.diff) hasDiff = true;
        } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
          const nestedDiff = this.compareNodes(oldValue, newValue);
          details[key] = nestedDiff;
          if (nestedDiff.diff) hasDiff = true;
        } else {
          details[key] = { diff: true, reason: "Type mismatch or complex object change" };
          hasDiff = true;
        }
      } else if (oldValue !== newValue) {
        details[key] = { old: oldValue, new: newValue };
        hasDiff = true;
      }
    }

    return { diff: hasDiff, details };
  }

  private compareArrays(oldArray: any[], newArray: any[]): { diff: boolean; details: Record<string, any> } {
    if (oldArray.length !== newArray.length) {
      return { diff: true, details: { length_changed: true } };
    }

    const details: Record<string, any> = {};
    let hasDiff = false;

    for (let i = 0; i < oldArray.length; i++) {
      const itemDiff = this.compareNodes(oldArray[i], newArray[i]);
      details[`[${i}]`] = itemDiff;
      if (itemDiff.diff) hasDiff = true;
    }

    return { diff: hasDiff, details };
  }

  private checkSemanticDrift(oldState: any, newState: any): boolean {
    // Placeholder for complex semantic graph comparison logic
    // Example: Checking if a 'user_intent' field changed significantly without corresponding 'tool_use'
    if (oldState?.user_intent && newState?.user_intent && oldState.user_intent !== newState.user_intent) {
      // Simple heuristic: if intent changes, but the structure remains the same, flag it.
      return true;
    }
    return false;
  }

  private checkTemporalInconsistency(oldState: any, newState: any): boolean {
    // Placeholder for temporal logic (e.g., time jumps, sequence violations)
    if (newState.timestamp < oldState.timestamp) {
      return true;
    }
    return false;
  }

  public diffState(currentState: any): StateDiff {
    const oldState = this.context.previous_state;
    const newState = currentState;

    if (!oldState) {
      return { is_different: true, diff_details: { initial_load: true }, semantic_drift_detected: false, temporal_inconsistency: false };
    }

    const { diff: structureDiff, details: structureDetails } = this.compareNodes(oldState, newState);

    const semanticDrift = this.checkSemanticDrift(oldState, newState);
    const temporalInconsistency = this.checkTemporalInconsistency(oldState, newState);

    const isDifferent = structureDiff || semanticDrift || temporalInconsistency;

    return {
      is_different: isDifferent,
      diff_details: {
        structure: structureDetails,
        metadata: {
          context_metadata_changed: JSON.stringify(oldState.context_metadata) !== JSON.stringify(newState.context_metadata)
        }
      },
      semantic_drift_detected: semanticDrift,
      temporal_inconsistency: temporalInconsistency,
    };
  }
}

export const createContextualStateDiffingV100 = (context: ContextualContext): ContextualStateDiffer => {
  return new ContextualStateDiffer(context);
};