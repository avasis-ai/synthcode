import { Message, ToolUseBlock, ToolResultMessage } from "./types";

interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

interface ContextState {
    context: Record<string, any>;
    history: Message[];
}

type ValidatorResult = {
    isValid: boolean;
    errors: string[];
    finalState: Record<string, any>;
}

export class ContextualToolCallValidator {
    private initialContext: Record<string, any>;

    constructor(initialContext: Record<string, any>) {
        this.initialContext = initialContext;
    }

    private enrichContext(messages: Message[]): ContextState {
        let state: Record<string, any> = { ...this.initialContext };
        let history: Message[] = [];

        for (const message of messages) {
            if (message.role === "tool" && (message as ToolResultMessage).tool_use_id) {
                const toolResult = message as ToolResultMessage;
                state = { ...state, [toolResult.tool_use_id]: toolResult.content };
                history.push(message);
            } else if (message.role === "user") {
                history.push(message);
            } else if (message.role === "assistant") {
                // Simplified handling for assistant message content blocks
                const assistantMessage = message as AssistantMessage;
                const toolUses: ToolUseBlock[] = assistantMessage.content
                    .filter((block: any) => block.type === "tool_use")
                    .map((block: any) => ({
                        id: block.id,
                        name: block.name,
                        input: block.input,
                    }));
                
                // In a real scenario, we'd process tool use requests here, 
                // but for context enrichment, we just track the intent.
                history.push(message);
            }
        }

        return { context: state, history: history };
    }

    private validateToolCallInput(call: ToolCall, state: Record<string, any>): string[] {
        const errors: string[] = [];
        // Placeholder for complex domain-specific validation based on 'state'
        if (call.input && typeof call.input === 'object') {
            for (const key in call.input) {
                const value = call.input[key];
                if (typeof value === 'string' && value.length > 50) {
                    errors.push(`Input for '${key}' seems excessively long.`);
                }
            }
        }
        return errors;
    }

    private validateCrossToolConsistency(calls: ToolCall[], finalState: Record<string, any>): string[] {
        const errors: string[] = [];
        // Example: Check if a tool that requires 'user_id' was called, but 'user_id' is missing from the final state.
        const requiresUserId = calls.some(c => c.name.includes("user_profile"));
        if (requiresUserId && !finalState['user_id']) {
            errors.push("Cross-tool consistency error: A tool requiring 'user_id' was called, but no 'user_id' was established in the context.");
        }
        return errors;
    }

    public validate(
        toolCalls: ToolCall[],
        messageHistory: Message[]
    ): ValidatorResult {
        const enrichedContext = this.enrichContext(messageHistory);
        let currentState: Record<string, any> = { ...enrichedContext.context };
        const validationErrors: string[] = [];
        const processedCalls: ToolCall[] = [];

        for (const call of toolCalls) {
            // 1. Input Validation against current state
            const inputErrors = this.validateToolCallInput(call, currentState);
            if (inputErrors.length > 0) {
                validationErrors.push(`Validation failed for tool '${call.name}': ${inputErrors.join('; ')}`);
                continue;
            }

            // 2. Simulate execution and update state (Mocking tool execution)
            try {
                // In a real system, this would call the actual tool executor.
                // Here, we simulate a successful update based on the call's intent.
                const mockResultContent = `Successfully executed ${call.name} with input ${JSON.stringify(call.input)}.`;
                
                // Update state based on the tool's presumed output structure
                currentState = { ...currentState, [`${call.name}_result`]: mockResultContent };
                processedCalls.push(call);

            } catch (e) {
                validationErrors.push(`Execution failed for tool '${call.name}': ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        // 3. Final Cross-Tool Consistency Check
        const crossToolErrors = this.validateCrossToolConsistency(processedCalls, currentState);
        validationErrors.push(...crossToolErrors);

        return {
            isValid: validationErrors.length === 0,
            errors: validationErrors,
            finalState: currentState,
        };
    }
}