import { Message, ToolResultMessage } from "./types";

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  details: Record<string, any>;
}

export interface ValidationStep {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationReport;
}

export class StructuredToolOutputValidationPipelineV25 {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(output: ToolResultMessage, context: Record<string, any>): ValidationReport {
    let accumulatedReport: ValidationReport = {
      isValid: true,
      errors: [],
      details: { ...context },
    };

    for (const step of this.steps) {
      const report = step.validate(output, accumulatedReport.details);
      if (!report.isValid) {
        accumulatedReport.isValid = false;
        accumulatedReport.errors.push(...report.errors);
        Object.assign(accumulatedReport.details, report.details);
      }
    }

    return accumulatedReport;
  }
}