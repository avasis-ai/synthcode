import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface SchemaDefinition {
    type: "object" | "array" | "string" | "number" | "boolean" | "enum" | "union";
    properties?: Record<string, SchemaDefinition>;
    items?: SchemaDefinition;
    enum?: string[];
    required?: string[];
    unionOf?: SchemaDefinition[];
    discriminator?: {
        propertyName: string;
        mapping: Record<string, SchemaDefinition>;
    };
}

interface ValidationContext {
    message: Message;
    schema: SchemaDefinition;
    path: string;
    metadata: Record<string, any>;
}

abstract class BaseSchemaValidator {
    abstract validate(data: unknown, context: ValidationContext): { isValid: boolean; errors: string[] };
}

class StructuredToolOutputSchemaValidatorV1019Advanced extends BaseSchemaValidator {
    validate(data: unknown, context: ValidationContext): { isValid: boolean; errors: string[] } {
        const schema = context.schema;
        const path = context.path;
        const errors: string[] = [];

        if (typeof data !== 'object' || data === null) {
            if (schema.type !== "object" && schema.type !== "array") {
                return { isValid: false, errors: [`Expected type ${schema.type}, but received ${typeof data}`] };
            }
        }

        try {
            if (schema.type === "object") {
                this.validateObject(data as Record<string, unknown>, schema, context, errors);
            } else if (schema.type === "array") {
                this.validateArray(data as unknown[], schema, context, errors);
            } else if (schema.type === "union") {
                this.validateUnion(data, schema, context, errors);
            } else if (schema.type === "enum") {
                this.validateEnum(data, schema, context, errors);
            } else {
                // Primitive types validation (string, number, boolean)
                this.validatePrimitive(data, schema, context, errors);
            }
        } catch (e) {
            errors.push(`Validation failed due to internal error: ${(e as Error).message}`);
        }

        return { isValid: errors.length === 0, errors };
    }

    private validateObject(data: Record<string, unknown>, schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        if (!schema.properties) {
            return;
        }

        const requiredProps = schema.required || [];
        const properties = schema.properties;

        for (const key in properties) {
            const propSchema = properties[key];
            const fullPath = `${context.path}.${key}`;
            const value = data[key];

            if (requiredProps.includes(key) && value === undefined) {
                errors.push(`Missing required property: ${key}`);
                continue;
            }

            if (value !== undefined) {
                const newContext: ValidationContext = {
                    message: context.message,
                    schema: propSchema,
                    path: fullPath,
                    metadata: { ...context.metadata, parentPath: context.path }
                };
                const result = this.validate(value, newContext);
                if (!result.isValid) {
                    errors.push(...result.errors.map(err => `[${key}] ${err}`));
                }
            }
        }
    }

    private validateArray(data: unknown[], schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        if (!schema.items) {
            errors.push("Array schema must define 'items'.");
            return;
        }

        for (let i = 0; i < data.length; i++) {
            const itemValue = data[i];
            const fullPath = `${context.path}[${i}]`;
            const newContext: ValidationContext = {
                message: context.message,
                schema: schema.items,
                path: fullPath,
                metadata: { ...context.metadata, parentPath: context.path }
            };
            const result = this.validate(itemValue, newContext);
            if (!result.isValid) {
                errors.push(...result.errors.map(err => `[${i}] ${err}`));
            }
        }
    }

    private validateUnion(data: unknown, schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        const unionSchemas = schema.unionOf || [];
        let matched = false;

        for (let i = 0; i < unionSchemas.length; i++) {
            const unionSchema = unionSchemas[i];
            const newContext: ValidationContext = {
                message: context.message,
                schema: unionSchema,
                path: `${context.path} (union ${i})`,
                metadata: { ...context.metadata, parentPath: context.path }
            };
            const result = this.validate(data, newContext);
            if (result.isValid) {
                matched = true;
                break; // Success in any branch is enough for a union
            }
        }

        if (!matched) {
            errors.push(`Data did not match any schema in the union.`);
        }
    }

    private validateEnum(data: unknown, schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        const enumValues = schema.enum;
        if (!enumValues || enumValues.length === 0) {
            return;
        }

        const isMatch = enumValues.includes(String(data));
        if (!isMatch) {
            errors.push(`Value must be one of: ${enumValues.join(', ')}.`);
        }
    }

    private validatePrimitive(data: unknown, schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        const expectedType = schema.type;
        const actualType = typeof data;

        if (expectedType === "string") {
            if (actualType !== "string") {
                errors.push(`Expected string, got ${actualType}.`);
            }
        } else if (expectedType === "number") {
            if (actualType !== "number" || isNaN(data as number)) {
                errors.push(`Expected number, got ${actualType}.`);
            }
        } else if (expectedType === "boolean") {
            if (actualType !== "boolean") {
                errors.push(`Expected boolean, got ${actualType}.`);
            }
        } else if (expectedType === "object" && (data === null || Array.isArray(data))) {
            // Handled by object/array validation paths, but for completeness:
            if (Array.isArray(data)) {
                // This case should ideally be caught by the array validator
            } else if (data === null) {
                errors.push("Cannot validate null against object schema.");
            }
        }
    }

    private validateDiscriminator(data: unknown, schema: SchemaDefinition, context: ValidationContext, errors: string[]): void {
        const discriminator = schema.discriminator;
        if (!discriminator) return;

        const { propertyName, mapping } = discriminator;
        const value = (data as Record<string, unknown>)[propertyName];

        if (value === undefined) {
            errors.push(`Discriminator property '${propertyName}' is missing.`);
            return;
        }

        const typeKey = String(value);
        const specificSchema = mapping[typeKey];

        if (!specificSchema) {
            errors.push(`Unknown type '${typeKey}' for discriminator property '${propertyName}'.`);
            return;
        }

        const newContext: ValidationContext = {
            message: context.message,
            schema: specificSchema,
            path: `${context.path} (disc=${typeKey})`,
            metadata: { ...context.metadata, parentPath: context.path }
        };
        const result = this.validate(value, newContext);
        if (!result.isValid) {
            errors.push(...result.errors.map(err => `[Discriminator ${typeKey}] ${err}`));
        }
    }
}

export const createSchemaValidator = (): StructuredToolOutputSchemaValidatorV1019Advanced => {
    return new StructuredToolOutputSchemaValidatorV1019Advanced();
};