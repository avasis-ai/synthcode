import { ValidatorContext } from "./base-validator";
import { SchemaDefinition, ValidationResult } from "./schema-validator";

export class StructuredToolOutputSchemaValidatorV1027 {
    private schema: SchemaDefinition;
    private toolOutput: unknown;

    constructor(schema: SchemaDefinition, toolOutput: unknown) {
        this.schema = schema;
        this.toolOutput = toolOutput;
    }

    public validate(context: ValidatorContext): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: []
        };

        if (!this.schema) {
            result.isValid = false;
            result.errors.push({
                path: "",
                message: "Schema definition is missing for StructuredToolOutputSchemaValidatorV1027."
            });
            return result;
        }

        try {
            this.recursiveValidate(this.schema, this.toolOutput, "", context);
        } catch (e) {
            result.isValid = false;
            result.errors.push({
                path: "",
                message: `Validation failed due to internal error: ${(e as Error).message}`
            });
        }

        return result;
    }

    private recursiveValidate(schema: SchemaDefinition, data: unknown, path: string, context: ValidatorContext): void {
        if (typeof data !== 'object' || data === null) {
            if (schema.type && schema.type !== 'any') {
                throw new Error(`Expected type ${schema.type} at path ${path}, but received ${typeof data}.`);
            }
            return;
        }

        if (schema.properties) {
            for (const key in schema.properties) {
                if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
                    const propSchema = schema.properties[key];
                    const value = (data as Record<string, unknown>)[key];
                    const newPath = path ? `${path}.${key}` : key;

                    if (value === undefined) {
                        if (propSchema.required) {
                            throw new Error(`Missing required property '${key}' at path ${newPath}.`);
                        }
                        continue;
                    }

                    this.recursiveValidate(propSchema, value, newPath, context);
                }
            }
        }

        if (schema.items && typeof data === 'object' && !Array.isArray(data)) {
            // Handle array of objects case if schema defines 'items' for array structure
            // Assuming 'items' defines the structure for array elements
            const itemSchema = schema.items;
            if (itemSchema) {
                this.recursiveValidate(itemSchema, data, path, context);
            }
        }
    }
}