import { Message, ToolResultMessage } from "./types";

export interface StructuredToolOutputValidator {
  validate(output: ToolResultMessage): { isValid: boolean; errors: string[] };
}

export interface ValidationStep {
  validate(output: ToolResultMessage): { isValid: boolean; errors: string[] };
}

class TemporalConsistencyValidator implements ValidationStep {
  validate(output: ToolResultMessage): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (typeof output.content !== 'string') {
      errors.push("TemporalConsistencyValidator requires string content.");
    } else {
      // Mock temporal check: assumes content must contain a date pattern for demonstration
      const dateRegex = /\d{4}-\d{2}-\d{2}/;
      if (!dateRegex.test(output.content)) {
        errors.push("Content does not appear to contain a valid date format (YYYY-MM-DD) for temporal consistency.");
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class SchemaComplianceValidator implements StructuredToolOutputValidator {
  private schemaName: string;

  constructor(schemaName: string) {
    this.schemaName = schemaName;
  }

  validate(output: ToolResultMessage): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    // Mock schema validation: checks if the tool_use_id matches the schema name pattern
    if (!output.tool_use_id.startsWith(this.schemaName.toLowerCase())) {
      errors.push(`Tool ID '${output.tool_use_id}' does not conform to expected schema prefix '${this.schemaName}'`);
    }
    return { isValid: errors.length === 0, errors };
  }
}

export type ValidatorPipeline = (output: ToolResultMessage) => { isValid: boolean; errors: string[] };

export function createStructuredToolOutputValidationPipeline(
  initialValidator: StructuredToolOutputValidator,
  ...steps: { validator: ValidationStep; name: string }[]
): ValidatorPipeline {
  return (output: ToolResultMessage): { isValid: boolean; errors: string[] } => {
    let allErrors: string[] = [];
    let allValid = true;

    // 1. Run initial validator
    const initialResult = initialValidator.validate(output);
    if (!initialResult.isValid) {
      allErrors.push(...initialResult.errors);
      allValid = false;
    }

    // 2. Run subsequent steps
    for (const { validator, name } of steps) {
      const result = validator.validate(output);
      if (!result.isValid) {
        allErrors.push(`[${name}]`, ...result.errors);
        allValid = false;
      }
    }

    return { isValid: allValid, errors: allErrors };
  };
}