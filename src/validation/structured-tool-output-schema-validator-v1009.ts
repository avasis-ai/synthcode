import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: { [key: string]: SchemaDefinition };
  items?: SchemaDefinition;
  required?: string[];
  if?: {
    properties?: { [key: string]: SchemaDefinition };
    required?: string[];
  };
  then?: {
    properties?: { [key: string]: SchemaDefinition };
    items?: SchemaDefinition;
    required?: string[];
  };
  else?: {
    properties?: { [key: string]: SchemaDefinition };
    items?: SchemaDefinition;
    required?: string[];
  };
}

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class StructuredToolOutputSchemaValidatorV1009 {
  validate(data: unknown, schema: SchemaDefinition): ValidationResult {
    const errors: string[] = [];
    const result: { isValid: boolean; errors: string[] } = { isValid: true, errors: [] };

    const validateRecursive = (dataNode: unknown, schemaNode: SchemaDefinition, path: string): void => {
      if (typeof dataNode !== 'object' || dataNode === null || typeof schemaNode !== 'object' || schemaNode === null) {
        if (path) {
          errors.push(`Validation failed at path "${path}": Data or Schema node is invalid.`);
        }
        return;
      }

      switch (schemaNode.type) {
        case "object":
          if (typeof dataNode !== 'object' || dataNode === null || Array.isArray(dataNode)) {
            errors.push(`Validation failed at path "${path}": Expected object.`);
            return;
          }
          if (schemaNode.properties) {
            const properties = schemaNode.properties;
            const dataObject = dataNode as Record<string, unknown>;

            // Check required fields
            if (schemaNode.required) {
              for (const key of schemaNode.required) {
                if (!(key in dataObject) || dataObject[key] === undefined || dataObject[key] === null) {
                  errors.push(`Validation failed at path "${path}": Missing required property "${key}".`);
                }
              }
            }

            // Validate properties
            for (const key in properties) {
              const propSchema = properties[key];
              const propPath = path ? `${path}.${key}` : key;
              const propData = dataObject[key];

              if (propData !== undefined && propData !== null) {
                validateRecursive(propData, propSchema, propPath);
              } else if (propSchema.required) {
                // Handled by required check above, but good for completeness
              }
            }

            // Handle conditional logic (if/then/else)
            if (schemaNode.if) {
              const ifSchema = schemaNode.if;
              const ifData = dataObject;

              let conditionMet = true;
              if (ifSchema.properties) {
                const requiredProps = ifSchema.required || [];
                for (const reqKey of requiredProps) {
                  if (!(reqKey in ifData) || ifData[reqKey] === undefined || ifData[reqKey] === null) {
                    conditionMet = false;
                    break;
                  }
                }
              }

              if (conditionMet && schemaNode.then) {
                validateRecursive(dataNode, schemaNode.then, path);
              } else if (!conditionMet && schemaNode.else) {
                validateRecursive(dataNode, schemaNode.else, path);
              }
            }
          }
          break;

        case "array":
          if (!Array.isArray(dataNode)) {
            errors.push(`Validation failed at path "${path}": Expected array.`);
            return;
          }
          if (schemaNode.items) {
            const itemsSchema = schemaNode.items;
            dataNode.forEach((item, index) => {
              const itemPath = `${path}[${index}]`;
              validateRecursive(item, itemsSchema, itemPath);
            });
          }
          break;

        case "string":
          if (typeof dataNode !== 'string') {
            errors.push(`Validation failed at path "${path}": Expected string.`);
          }
          break;

        case "number":
          if (typeof dataNode !== 'number' || isNaN(dataNode)) {
            errors.push(`Validation failed at path "${path}": Expected number.`);
          }
          break;

        case "boolean":
          if (typeof dataNode !== 'boolean') {
            errors.push(`Validation failed at path "${path}": Expected boolean.`);
          }
          break;
      }
    };

    validateRecursive(data, schema, "root");

    result.isValid = errors.length === 0;
    result.errors = errors;
    return result;
  }
}