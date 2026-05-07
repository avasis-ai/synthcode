import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

export interface Assumption {
  key: string;
  source: "context" | "external" | "constraint";
  description: string;
  validator: (context: Record<string, unknown>, sources: Record<string, unknown>) => boolean;
}

export interface ValidationResult {
  assumptionKey: string;
  isValid: boolean;
  message: string;
}

export interface AssumptionValidationReport {
  timestamp: Date;
  totalAssumptions: number;
  validAssumptions: number;
  invalidAssumptions: ValidationResult[];
  summary: string;
}

export class AssumptionValidator {
  constructor() {}

  /**
   * Validates a list of assumptions against the current context and external sources.
   * @param assumptions The list of assumptions to validate.
   * @param context The current operational context data.
   * @param sources External data sources (e.g., API results, database lookups).
   * @returns A comprehensive validation report.
   */
  validate(
    assumptions: Assumption[],
    context: Record<string, unknown>,
    sources: Record<string, unknown>
  ): AssumptionValidationReport {
    const results: ValidationResult[] = [];

    for (const assumption of assumptions) {
      try {
        const isValid = assumption.validator(context, sources);
        if (isValid) {
          results.push({
            assumptionKey: assumption.key,
            isValid: true,
            message: `Assumption '${assumption.key}' verified successfully.`
          });
        } else {
          results.push({
            assumptionKey: assumption.key,
            isValid: false,
            message: `Assumption '${assumption.key}' failed validation. Check context or sources.`
          });
        }
      } catch (error) {
        results.push({
          assumptionKey: assumption.key,
          isValid: false,
          message: `Validation failed due to internal error: ${(error as Error).message}`
        });
      }
    }

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    const summary = `Validation complete. ${validCount}/${results.length} assumptions verified. ${invalidCount} assumptions failed.`;

    return {
      timestamp: new Date(),
      totalAssumptions: assumptions.length,
      validAssumptions: validCount,
      invalidAssumptions: results.filter(r => !r.isValid),
      summary: summary
    };
  }
}