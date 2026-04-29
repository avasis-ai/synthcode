import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Severity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

interface ValidationIssue {
  source: string;
  field: string;
  message: string;
  severity: Severity;
  details?: Record<string, unknown>;
}

interface AggregatedValidationReport {
  issues: ValidationIssue[];
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  overallStatus: "PASS" | "FAIL" | "WARN";
  crossFieldConflicts: Record<string, string[]>;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private reports: AggregatedValidationReport[] = [];

  private readonly SEVERITY_WEIGHTS: Record<Severity, number> = {
    CRITICAL: 5,
    ERROR: 3,
    WARNING: 2,
    INFO: 1,
  };

  private readonly TOP_N_ISSUES: number;

  constructor(topN: number = 5) {
    this.TOP_N_ISSUES = topN;
  }

  private calculateOverallStatus(report: AggregatedValidationReport): "PASS" | "FAIL" | "WARN" {
    if (report.criticalCount > 0) return "FAIL";
    if (report.errorCount > 0) return "FAIL";
    if (report.warningCount > 0) return "WARN";
    return "PASS";
  }

  private calculateWeightedScore(report: AggregatedValidationReport): number {
    let score = 0;
    for (const issue of report.issues) {
      score += this.SEVERITY_WEIGHTS[issue.severity] || 0;
    }
    return score;
  }

  public aggregateReport(report: Omit<AggregatedValidationReport, 'overallStatus' | 'crossFieldConflicts'>): void {
    const newReport: AggregatedValidationReport = {
      issues: report.issues || [],
      totalIssues: report.issues?.length || 0,
      criticalCount: report.issues?.filter(i => i.severity === "CRITICAL").length || 0,
      errorCount: report.issues?.filter(i => i.severity === "ERROR").length || 0,
      warningCount: report.issues?.filter(i => i.severity === "WARNING").length || 0,
      infoCount: report.issues?.filter(i => i.severity === "INFO").length || 0,
      crossFieldConflicts: report.crossFieldConflicts || {},
      overallStatus: "PASS", // Placeholder, will be recalculated
    };

    this.reports.push(newReport);
  }

  public summarize(): AggregatedValidationReport {
    if (this.reports.length === 0) {
      return {
        issues: [],
        totalIssues: 0,
        criticalCount: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        overallStatus: "PASS",
        crossFieldConflicts: {},
      };
    }

    const allIssues: ValidationIssue[] = [].concat(...this.reports.map(r => r.issues));
    const allConflicts: Record<string, string[]> = {};

    this.reports.forEach((report, index) => {
      // Merge conflicts, prioritizing later reports if keys overlap
      Object.keys(report.crossFieldConflicts).forEach(key => {
        if (!allConflicts[key]) {
          allConflicts[key] = [];
        }
        allConflicts[key] = [...new Set([...allConflicts[key], ...report.crossFieldConflicts[key]])];
      });
    });

    const totalIssues = allIssues.length;
    const criticalCount = allIssues.filter(i => i.severity === "CRITICAL").length;
    const errorCount = allIssues.filter(i => i.severity === "ERROR").length;
    const warningCount = allIssues.filter(i => i.severity === "WARNING").length;
    const infoCount = allIssues.filter(i => i.severity === "INFO").length;

    const overallStatus = this.calculateOverallStatus({
      issues: allIssues,
      totalIssues,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      crossFieldConflicts: allConflicts,
      overallStatus: "PASS",
    });

    return {
      issues: allIssues,
      totalIssues,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      overallStatus,
      crossFieldConflicts: allConflicts,
    };
  }

  public generateSummaryReport(): {
    summary: AggregatedValidationReport;
    topIssues: ValidationIssue[];
    reportText: string;
  } {
    const summary = this.summarize();

    const sortedIssues = [...summary.issues].sort((a, b) => {
      const weightA = this.SEVERITY_WEIGHTS[a.severity] || 0;
      const weightB = this.SEVERITY_WEIGHTS[b.severity] || 0;
      return weightB - weightA;
    });

    const topIssues = sortedIssues.slice(0, this.TOP_N_ISSUES);

    const reportText = `--- Structured Tool Output Validation Summary Report ---\n\n` +
      `Overall Status: ${summary.overallStatus}\n` +
      `Total Issues Found: ${summary.totalIssues}\n` +
      `Breakdown: CRITICAL (${summary.criticalCount}) | ERROR (${summary.errorCount}) | WARNING (${summary.warningCount}) | INFO (${summary.infoCount})\n` +
      `Cross-Field Conflicts Detected: ${Object.keys(summary.crossFieldConflicts).length}\n\n` +
      `--- Top ${this.TOP_N_ISSUES} Critical/High Priority Issues ---\n`;

    let issueDetails = topIssues.map((issue, index) =>
      `${index + 1}. [${issue.severity}] Source: ${issue.source} | Field: ${issue.field}\n   Message: ${issue.message}`
    ).join('\n');

    if (issueDetails) {
      reportText += issueDetails + "\n\n";
    } else {
      reportText += "No significant issues found across all validation pipelines.\n\n";
    }

    if (Object.keys(summary.crossFieldConflicts).length > 0) {
      reportText += "--- Cross-Field Dependency Conflicts ---\n";
      for (const [field, conflicts] of Object.entries(summary.crossFieldConflicts)) {
        reportText += `Field '${field}': Conflicts found in ${conflicts.join(', ')}\n`;
      }
    }

    return {
      summary,
      topIssues,
      reportText,
    };
  }
}