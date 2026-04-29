import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationSummaryEntry {
  toolName: string;
  stepIdentifier: string;
  validationType: "SchemaMismatch" | "ConstraintViolation" | "TypeError" | "Other";
  message: string;
  severity: "ERROR" | "WARNING" | "INFO";
  context: Record<string, unknown>;
}

export interface ValidationSummary {
  toolName: string;
  stepIdentifier: string;
  totalFailures: number;
  errorCounts: Record<"SchemaMismatch" | "ConstraintViolation" | "TypeError" | "Other", number>;
  warnings: string[];
  errors: string[];
}

export interface StructuredValidationSummary {
  summaries: Record<string, ValidationSummary>;
}

export class StructuredToolOutputValidationSummaryAggregator {
  aggregate(results: ValidationSummaryEntry[]): StructuredValidationSummary {
    const summaries: Record<string, ValidationSummary> = {};

    for (const entry of results) {
      const key = `${entry.toolName}::${entry.stepIdentifier}`;

      if (!summaries[key]) {
        summaries[key] = {
          toolName: entry.toolName,
          stepIdentifier: entry.stepIdentifier,
          totalFailures: 0,
          errorCounts: {
            SchemaMismatch: 0,
            ConstraintViolation: 0,
            TypeError: 0,
            Other: 0,
          },
          warnings: [],
          errors: [],
        };
      }

      const summary = summaries[key];

      if (entry.severity === "ERROR") {
        summary.totalFailures += 1;
        summary.errors.push(entry.message);
        switch (entry.validationType) {
          case "SchemaMismatch":
            summary.errorCounts.SchemaMismatch += 1;
            break;
          case "ConstraintViolation":
            summary.errorCounts.ConstraintViolation += 1;
            break;
          case "TypeError":
            summary.errorCounts.TypeError += 1;
            break;
          case "Other":
            summary.errorCounts.Other += 1;
            break;
        }
      } else if (entry.severity === "WARNING") {
        summary.warnings.push(entry.message);
      } else {
        // INFO level entries are generally ignored for summary counts but could be logged if needed
      }
    }

    return { summaries };
  }
}