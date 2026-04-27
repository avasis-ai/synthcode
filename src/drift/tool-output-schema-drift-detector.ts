import { Message, ToolResultMessage } from "./types";

type FieldProfile = {
  type: "number";
  mean: number;
  stdDev: number;
  count: number;
} | {
  type: "string";
  frequencies: Map<string, number>;
  totalCount: number;
} | {
  type: "boolean";
  trueCount: number;
  falseCount: number;
  totalCount: number;
};

interface ToolOutputProfile {
  [key: string]: FieldProfile;
}

type DriftSeverity = "Low" | "Medium" | "High";

export class ToolOutputSchemaDriftDetector {
  private readonly profile: ToolOutputProfile;

  constructor(profile: ToolOutputProfile) {
    this.profile = profile;
  }

  private calculateNumericDrift(fieldName: string, value: unknown): number {
    const profile = this.profile[fieldName] as FieldProfile | undefined;
    if (!profile || profile.type !== "number") return 0;

    const actualValue = (value as number) || 0;
    const deviation = Math.abs(actualValue - profile.mean) / (profile.stdDev || 1);
    return deviation;
  }

  private calculateStringDrift(fieldName: string, value: unknown): number {
    const profile = this.profile[fieldName] as FieldProfile | undefined;
    if (!profile || profile.type !== "string") return 0;

    const strValue = String(value);
    const frequencies = profile.frequencies;
    const count = profile.totalCount;

    if (!frequencies.has(strValue)) {
      return 1.0; // New, unseen value
    }

    const expectedFrequency = frequencies.get(strValue)! / count;
    const actualFrequency = 1 / (count + 1); // Simple measure for single observation
    return Math.abs(expectedFrequency - actualFrequency);
  }

  private calculateBooleanDrift(fieldName: string, value: unknown): number {
    const profile = this.profile[fieldName] as FieldProfile | undefined;
    if (!profile || profile.type !== "boolean") return 0;

    const actualValue = (value as boolean);
    if (actualValue === true) {
      return Math.abs(1 - (profile.trueCount / profile.totalCount));
    } else {
      return Math.abs(0 - (profile.falseCount / profile.totalCount));
    }
  }

  private calculateFieldDrift(fieldName: string, value: unknown): number {
    const profile = this.profile[fieldName];
    if (!profile) return 0;

    if (profile.type === "number") {
      return this.calculateNumericDrift(fieldName, value);
    }
    if (profile.type === "string") {
      return this.calculateStringDrift(fieldName, value);
    }
    if (profile.type === "boolean") {
      return this.calculateBooleanDrift(fieldName, value);
    }
    return 0;
  }

  private calculateTotalDriftScore(output: Record<string, unknown>): number {
    let totalScore = 0;
    for (const fieldName in output) {
      if (Object.prototype.hasOwnProperty.call(output, fieldName)) {
        totalScore += this.calculateFieldDrift(fieldName, output[fieldName]);
      }
    }
    return totalScore;
  }

  public detectDrift(output: Record<string, unknown>): { score: number; severity: DriftSeverity } {
    const score = this.calculateTotalDriftScore(output);

    let severity: DriftSeverity = "Low";
    if (score > 2.5) {
      severity = "High";
    } else if (score > 1.0) {
      severity = "Medium";
    }

    return { score, severity };
  }
}