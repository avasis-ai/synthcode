import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface SchemaDefinition {
  requiredFields: string[];
  fieldConstraints: Record<string, {
    type: "string" | "number" | "boolean" | "object";
    required: boolean;
    dependencies?: Record<string, (value: any) => boolean>;
  }>;
  crossFieldDependencies?: {
    check: (output: Record<string, any>) => {isValid: boolean; message: string};
  };
}

interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

abstract class BaseValidator {
  abstract validate(output: any, schema: SchemaDefinition): ValidationReport;
}

export class StructuredToolOutputSchemaValidatorV1012 extends BaseValidator {
  validate(output: Record<string, any>, schema: SchemaDefinition): ValidationReport {
    const errors: string[] = [];
    let isValid = true;

    // 1. Check for required fields
    for (const field of schema.requiredFields) {
      if (!(field in output) || output[field] === undefined || output[field] === null) {
        errors.push(`Missing required field: ${field}`);
        isValid = false;
      }
    }

    // 2. Check field constraints and dependencies
    for (const field in schema.fieldConstraints) {
      if (Object.prototype.hasOwnProperty.call(schema.fieldConstraints, field)) {
        const constraint = schema.fieldConstraints[field];
        const value = output[field];

        if (constraint.required && (value === undefined || value === null)) {
          // Already caught by requiredFields, but good for robustness
          continue;
        }

        if (value !== undefined && value !== null) {
          // Basic type check (simplified for this context)
          const actualType = typeof value;
          if (constraint.type === "string" && actualType !== "string") {
            errors.push(`Field ${field} expected type string, got ${actualType}`);
            isValid = false;
          } else if (constraint.type === "number" && actualType !== "number") {
            errors.push(`Field ${field} expected type number, got ${actualType}`);
            isValid = false;
          } else if (constraint.type === "boolean" && actualType !== "boolean") {
            errors.push(`Field ${field} expected type boolean, got ${actualType}`);
            isValid = false;
          } else if (constraint.type === "object" && (actualType !== "object" || Array.isArray(value) || value === null)) {
            errors.push(`Field ${field} expected type object, got ${actualType}`);
            isValid = false;
          }

          // Check field-specific dependencies
          if (constraint.dependencies) {
            for (const dependencyField in constraint.dependencies) {
              if (Object.prototype.hasOwnProperty.call(constraint.dependencies, dependencyField)) {
                const dependencyCheck = constraint.dependencies[dependencyField];
                if (typeof dependencyCheck === 'function') {
                  if (!dependencyCheck(value)) {
                    errors.push(`Field ${field} failed dependency check based on ${dependencyField}.`);
                    isValid = false;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Check cross-field dependencies (Stateful/Cross-field logic)
    if (schema.crossFieldDependencies && schema.crossFieldDependencies.check) {
      const crossCheck = schema.crossFieldDependencies.check;
      const crossResult = crossCheck(output);
      if (!crossResult.isValid) {
        errors.push(`Cross-field validation failed: ${crossResult.message}`);
        isValid = false;
      }
    }

    return {
      isValid: isValid && errors.length === 0,
      errors: errors,
    };
  }
}