import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationSummary {
  totalFailures: number;
  totalWarnings: number;
  errorsByStep: Record<string, any[]>;
  warningsByStep: Record<string, any[]>;
  allErrors: any[];
  allWarnings: any[];
}

export class StructuredToolOutputValidationSummaryBuilder {
  private errors: { step: string; error: any }[] = [];
  private warnings: { step: string; warning: any }[] = [];

  addError(step: string, error: any): this {
    this.errors.push({ step, error });
    return this;
  }

  addWarning(step: string, warning: any): this {
    this.warnings.push({ step, warning });
    return this;
  }

  private buildSummary(): ValidationSummary {
    const errorsByStep: Record<string, any[]> = {};
    const warningsByStep: Record<string, any[]> = {};
    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    for (const { step, error } of this.errors) {
      if (!errorsByStep[step]) {
        errorsByStep[step] = [];
      }
      errorsByStep[step].push(error);
      allErrors.push(error);
    }

    for (const { step, warning } of this.warnings) {
      if (!warningsByStep[step]) {
        warningsByStep[step] = [];
      }
      warningsByStep[step].push(warning);
      allWarnings.push(warning);
    }

    return {
      totalFailures: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByStep: errorsByStep,
      warningsByStep: warningsByStep,
      allErrors: allErrors,
      allWarnings: allWarnings,
    };
  }

  build(): ValidationSummary {
    return this.buildSummary();
  }
}