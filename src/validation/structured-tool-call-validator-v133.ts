import {
  Message,
  ToolUseBlock,
  ContentBlock,
} from "../types";

type Schema = Record<string, any>;

interface Validator {
  validate(args: Record<string, unknown>, schema: Schema): { isValid: boolean; errors: string[] };
}

class StructuredToolCallValidatorV133 implements Validator {
  validate(args: Record<string, unknown>, schema: Schema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || typeof schema !== 'object') {
      return { isValid: false, errors: ["Schema must be provided and must be an object."] };
    }

    const validateField = (fieldName: string, value: unknown, fieldSchema: any): void => {
      if (value === undefined || value === null) {
        if (fieldSchema.required) {
          errors.push(`Field '${fieldName}' is required but missing.`);
        }
        return;
      }

      if (typeof value !== 'object' || Array.isArray(value)) {
        if (fieldSchema.type === 'object' && !Array.isArray(value)) {
          // Deep validation for object structure
          const objectValue = value as Record<string, unknown>;
          const objectErrors: string[] = [];
          for (const key in fieldSchema.properties) {
            const propSchema = fieldSchema.properties[key];
            const propValue = objectValue[key];
            validateField(key, propValue, propSchema);
          }
          // This simple implementation aggregates errors, but a real system would need better context.
          // For now, we just rely on recursive calls adding to the main errors array.
        } else if (fieldSchema.type === 'array') {
          // Array validation (simplified)
          if (!Array.isArray(value)) {
            errors.push(`Field '${fieldName}' expected an array.`);
          } else if (fieldSchema.items && typeof fieldSchema.items === 'object') {
            value.forEach((item: unknown, index: number) => {
              // Assuming items schema defines the structure for array elements
              const tempArgs: Record<string, unknown> = {};
              Object.keys(fieldSchema.items).forEach(key => {
                tempArgs[key] = item[key] ?? null;
              });
              // Recursive call simulation for array item validation
              // This is highly simplified; real validation would need item-specific context.
              if (fieldSchema.items.properties) {
                const itemErrors: string[] = [];
                for (const key in fieldSchema.properties) {
                    const propSchema = fieldSchema.properties[key];
                    const propValue = (item as Record<string, unknown})[key];
                    validateField(`${fieldName}[${index}].${key}`, propValue, propSchema);
                }
              }
            });
          }
        } else {
          // Basic type check fallback
          const expectedType = fieldSchema.type;
          const actualType = typeof value;
          if (expectedType && expectedType !== 'any' && actualType !== expectedType) {
            errors.push(`Field '${fieldName}' expected type '${expectedType}', but got '${actualType}'.`);
          }
        }
      } else {
        // Primitive type validation
        const expectedType = fieldSchema.type;
        if (expectedType && expectedType !== 'any') {
          const typeMap: { [key: string]: (val: unknown) => boolean } = {
            'string': (val) => typeof val === 'string',
            'number': (val) => typeof val === 'number' && !isNaN(Number(val)),
            'boolean': (val) => typeof val === 'boolean',
            'object': (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
          };

          if (typeMap[expectedType] && !typeMap[expectedType](value)) {
            errors.push(`Field '${fieldName}' expected type '${expectedType}', but got '${typeof value}'.`);
          }
        }
      }
    };

    // Start validation from the root properties defined in the schema
    const rootProperties = schema.properties || {};
    for (const key in rootProperties) {
      const propSchema = rootProperties[key];
      const value = args[key];
      validateField(key, value, propSchema);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const structuredToolCallValidatorV133 = new StructuredToolCallValidatorV133();