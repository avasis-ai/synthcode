import { Message, ToolUseBlock, ContentBlock, TextBlock, ThinkingBlock } from "./types";

export class ContextualToolCallValidator {
    private history: Message[];

    constructor(history: Message[] = []) {
        this.history = history;
    }

    public validate(
        currentToolCall: {
            tool_name: string;
            input: Record<string, unknown>;
        },
        currentContext: Record<string, unknown>
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.validateContextDrift(currentToolCall, currentContext)) {
            errors.push("Context drift detected: The current tool call relies on context that is inconsistent or missing from the history.");
        }

        if (!this.validateRequiredContext(currentToolCall, currentContext)) {
            errors.push("Missing required context: The tool call requires specific context elements that were not provided or derived.");
        }

        if (!this.validateToolCallConsistency(currentToolCall)) {
            errors.push("Tool call inconsistency: The proposed tool call parameters do not align with the expected state derived from previous interactions.");
        }

        const isValid = errors.length === 0;
        return { isValid, errors };
    }

    private validateContextDrift(
        toolCall: { tool_name: string; input: Record<string, unknown> },
        context: Record<string, unknown>
    ): boolean {
        const requiredKeys = ["user_id", "session_state", "last_tool_output_id"];
        for (const key of requiredKeys) {
            if (context[key] === undefined || context[key] === null) {
                return false;
            }
        }
        return true;
    }

    private validateRequiredContext(
        toolCall: { tool_name: string; input: Record<string, unknown> },
        context: Record<string, unknown>
    ): boolean {
        const requiredInputs: Record<string, string[]> = {
            "user_id": ["user_id"],
            "session_state": ["session_state"],
        };

        for (const [contextKey, requiredKeys] of Object.entries(requiredInputs)) {
            if (!context[contextKey] || !Array.isArray(context[contextKey]) || !requiredKeys.every(key => (context[contextKey] as string[]).includes(key))) {
                return false;
            }
        }
        return true;
    }

    private validateToolCallConsistency(
        toolCall: { tool_name: string; input: Record<string, unknown> }
    ): boolean {
        const knownTools: Record<string, string[]> = {
            "get_user_profile": ["user_id", "profile_fields"],
            "search_database": ["query", "scope"],
        };

        const expectedInputs = knownTools[toolCall.tool_name];
        if (!expectedInputs) {
            return false;
        }

        for (const expectedKey of expectedInputs) {
            if (!(expectedKey in toolCall.input)) {
                return false;
            }
        }
        return true;
    }
}