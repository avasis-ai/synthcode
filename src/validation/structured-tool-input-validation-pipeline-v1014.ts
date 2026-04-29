import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, any>;
};

interface ConstraintRule {
  fields: string[];
  validator: (data: Record<string, unknown>) => string | null;
}

class ComplexConstraintValidator {
  private rules: ConstraintRule[];

  constructor(rules: ConstraintRule[] = []) {
    this.rules = rules;
  }

  validate(data: Record<string, unknown>): string[] {
    const errors: string[] = [];
    for (const rule of this.rules) {
      const error = rule.validator(data);
      if (error) {
        errors.push(`Complex Constraint Failed on ${rule.fields.join(', ')}: ${error}`);
      }
    }
    return errors;
  }
}

abstract class BaseValidationPipeline {
  protected constraints: ComplexConstraintValidator = new ComplexConstraintValidator([]);

  abstract addConstraint(rule: ConstraintRule): this;

  protected executeComplexConstraint(data: Record<string, unknown>): string[] {
    return this.constraints.validate(data);
  }

  abstract validate(input: Record<string, unknown>): ValidationResult;
}

class StructuredToolInputValidationPipelineV1014 extends BaseValidationPipeline {
  addConstraint(rule: ConstraintRule): StructuredToolInputValidationPipelineV1014 {
    this.constraints = new ComplexConstraintValidator([...this.constraints['rules'], rule]);
    return this;
  }

  validate(input: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const context: Record<string, any> = { ...input };

    // 1. Basic Schema Validation (Placeholder for existing logic)
    if (!input.tool_name || typeof input.tool_name !== 'string') {
      errors.push("Missing or invalid 'tool_name'.");
    }

    // 2. Field-level validation (Placeholder)
    if (input.parameters && typeof input.parameters !== 'object') {
      errors.push("Parameters must be an object.");
    }

    // 3. Complex Constraint Validation (New Step)
    const complexErrors = this.executeComplexConstraint(input);
    errors.push(...complexErrors);

    const isValid: boolean = errors.length === 0;

    return {
      isValid,
      errors,
      context,
    };
  }
}

export { StructuredToolInputValidationPipelineV1014 };