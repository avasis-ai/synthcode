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

export interface ContextualStateDiffPayload {
  structuralDiff: Record<string, any>;
  semanticDiff: Record<string, any>;
  temporalDiff: Record<string, any>;
}

export interface ContextualStateDiffReport {
  payload: ContextualStateDiffPayload;
  isDriftDetected: boolean;
  summary: string;
}

export interface ContextualRules {
  [key: string]: (currentState: any, nextState: any) => {
    semanticImpact: string;
    isCritical: boolean;
  };
}

export class ContextualStateDiffingV17Service {
  private readonly rules: ContextualRules;

  constructor(rules: ContextualRules) {
    this.rules = rules;
  }

  private diffStructure(currentState: any, nextState: any): Record<string, any> {
    const structuralDiff: Record<string, any> = {};
    const keysCurrent = Object.keys(currentState);
    const keysNext = Object.keys(nextState);

    const allKeys = new Set([...keysCurrent, ...keysNext]);

    for (const key of allKeys) {
      const current = currentState[key];
      const next = nextState[key];

      if (current === undefined && next !== undefined) {
        structuralDiff[key] = { status: "ADDED", value: next };
      } else if (current !== undefined && next === undefined) {
        structuralDiff[key] = { status: "REMOVED", value: current };
      } else if (typeof current !== typeof next || JSON.stringify(current) !== JSON.stringify(next)) {
        structuralDiff[key] = { status: "MODIFIED", oldValue: current, newValue: next };
      }
    }
    return structuralDiff;
  }

  private diffSemantics(currentState: any, nextState: any): Record<string, any> {
    const semanticDiff: Record<string, any> = {};
    for (const key in this.rules) {
      if (Object.prototype.hasOwnProperty.call(this.rules, key)) {
        const rule = this.rules[key];
        const result = rule(currentState, nextState);
        semanticDiff[key] = {
          impact: result.semanticImpact,
          isCritical: result.isCritical,
        };
      }
    }
    return semanticDiff;
  }

  private diffTemporal(currentState: any, nextState: any): Record<string, any> {
    // Placeholder for time-based drift detection (e.g., time elapsed between states)
    const temporalDiff: Record<string, any> = {
      timeDeltaMs: (Date.now() - (currentState.timestamp || 0)),
      sequenceGap: (nextState.sequenceId && currentState.sequenceId) ? Math.abs(nextState.sequenceId - currentState.sequenceId) : null,
    };
    return temporalDiff;
  }

  public generateDiffReport(
    currentState: any,
    nextState: any,
  ): ContextualStateDiffReport {
    const structuralDiff = this.diffStructure(currentState, nextState);
    const semanticDiff = this.diffSemantics(currentState, nextState);
    const temporalDiff = this.diffTemporal(currentState, nextState);

    const payload: ContextualStateDiffPayload = {
      structuralDiff,
      semanticDiff,
      temporalDiff,
    };

    const isDriftDetected =
      Object.keys(structuralDiff).length > 0 ||
      Object.keys(semanticDiff).some((key: string) =>
        (semanticDiff[key] as any).isCritical === true
      ) ||
      (temporalDiff.timeDeltaMs && temporalDiff.timeDeltaMs > 10000);

    let summary = "No significant drift detected.";
    if (isDriftDetected) {
      summary = `Drift detected. Structural changes: ${Object.keys(structuralDiff).length}. Critical semantic changes: ${Object.values(semanticDiff).filter((d: any) => d.isCritical).length}.`;
    }

    return {
      payload,
      isDriftDetected,
      summary,
    };
  }
}