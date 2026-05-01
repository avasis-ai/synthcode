import {
  StructuredToolOutput,
  ValidationReport,
  ValidationStep,
  SchemaValidator,
  CrossFieldValidator,
  TemporalValidator,
} from "./types";

type ValidationStepType = "schema" | "cross-field" | "temporal";

interface ValidationStepConfig {
  type: ValidationStepType;
  validator: any; // Placeholder for actual validator instance/function
}

class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStepConfig[] = [];

  addStep(step: ValidationStepConfig): this {
    this.steps.push(step);
    return this;
  }

  private async executeStep(step: ValidationStepConfig, data: StructuredToolOutput): Promise<ValidationReport> {
    const validator = step.validator;
    let report: ValidationReport = {
      isValid: true,
      errors: [],
      details: [],
    };

    try {
      if (step.type === "schema") {
        const schemaReport = await (validator as SchemaValidator).validate(data);
        report = { ...report, ...schemaReport };
      } else if (step.type === "cross-field") {
        const crossFieldReport = await (validator as CrossFieldValidator).validate(data);
        report = { ...report, ...crossFieldReport };
      } else if (step.type === "temporal") {
        const temporalReport = await (validator as TemporalValidator).validate(data);
        report = { ...report, ...temporalReport };
      }
    } catch (error) {
      report.isValid = false;
      report.errors.push({
        field: "pipeline_execution",
        message: `Failed to execute ${step.type} validation step: ${(error as Error).message}`,
        severity: "error",
      });
    }
    return report;
  }

  public async validate(data: StructuredToolOutput): Promise<ValidationReport> {
    let aggregateReport: ValidationReport = {
      isValid: true,
      errors: [],
      details: [],
    };

    for (const step of this.steps) {
      const stepReport = await this.executeStep(step, data);

      if (!stepReport.isValid) {
        aggregateReport.isValid = false;
        aggregateReport.errors.push(...stepReport.errors);
        aggregateReport.details.push(...stepReport.details);
      } else {
        aggregateReport.details.push(...stepReport.details);
      }
    }

    return aggregateReport;
  }
}

export {
  StructuredToolOutputValidationPipelineBuilder,
}