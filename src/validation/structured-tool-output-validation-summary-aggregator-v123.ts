import {
  ToolResultMessage,
  UserMessage,
  AssistantMessage,
} from "./types";

export interface ValidationResult {
  toolName: string;
  fieldName: string;
  isValid: boolean;
  details: string;
  sourceMetadata: Record<string, unknown>;
}

export interface ValidationSummaryEntry {
  toolName: string;
  fieldName: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  overallStatus: "PASS" | "FAIL" | "NEUTRAL";
  summaryDetails: string;
}

export interface ValidationSummaryReport {
  timestamp: number;
  totalToolsChecked: number;
  totalFieldsChecked: number;
  overallSystemStatus: "PASS" | "FAIL" | "NEUTRAL";
  toolSummaries: ValidationSummaryEntry[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationResult[] = [];

  aggregate(results: ValidationResult[]): void {
    this.results = results;
  }

  private calculateStatus(success: number, total: number): "PASS" | "FAIL" | "NEUTRAL" {
    if (total === 0) return "NEUTRAL";
    if (success === total) return "PASS";
    if (success === 0) return "FAIL";
    return "NEUTRAL";
  }

  private generateSummaryEntry(
    toolName: string,
    fieldName: string,
    results: ValidationResult[]
  ): ValidationSummaryEntry {
    const totalChecks = results.length;
    const successfulChecks = results.filter((r) => r.isValid).length;
    const failedChecks = totalChecks - successfulChecks;
    const overallStatus = this.calculateStatus(successfulChecks, totalChecks);

    const summaryDetails = `Checked ${totalChecks} times. Success: ${successfulChecks}, Fail: ${failedChecks}.`;

    return {
      toolName,
      fieldName,
      totalChecks,
      successfulChecks,
      failedChecks,
      overallStatus,
      summaryDetails,
    };
  }

  generateSummary(): ValidationSummaryReport {
    if (!this.results || this.results.length === 0) {
      return {
        timestamp: Date.now(),
        totalToolsChecked: 0,
        totalFieldsChecked: 0,
        overallSystemStatus: "NEUTRAL",
        toolSummaries: [],
      };
    }

    const toolFieldMap = new Map<string, Map<string, ValidationResult[]>>();

    for (const result of this.results) {
      if (!toolFieldMap.has(result.toolName)) {
        toolFieldMap.set(result.toolName, new Map<string, ValidationResult[]>());
      }
      const fieldMap = toolFieldMap.get(result.toolName)!;
      if (!fieldMap.has(result.fieldName)) {
        fieldMap.set(result.fieldName, []);
      }
      fieldMap.get(result.fieldName)!.push(result);
    }

    const toolSummaries: ValidationSummaryEntry[] = [];
    let totalToolsChecked = 0;
    let totalFieldsChecked = 0;

    for (const [toolName, fieldMap] of toolFieldMap.entries()) {
      const fieldSummaries: ValidationSummaryEntry[] = [];
      for (const [fieldName, results] of fieldMap.entries()) {
        fieldSummaries.push(
          this.generateSummaryEntry(toolName, fieldName, results)
        );
        totalFieldsChecked++;
      }
      toolSummaries.push(
        {
          toolName,
          fieldName: "AGGREGATE",
          totalChecks: 0,
          successfulChecks: 0,
          failedChecks: 0,
          overallStatus: "N/A",
          summaryDetails: "",
        }
      );
      totalToolsChecked++;
    }

    const overallSystemStatus = this.calculateOverallStatus(toolSummaries);

    return {
      timestamp: Date.now(),
      totalToolsChecked: totalToolsChecked,
      totalFieldsChecked: totalFieldsChecked,
      overallSystemStatus,
      toolSummaries: toolSummaries.concat(
        toolSummaries.map((_, index) => ({
          ...toolSummaries[index],
          toolName: toolSummaries[index].toolName,
          fieldName: "---",
          totalChecks: 0,
          successfulChecks: 0,
          failedChecks: 0,
          overallStatus: "N/A",
          summaryDetails: ""
        }))
      ),
    };
  }

  private calculateOverallStatus(summaries: ValidationSummaryEntry[]): "PASS" | "FAIL" | "NEUTRAL" {
    let hasFail = false;
    let hasPass = false;

    for (const summary of summaries) {
      if (summary.overallStatus === "FAIL") {
        hasFail = true;
      } else if (summary.overallStatus === "PASS") {
        hasPass = true;
      }
    }

    if (hasFail) return "FAIL";
    if (hasPass && !hasFail) return "PASS";
    return "NEUTRAL";
  }
}