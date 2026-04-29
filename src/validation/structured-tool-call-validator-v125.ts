import { Message, ToolUseBlock, ContentBlock } from "./types";

export class StructuredToolCallValidatorV125 {
    private toolDefinitions: Map<string, any>;
    private contextMessages: Message[];

    constructor(toolDefinitions: Record<string, any>, contextMessages: Message[]) {
        this.toolDefinitions = new Map(Object.entries(toolDefinitions));
        this.contextMessages = contextMessages;
    }

    private validateToolCall(toolUse: ToolUseBlock, definition: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let isValid = true;

        if (!definition) {
            errors.push(`Tool definition missing for tool name: ${toolUse.name}`);
            return { isValid: false, errors };
        }

        const schema = definition.parameters;
        if (!schema) {
            errors.push(`Tool ${toolUse.name} has no defined parameters schema.`);
            return { isValid: false, errors };
        }

        const requiredParams = Object.keys(schema.properties || {}).filter(key => schema.required && schema.required.includes(key));

        for (const paramName of requiredParams) {
            if (!(paramName in toolUse.input)) {
                errors.push(`Missing required parameter '${paramName}' for tool '${toolUse.name}'.`);
                isValid = false;
            }
        }

        // Basic type checking simulation (assuming schema defines types)
        for (const paramName of Object.keys(schema.properties || {})) {
            const expectedType = schema.properties[paramName].type;
            const actualValue = toolUse.input[paramName];

            if (actualValue === undefined) continue;

            if (expectedType === "string" && typeof actualValue !== "string") {
                errors.push(`Parameter '${paramName}' expected type 'string' but got ${typeof actualValue}.`);
                isValid = false;
            } else if (expectedType === "number" && typeof actualValue !== "number") {
                errors.push(`Parameter '${paramName}' expected type 'number' but got ${typeof actualValue}.`);
                isValid = false;
            }
            // Add more type checks as necessary
        }

        return { isValid: errors.length === 0, errors };
    }

    public validateToolCallSequence(toolUses: ToolUseBlock[]): { isValid: boolean; errors: string[] } {
        const allErrors: string[] = [];
        let overallValid = true;

        for (const toolUse of toolUses) {
            const definition = this.toolDefinitions.get(toolUse.name);
            const { isValid: callValid, errors: callErrors } = this.validateToolCall(toolUse, definition);

            if (!callValid) {
                allErrors.push(`Validation failed for tool call ${toolUse.id} (${toolUse.name}): ${callErrors.join('; ')}`);
                overallValid = false;
            }
        }

        // Cross-call dependency check (Placeholder: assumes no explicit dependency graph is provided,
        // so we only check for structural validity based on context/schema adherence)

        return { isValid: overallValid, errors: allErrors };
    }

    public validateTurn(toolUses: ToolUseBlock[]): { isValid: boolean; errors: string[] } {
        const toolCallValidation = this.validateToolCallSequence(toolUses);

        if (!toolCallValidation.isValid) {
            return { isValid: false, errors: toolCallValidation.errors };
        }

        // Contextual validation (e.g., ensuring the tool call is appropriate given previous messages)
        const contextErrors: string[] = [];
        if (this.contextMessages.length > 0) {
            // Simple check: if the last message was a tool result, we shouldn't be proposing new calls unless explicitly allowed.
            const lastMessage = this.contextMessages[this.contextMessages.length - 1];
            if (lastMessage.role === "tool" && toolUses.length > 0) {
                contextErrors.push("Cannot propose new tool calls immediately after receiving a tool result without further user input or explicit orchestration step.");
            }
        }

        const allErrors = [...toolCallValidation.errors, ...contextErrors];
        const overallValid = allErrors.length === 0;

        return { isValid: overallValid, errors: allErrors };
    }
}