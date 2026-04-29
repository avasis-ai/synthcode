import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface FieldError {
  field: string;
  message: string;
  context?: any;
}

export interface ConstraintViolation {
  constraint: string;
  field: string;
  message: string;
  value?: any;
}

export interface ToolValidationSummary {
  toolName: string;
  isValid: boolean;
  fieldErrors: FieldError[];
  constraintViolations: ConstraintViolation[];
  rawOutput: any;
}

export interface AggregatedValidationSummary {
  overallSuccess: boolean;
  totalTools: number;
  failedTools: number;
  allFieldErrors: FieldError[];
  allConstraintViolations: ConstraintViolation[];
  toolSummaries: ToolValidationSummary[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private summaries: ToolValidationSummary[];

  constructor() {
    this.summaries = [];
  }

  addSummary(summary: ToolValidationSummary): void {
    this.summaries.push(summary);
  }

  aggregate(): AggregatedValidationSummary {
    const allFieldErrors: FieldError[] = [];
    const allConstraintViolations: ConstraintViolation[] = [];
    let failedToolsCount = 0;

    const toolSummaries: ToolValidationSummary[] = this.summaries;

    for (const summary of toolSummaries) {
      if (!summary.isValid) {
        failedToolsCount++;
      }
      allFieldErrors.push(...summary.fieldErrors);
      allConstraintViolations.push(...summary.constraintViolations);
    }

    const overallSuccess = failedToolsCount === 0;

    return {
      overallSuccess: overallSuccess,
      totalTools: toolSummaries.length,
      failedTools: failedToolsCount,
      allFieldErrors: allFieldErrors,
      allConstraintViolations: allConstraintViolations,
      toolSummaries: toolSummaries,
    };
  }

  generateReport(summary: AggregatedValidationSummary): string {
    let report = "--- Structured Tool Output Validation Summary Report ---\n";
    report += `Overall Status: ${summary.overallSuccess ? "SUCCESS" : "FAILURE"}\n`;
    report += `Total Tools Validated: ${summary.totalTools}\n`;
    report += `Tools Failed Validation: ${summary.failedTools}\n\n`;

    if (summary.allFieldErrors.length > 0) {
      report += "==================================================\n";
      report += `🚨 ${summary.allFieldErrors.length} Field-Level Errors Found:\n`;
      summary.allFieldErrors.forEach((err, index) => {
        report += `  [${index + 1}] Field '${err.field}': ${err.message}`;
        if (err.context) {
          report += ` (Context: ${JSON.stringify(err.context)})`;
        }
        report += "\n";
      });
      report += "\n";
    }

    if (summary.allConstraintViolations.length > 0) {
      report += "==================================================\n";
      report += `⚠️ ${summary.allConstraintViolations.length} Constraint Violations Found:\n`;
      summary.allConstraintViolations.forEach((err, index) => {
        report += `  [${index + 1}] Constraint '${err.constraint}' on Field '${err.field}': ${err.message} (Value: ${JSON.stringify(err.value || 'N/A')})`;
        report += "\n";
      });
      report += "\n";
    }

    if (summary.toolSummaries.length > 0) {
      report += "==================================================\n";
      report += "--- Individual Tool Summary Details ---\n";
      summary.toolSummaries.forEach((summary, index) => {
        report += `\n[Tool ${index + 1}: ${summary.toolName}]\n`;
        report += `  Status: ${summary.isValid ? "✅ Valid" : "❌ Invalid"}\n`;
        if (!summary.isValid) {
          report += `  Details: ${summary.fieldErrors.length} Field Errors, ${summary.constraintViolations.length} Constraint Violations.\n`;
        }
      });
    }

    report += "\n--------------------------------------------------\n";
    return report;
  }
}