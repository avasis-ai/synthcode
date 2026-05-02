import { Message, ToolResultMessage } from "./types";

type SchemaValidator = (data: unknown) => { isValid: boolean; errors: string[] };

export class ToolOutputSchemaValidationGuardrail {
    private validator: SchemaValidator;
    private schema: Record<string, any>;

    constructor(validator: SchemaValidator, schema: Record<string, any>) {
        this.validator = validator;
        this.schema = schema;
    }

    validate(toolOutput: ToolResultMessage): { isValid: boolean; errors: string[]; validatedOutput: unknown } {
        const rawData = JSON.parse(toolOutput.content);
        const validationResult = this.validator(rawData);

        if (!validationResult.isValid) {
            return {
                isValid: false,
                errors: [`Schema validation failed for tool output. Errors: ${validationResult.errors.join('; ')}`],
                validatedOutput: rawData
            };
        }

        return {
            isValid: true,
            errors: [],
            validatedOutput: rawData
        };
    }

    async execute(
        input: {
            message: Message;
            context: Message[];
        }
    ): Promise<{
        message: Message;
        context: Message[];
        shouldContinue: boolean;
        validationReport: {
            isValid: boolean;
            errors: string[];
            validatedOutput: unknown;
        };
    }> {
        if (input.message.role !== "tool") {
            return {
                message: input.message,
                context: input.context,
                shouldContinue: true,
                validationReport: { isValid: true, errors: [], validatedOutput: null }
            };
        }

        const toolResultMessage = input.message as ToolResultMessage;
        const validationReport = this.validate(toolResultMessage);

        let validatedContent: string | null = null;
        let shouldContinue = true;

        if (validationReport.isValid) {
            try {
                // Assuming the validated output should be serialized back to a string for the Message structure
                validatedContent = JSON.stringify(validationReport.validatedOutput);
            } catch (e) {
                shouldContinue = false;
                validationReport.errors.push("Failed to serialize validated output back to JSON string.");
            }
        } else {
            shouldContinue = false;
        }

        const newToolResultMessage: ToolResultMessage = {
            role: "tool",
            tool_use_id: toolResultMessage.tool_use_id,
            content: validatedContent !== null ? JSON.stringify(validationReport.validatedOutput) : toolResultMessage.content,
            is_error: !validationReport.isValid
        };

        return {
            message: newToolResultMessage,
            context: [...input.context, newToolResultMessage],
            shouldContinue: shouldContinue,
            validationReport: validationReport
        };
    }
}