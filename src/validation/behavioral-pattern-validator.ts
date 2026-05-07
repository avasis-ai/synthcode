export type StepType =
  | "TOOL_CALL"
  | "CONTEXT_UPDATE"
  | "INTERNAL_STEP"
  | "USER_INPUT"
  | "ASSISTANT_RESPONSE"
  | "UNKNOWN";

export interface StepResult {
  type: StepType;
  details: Record<string, unknown>;
}

export interface TransitionRule {
  from: StepType;
  to: StepType;
  allowed: boolean;
}

export interface BehavioralPattern {
  name: string;
  requiredSequence: StepType[];
  transitions: TransitionRule[];
}

export interface BehavioralAnomalyReport {
  isAnomaly: boolean;
  message: string;
  deviationPoint: number;
  expectedType: StepType;
  observedType: StepType;
}

export class BehavioralPatternValidator {
  private patterns: BehavioralPattern[];

  constructor(patterns: BehavioralPattern[]) {
    this.patterns = patterns;
  }

  private findMatchingPattern(steps: StepResult[]): BehavioralPattern | null {
    for (const pattern of this.patterns) {
      let match = true;
      for (let i = 0; i < pattern.requiredSequence.length; i++) {
        if (i >= steps.length) {
          match = false;
          break;
        }
        const expectedType = pattern.requiredSequence[i];
        const observedType = steps[i].type;
        if (expectedType !== observedType) {
          match = false;
          break;
        }
      }
      if (match) {
        return pattern;
      }
    }
    return null;
  }

  public validateBehavior(steps: StepResult[]): BehavioralAnomalyReport {
    if (steps.length === 0) {
      return {
        isAnomaly: false,
        message: "No steps provided for validation.",
        deviationPoint: -1,
        expectedType: "UNKNOWN",
        observedType: "UNKNOWN",
      };
    }

    const matchingPattern = this.findMatchingPattern(steps);

    if (matchingPattern) {
      return {
        isAnomaly: false,
        message: `Behavior successfully matched pattern: ${matchingPattern.name}`,
        deviationPoint: -1,
        expectedType: "UNKNOWN",
        observedType: "UNKNOWN",
      };
    }

    // If no full match, check for the first deviation point
    let deviationPoint = -1;
    let expectedType: StepType = "UNKNOWN";
    let observedType: StepType = "UNKNOWN";

    for (let i = 0; i < steps.length; i++) {
      const currentStepType = steps[i].type;
      
      // Simple check: Does the current step type match the start of any pattern?
      // This is a simplified anomaly detection focusing on sequence mismatch.
      let isExpected = false;
      for (const pattern of this.patterns) {
        if (pattern.requiredSequence[i] === currentStepType) {
          isExpected = true;
          break;
        }
      }

      if (!isExpected) {
        deviationPoint = i;
        expectedType = "Expected sequence start";
        observedType = currentStepType;
        break;
      }
    }

    return {
      isAnomaly: true,
      message: `Behavior deviated from all known patterns. Deviation detected at step ${deviationPoint}.`,
      deviationPoint: deviationPoint,
      expectedType: expectedType,
      observedType: observedType,
    };
  }
}

export { BehavioralPatternValidator };