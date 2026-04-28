import { Message, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ToolOutputValidationStep {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult;
}

export interface ToolOutputSchemaValidationPipelineV14 {
  steps: ToolOutputValidationStep[];
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult;
}

class ToolOutputSchemaValidationPipelineV14 implements ToolOutputSchemaValidationPipelineV14 {
  private steps: ToolOutputValidationStep[];

  constructor(steps: ToolOutputValidationStep[] = []) {
    this.steps = steps;
  }

  public addStep(step: ToolOutputValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.validate(output, context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}

class TemporalConstraintValidator implements ToolOutputValidationStep {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    // Placeholder for actual temporal logic check.
    // Example: Check if tool output timestamp is within expected range based on context.
    if (context["last_interaction_time"] && typeof output.content === 'string' && output.content.includes("time")) {
      // Simulate a temporal failure if content mentions time but context is missing time.
      if (!context["last_interaction_time"]) {
        errors.push("Temporal Constraint Violation: Tool output content suggests a time reference, but no preceding interaction time was available in context.");
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class CrossFieldDependencyValidator implements ToolOutputValidationStep {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    // Placeholder for cross-field dependency check.
    // Example: If tool_use_id is present in context, ensure output content references it.
    if (context["required_tool_id"] && output.content && !output.content.includes(context["required_tool_id"])) {
      errors.push(`Cross-Field Dependency Violation: Tool output content must reference the required tool ID provided in context: ${context["required_tool_id"]}`);
    }
    return { isValid: errors.length === 0, errors };
  }
}

export const createToolOutputSchemaValidationPipelineV14 = (): ToolOutputSchemaValidationPipelineV14 => {
  const pipeline = new ToolOutputSchemaValidationPipelineV14();

  // Add core validation steps
  pipeline.addStep(new TemporalConstraintValidator());
  pipeline.addStep(new CrossFieldDependencyValidator());

  // Add any other necessary base validators here if they were implemented separately
  // pipeline.addStep(new SchemaComplianceValidator());

  return pipeline;
};

export { createToolOutputSchemaValidationPipelineV14 };