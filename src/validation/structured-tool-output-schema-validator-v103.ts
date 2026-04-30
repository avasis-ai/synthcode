import { Message, ToolResultMessage } from "./types";

interface SchemaDefinition {
  [key: string]: any;
}

interface SchemaEvolutionPath {
  [version: string]: SchemaDefinition;
}

export class StructuredToolOutputSchemaValidatorV103 {
  private schemaPath: SchemaEvolutionPath;

  constructor() {
    this.schemaPath = {};
  }

  public registerSchema(version: string, schema: SchemaDefinition): void {
    this.schemaPath[version] = schema;
  }

  public validate(
    output: ToolResultMessage,
    expectedVersion: string
  ): { isValid: boolean; errors: string[] } {
    const schema = this.schemaPath[expectedVersion];
    if (!schema) {
      return { isValid: false, errors: [`Schema version ${expectedVersion} not registered.`] };
    }

    const errors: string[] = [];

    if (typeof output !== 'object' || output === null) {
      return { isValid: false, errors: ["Output must be a non-null object."] };
    }

    // 1. Basic structure check against the expected schema
    if (!this.validateObjectStructure(output, schema, "tool_result")) {
      errors.push("Failed basic structural validation against the schema.");
    }

    // 2. Deep structural drift check (Simplified for demonstration)
    if (schema.content && typeof schema.content === 'object' && schema.content !== null) {
      if (!this.checkContentStructure(output.content, schema.content, "content")) {
        errors.push("Content structure drift detected. Check nested object/array consistency.");
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }

  private validateObjectStructure(
    data: any,
    schema: SchemaDefinition,
    path: string
  ): boolean {
    let valid = true;
    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const expectedType = schema[key];
        if (typeof expectedType === 'string') {
          const expected = expectedType as 'string' | 'number' | 'boolean' | 'object' | 'array';
          const actualValue = data[key];

          if (expected === 'object' && actualValue !== null && typeof actualValue === 'object' && !Array.isArray(actualValue)) {
            // Recursively check nested object structure if schema defines it
            if (!this.validateObjectStructure(actualValue, (schema as any)[key] as SchemaDefinition, `${path}.${key}`)) {
              valid = false;
            }
          } else if (expected === 'array' && !Array.isArray(actualValue)) {
            valid = false;
          } else if (expected === 'string' && typeof actualValue !== 'string') {
            valid = false;
          } else if (expected === 'number' && typeof actualValue !== 'number') {
            valid = false;
          } else if (expected === 'boolean' && typeof actualValue !== 'boolean') {
            valid = false;
          } else if (expected !== 'object' && expected !== 'array' && !Object.prototype.hasOwnProperty.call(data, key)) {
             // Check for required fields if schema implies it (simplification)
          }
        }
      }
    }
    return valid;
  }

  private checkContentStructure(
    content: string,
    schema: SchemaDefinition,
    path: string
  ): boolean {
    // In a real scenario, 'content' would likely be an array of structured blocks,
    // not just a string. We simulate checking for structural drift here.
    if (typeof content !== 'string') return false;

    // Example: If schema expects content to contain a specific marker structure
    if (schema.expectedMarker && !content.includes(schema.expectedMarker)) {
      return false;
    }
    return true;
  }
}