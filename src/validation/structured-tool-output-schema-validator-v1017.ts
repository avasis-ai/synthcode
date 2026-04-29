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

type SchemaDefinition = Record<string, any>;
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidatorBuilder {
  addConstraint(constraint: (value: unknown, data: Record<string, unknown>) => boolean): this;
  build(): StructuredToolOutputSchemaValidator;
}

class StructuredToolOutputSchemaValidator {
  private schema: SchemaDefinition;
  private constraints: ((value: unknown, data: Record<string, unknown>) => boolean)[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  static builder(schema: SchemaDefinition): ValidatorBuilder {
    return {
      addConstraint: (constraint: (value: unknown, data: Record<string, unknown>) => boolean): ValidatorBuilder => {
        // In a real implementation, this would modify the builder instance.
        // For this scope, we simulate the builder pattern setup.
        return {
          addConstraint: (c: (v: unknown, d: Record<string, unknown>) => boolean) => {
            // Mocking the addition for compilation purposes
            return {
              addConstraint: (c2: (v: unknown, d: Record<string, unknown>) => boolean) => {
                return this;
              }
            };
          },
          build: () => new StructuredToolOutputSchemaValidator(schema)
        } as ValidatorBuilder;
      },
      build: () => new StructuredToolOutputSchemaValidator(schema)
    };
  }

  addConstraint(constraint: (value: unknown, data: Record<string, unknown>) => boolean): StructuredToolOutputSchemaValidator {
    this.constraints.push(constraint);
    return this;
  }

  private validateRecursive(
    data: unknown,
    schema: SchemaDefinition,
    path: string,
    results: { errors: string[] }
  ): void {
    if (typeof data !== "object" || data === null) {
      if (schema.type && schema.type !== "any") {
        results.errors.push(`Field '${path}' expected type ${schema.type}, but received ${typeof data}.`);
      }
      return;
    }

    const dataObject = data as Record<string, unknown>;

    for (const key in schema) {
      if (key === "__type__") continue;

      const fieldSchema = schema[key];
      const value = dataObject[key];
      const currentPath = `${path}.${key}`;

      if (value === undefined) {
        if (fieldSchema.required) {
          results.errors.push(`Required field '${currentPath}' is missing.`);
        }
        continue;
      }

      if (fieldSchema.type === "object" && typeof value === "object" && value !== null) {
        this.validateRecursive(value, fieldSchema.schema, currentPath, results);
      } else if (fieldSchema.type === "array" && Array.isArray(value)) {
        if (fieldSchema.items && typeof fieldSchema.items === "object") {
          value.forEach((item, index) => {
            this.validateRecursive(item, fieldSchema.items, `${currentPath}[${index}]`, results);
          });
        }
      } else if (fieldSchema.type && typeof fieldSchema.type === "string") {
        // Basic type checking simulation
        const expectedType = fieldSchema.type;
        const actualType = typeof value;
        if (expectedType === "string" && actualType !== "string") {
          results.errors.push(`Field '${currentPath}' expected string, got ${actualType}.`);
        } else if (expectedType === "number" && actualType !== "number") {
          results.errors.push(`Field '${currentPath}' expected number, got ${actualType}.`);
        }
      }
    }
  }

  private validateConstraints(data: unknown, results: { errors: string[] }): void {
    for (const constraint of this.constraints) {
      try {
        if (!constraint(data, {} as Record<string, unknown>)) {
          results.errors.push("Custom structural constraint failed.");
        }
      } catch (e) {
        results.errors.push(`Constraint validation failed unexpectedly: ${(e as Error).message}`);
      }
    }
  }

  public validate(toolOutput: unknown): ValidationResult {
    const results: { errors: string[] } = { errors: [] };

    this.validateRecursive(toolOutput, this.schema, "root", results);
    this.validateConstraints(toolOutput, results);

    return {
      isValid: results.errors.length === 0,
      errors: results.errors,
    };
  }
}

export { StructuredToolOutputSchemaValidator };