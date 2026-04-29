import { ValidatorBase } from "./validator-base";
import { ToolCallSchema, ToolCallArgumentsSchema } from "../schemas/tool-call-schemas";

export class StructuredToolCallValidatorV138 extends ValidatorBase {
    constructor() {
        super("structured-tool-call-validator-v138");
    }

    validate(data: { messages: Message[] }): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!data || !data.messages || data.messages.length === 0) {
            return { isValid: false, errors: ["Messages array is required and cannot be empty."] };
        }

        for (let i = 0; i < data.messages.length; i++) {
            const message = data.messages[i];

            if (message.role === "assistant" && message.content && message.content.some(block => block.type === "tool_use")) {
                const toolUseBlock = message.content.find(block => block.type === "tool_use") as ToolUseBlock;
                if (toolUseBlock) {
                    const toolCallValidation = this.validateToolCall(toolUseBlock, i, data.messages);
                    if (!toolCallValidation.isValid) {
                        errors.push(...toolCallValidation.errors);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    private validateToolCall(toolUseBlock: ToolUseBlock, messageIndex: number, messages: Message[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!toolUseBlock.id || typeof toolUseBlock.id !== 'string') {
            errors.push(`Message at index ${messageIndex}: ToolUseBlock requires a valid 'id'.`);
        }

        if (!toolUseBlock.name || typeof toolUseBlock.name !== 'string') {
            errors.push(`Message at index ${messageIndex}: ToolUseBlock requires a valid 'name'.`);
        }

        if (typeof toolUseBlock.input !== 'object' || toolUseBlock.input === null) {
            errors.push(`Message at index ${messageIndex}: ToolUseBlock requires a valid 'input' object.`);
        } else {
            const argsValidation = this.validateToolCallArguments(toolUseBlock.input, toolUseBlock.name, messageIndex);
            if (!argsValidation.isValid) {
                errors.push(...argsValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    private validateToolCallArguments(input: Record<string, unknown>, toolName: string, messageIndex: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const schema = ToolCallArgumentsSchema[toolName];

        if (!schema) {
            errors.push(`Message at index ${messageIndex}: No schema found for tool '${toolName}'.`);
            return { isValid: false, errors: errors };
        }

        for (const key in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
                const fieldSchema = schema[key];
                const value = (input as any)[key];

                if (value === undefined || value === null) {
                    if (fieldSchema.required && typeof fieldSchema.required === 'boolean' && fieldSchema.required) {
                        errors.push(`Message at index ${messageIndex}: ToolCall argument '${key}' is required but missing.`);
                    }
                    continue;
                }

                if (typeof fieldSchema.validate === 'function') {
                    const validationResult = fieldSchema.validate(value, key, toolName);
                    if (!validationResult.isValid) {
                        errors.push(`Message at index ${messageIndex}: ToolCall argument '${key}' failed validation. ${validationResult.message}`);
                    }
                } else if (fieldSchema.type && typeof fieldSchema.type === 'string') {
                    // Basic type checking fallback
                    const expectedType = fieldSchema.type;
                    const actualType = typeof value;
                    if (expectedType === 'string' && actualType !== 'string') {
                        errors.push(`Message at index ${messageIndex}: ToolCall argument '${key}' expected type 'string' but got '${actualType}'.`);
                    } else if (expectedType === 'number' && actualType !== 'number') {
                        errors.push(`Message at index ${messageIndex}: ToolCall argument '${key}' expected type 'number' but got '${actualType}'.`);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}