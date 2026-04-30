import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalResourceConstraint {
  key: string;
  maxAgeMs: number;
  maxSizeBytes: number;
}

export interface StateDifference {
  key: string;
  oldValue: any;
  newValue: any;
  violation?: {
    constraintKey: string;
    violationType: "temporal" | "resource";
    message: string;
  };
}

export interface ContextualStateDiffReport {
  isDifferent: boolean;
  differences: StateDifference[];
  summary: string;
}

export class ContextualStateDiffingV7 {
  private constraints: TemporalResourceConstraint[];

  constructor(constraints: TemporalResourceConstraint[]) {
    this.constraints = constraints;
  }

  private checkConstraints(key: string, oldValue: any, newValue: any): StateDifference | null {
    const constraints = this.constraints.filter(c => c.key === key);

    if (constraints.length === 0) {
      return null;
    }

    let violation: {
      constraintKey: string;
      violationType: "temporal" | "resource";
      message: string;
    } | undefined;

    // Simplified temporal check: assume 'timestamp' property exists for demonstration
    if (typeof oldValue?.timestamp === 'number' && typeof newValue?.timestamp === 'number') {
      const timeDiff = Math.abs(newValue.timestamp - oldValue.timestamp);
      const temporalConstraint = constraints.find(c => c.key === key && c.maxAgeMs !== undefined);
      if (temporalConstraint && timeDiff > temporalConstraint.maxAgeMs) {
        violation = {
          constraintKey: key,
          violationType: "temporal",
          message: `Temporal violation: State changed too slowly. Difference (${timeDiff}ms) exceeds max age (${temporalConstraint.maxAgeMs}ms).`,
        };
      }
    }

    // Simplified resource check: assume 'size' property exists for demonstration
    if (typeof oldValue?.size === 'number' && typeof newValue?.size === 'number') {
      const resourceConstraint = constraints.find(c => c.key === key && c.maxSizeBytes !== undefined);
      if (resourceConstraint && Math.abs(newValue.size - oldValue.size) > resourceConstraint.maxSizeBytes) {
        violation = {
          constraintKey: key,
          violationType: "resource",
          message: `Resource violation: State size changed too drastically. Difference (${Math.abs(newValue.size - oldValue.size)} bytes) exceeds max size (${resourceConstraint.maxSizeBytes} bytes).`,
        };
      }
    }

    if (violation) {
      return {
        key: key,
        oldValue: oldValue,
        newValue: newValue,
        violation: violation,
      };
    }

    return null;
  }

  public diff(currentState: Message | Record<string, any>, previousState: Message | Record<string, any>): ContextualStateDiffReport {
    const differences: StateDifference[] = [];

    const keys = new Set<string>();
    if (typeof currentState === 'object' && currentState !== null) {
      Object.keys(currentState).forEach(key => keys.add(key));
    }
    if (typeof previousState === 'object' && previousState !== null) {
      Object.keys(previousState).forEach(key => keys.add(key));
    }

    for (const key of keys) {
      const oldValue = (typeof previousState === 'object' && previousState !== null) ? (previousState as Record<string, any>)[key] : undefined;
      const newValue = (typeof currentState === 'object' && currentState !== null) ? (currentState as Record<string, any>)[key] : undefined;

      if (oldValue !== newValue) {
        const violationDiff = this.checkConstraints(key, oldValue, newValue);
        
        differences.push({
          key: key,
          oldValue: oldValue,
          newValue: newValue,
          ...(violationDiff ? { violation: violationDiff.violation } : {}),
        });
      }
    }

    const isDifferent = differences.length > 0;
    const summary = isDifferent
      ? `State differs in ${differences.length} fields. Check for violations.`
      : "State is consistent with constraints.";

    return {
      isDifferent: isDifferent,
      differences: differences,
      summary: summary,
    };
  }
}