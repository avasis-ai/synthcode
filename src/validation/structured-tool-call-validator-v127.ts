import { Validator, ValidationContext } from "../validation/validator";
import { ToolCallSchema, ToolCallArguments } from "../types/tool-call-types";

export class StructuredToolCallValidatorV127 implements Validator {
    validate(context: ValidationContext, data: any): { isValid: boolean; errors: string[] } {
        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ["Tool call data must be a non-null object."] };
        }

        const toolCallData = data as ToolCallArguments;
        const schema = context.getToolSchema();

        if (!schema) {
            return { isValid: false, errors: ["Tool schema is not provided in the validation context."] };
        }

        const errors: string[] = [];

        // 1. Basic structure validation
        if (!toolCallData.name || typeof toolCallData.name !== 'string') {
            errors.push("Tool call must specify a 'name' field.");
        }
        if (!toolCallData.arguments || typeof toolCallData.arguments !== 'object') {
            errors.push("Tool call must specify 'arguments' as an object.");
        }

        // 2. Schema adherence and recursive argument validation
        if (errors.length === 0) {
            const argErrors = this.validateArguments(toolCallData.arguments, schema.parameters);
            if (argErrors.length > 0) {
                errors.push(...argErrors);
            }
        }

        // 3. Cross-field and Temporal Constraints (Example: checking for required arguments based on tool name)
        if (errors.length === 0 && schema.required_args) {
            for (const requiredArg of schema.required_args) {
                if (!(requiredArg in toolCallData.arguments) || toolCallData.arguments[requiredArg] === undefined || toolCallData.arguments[requiredArg] === null) {
                    errors.push(`Missing required argument '${requiredArg}' for tool '${schema.name}'.`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    }

    private validateArguments(data: Record<string, unknown>, schema: any): string[] {
        const errors: string[] = [];

        if (typeof data !== 'object' || data === null) {
            return ["Arguments must be a valid JSON object."];
        }

        const keys = Object.keys(data);

        for (const key of keys) {
            const value = data[key];
            const propSchema = schema?.[key];

            if (!propSchema) {
                errors.push(`Argument '${key}' is not defined in the tool schema parameters.`);
                continue;
            }

            // Type checking
            const expectedType = propSchema.type;
            const actualType = typeof value;

            if (expectedType === 'string' && !(actualType === 'string')) {
                errors.push(`Argument '${key}' expected type 'string' but got '${actualType}'.`);
            } else if (expectedType === 'number' && !(actualType === 'number')) {
                errors.push(`Argument '${key}' expected type 'number' but got '${actualType}'.`);
            } else if (expectedType === 'boolean' && !(actualType === 'boolean')) {
                errors.push(`Argument '${key}' expected type 'boolean' but got '${actualType}'.`);
            } else if (expectedType === 'object' && (actualType !== 'object' || Array.isArray(value) || value === null)) {
                errors.push(`Argument '${key}' expected type 'object' but got '${actualType}'.`);
            }

            // Recursive validation for nested objects (simplified)
            if (expectedType === 'object' && actualType === 'object' && value !== null && !Array.isArray(value)) {
                const nestedErrors = this.validateObject(value, propSchema.properties);
                errors.push(...nestedErrors);
            }
        }

        return errors;
    }

    private validateObject(data: Record<string, unknown>, schema: any): string[] {
        const errors: string[] = [];
        const keys = Object.keys(data);

        for (const key of keys) {
            const value = data[key];
            const propSchema = schema?.[key];

            if (!propSchema) continue;

            const expectedType = propSchema.type;
            const actualType = typeof value;

            if (expectedType === 'object' && actualType === 'object' && value !== null && !Array.isArray(value)) {
                const nestedErrors = this.validateObject(value, propSchema.properties);
                errors.push(...nestedErrors);
            } else if (expectedType === 'string' && !(actualType === 'string')) {
                errors.push(`Nested argument '${key}' expected type 'string' but got '${actualType}'.`);
            }
        }
        return errors;
    }
}