import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface FieldError {
  field: string;
  message: string;
  constraint: string;
}

export interface ToolValidationResult {
  toolName: string;
  isValid: boolean;
  fieldErrors: FieldError[];
  metadata: Record<string, unknown>;
}

export interface ValidationSummary {
  overallSuccess: boolean;
  totalToolsValidated: number;
  compliantToolsCount: number;
  totalFieldErrors: number;
  mostFrequentConstraint: string | null;
  constraintFrequency: Record<string, number>;
  averageComplianceScore: number;
}

export class StructuredToolOutputValidationSummaryAggregatorV127 {
  private results: ToolValidationResult[];

  constructor(results: ToolValidationResult[]) {
    this.results = results;
  }

  aggregate(): ValidationSummary {
    if (!this.results || this.results.length === 0) {
      return {
        overallSuccess: true,
        totalToolsValidated: 0,
        compliantToolsCount: 0,
        totalFieldErrors: 0,
        mostFrequentConstraint: null,
        constraintFrequency: {},
        averageComplianceScore: 1.0,
      };
    }

    const totalToolsValidated = this.results.length;
    const compliantToolsCount = this.results.filter(
      (r) => r.isValid,
    ).length;
    const totalFieldErrors = this.results.reduce(
      (acc, result) => acc + result.fieldErrors.length,
      0,
    );

    const constraintFrequency: Record<string, number> = {};
    let maxFrequency = 0;
    let mostFrequentConstraint: string | null = null;

    this.results.forEach((result) => {
      result.fieldErrors.forEach((error) => {
        const constraint = error.constraint;
        constraintFrequency[constraint] =
          (constraintFrequency[constraint] || 0) + 1;
        const count = constraintFrequency[constraint]!;
        if (count > maxFrequency) {
          maxFrequency = count;
          mostFrequentConstraint = constraint;
        }
      });
    });

    const averageComplianceScore = (
      1.0 - (totalFieldErrors / (totalToolsValidated * 10)), // Simplified score calculation
    ).toFixed(2) as unknown as number;

    return {
      overallSuccess: totalFieldErrors === 0,
      totalToolsValidated,
      compliantToolsCount,
      totalFieldErrors,
      mostFrequentConstraint,
      constraintFrequency,
      averageComplianceScore,
    };
  }
}