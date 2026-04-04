import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
} from "./types";

export interface SchemaField {
  type: "string" | "number" | "boolean" | "object";
  required?: boolean;
  default?: unknown;
  transform?: (value: unknown, context: Record<string, unknown>) => unknown;
}

export interface TargetSchema {
  [key: string]: SchemaField;
}

export interface SchemaEnforcer {
  enforce(rawOutput: Record<string, unknown>, schema: TargetSchema): Promise<Record<string, unknown>>;
}

class SchemaEnforcerImpl implements SchemaEnforcer {
  enforce(rawOutput: Record<string, unknown>, schema: TargetSchema): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      const enforcedOutput: Record<string, unknown> = {};
      const errors: string[] = [];

      const processField = (
        fieldName: string,
        fieldSchema: SchemaField,
        context: Record<string, unknown>
      ): unknown | null => {
        const rawValue = rawOutput[fieldName];
        let finalValue: unknown = undefined;

        if (rawValue === undefined || rawValue === null) {
          if (fieldSchema.required) {
            errors.push(`Missing required field: ${fieldName}`);
            return null;
          }
          if (fieldSchema.default !== undefined) {
            return fieldSchema.default;
          }
          return undefined;
        }

        // 1. Transformation
        if (fieldSchema.transform) {
          try {
            finalValue = fieldSchema.transform(rawValue, context);
          } catch (e) {
            errors.push(`Transformation failed for ${fieldName}: ${(e as Error).message}`);
            return null;
          }
        } else {
          finalValue = rawValue;
        }

        // 2. Type Coercion/Validation (Basic check)
        if (fieldSchema.type === "string" && typeof finalValue !== "string") {
          try {
            finalValue = String(finalValue);
          } catch (e) {
            errors.push(`Type coercion failed for ${fieldName} to string.`);
            return null;
          }
        } else if (fieldSchema.type === "number" && typeof finalValue !== "number") {
          const num = Number(finalValue);
          if (isNaN(num)) {
            errors.push(`Type coercion failed for ${fieldName} to number.`);
            return null;
          }
          finalValue = num;
        } else if (fieldSchema.type === "boolean" && typeof finalValue !== "boolean") {
          const strValue = String(finalValue).toLowerCase();
          if (strValue === "true") {
            finalValue = true;
          } else if (strValue === "false") {
            finalValue = false;
          } else {
            errors.push(`Type coercion failed for ${fieldName} to boolean.`);
            return null;
          }
        } else if (fieldSchema.type === "object" && typeof finalValue !== "object" || Array.isArray(finalValue)) {
            // For simplicity, we assume object structure is handled by transform or is already correct
        }

        return finalValue;
      };

      for (const fieldName in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
          const fieldSchema = schema[fieldName] as SchemaField;
          const value = processField(fieldName, fieldSchema, rawOutput);
          enforcedOutput[fieldName] = value;
        }
      }

      if (errors.length > 0) {
        const errorOutput: Record<string, unknown> = {
          success: false,
          errors: errors,
          message: "Schema enforcement failed due to validation or transformation errors.",
        };
        resolve(errorOutput);
      } else {
        resolve(enforcedOutput);
      }
    });
  }
}

export const createSchemaEnforcer = (): SchemaEnforcer => {
  return new SchemaEnforcerImpl();
};