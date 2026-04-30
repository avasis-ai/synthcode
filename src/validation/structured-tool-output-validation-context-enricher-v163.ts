import { ContextEnricher, ValidationContext, ExecutionHistory, ToolUsageContext } from "./context-enricher-types";

export class StructuredToolOutputValidationContextEnricherV163 implements ContextEnricher {
    enrich(
        context: ValidationContext,
        history: ExecutionHistory,
        toolContext: ToolUsageContext
    ): ValidationContext {
        const enrichedContext: ValidationContext = {
            ...context,
            metadata: {
                ...context.metadata,
                toolExecutionHistory: this.processExecutionHistory(history),
                recentToolOutputs: this.processToolOutputs(history),
                currentToolUsageContext: toolContext,
            }
        };

        return enrichedContext;
    }

    private processExecutionHistory(history: ExecutionHistory): Record<string, unknown> {
        const lastToolResults: { tool_use_id: string; content: string; is_error?: boolean }[] = [];
        const failurePattern: { count: number; lastSeen: number } = { count: 0, lastSeen: 0 };

        for (let i = history.length - 1; i >= 0; i--) {
            const message = history[i];
            if (message.role === "tool") {
                const toolMessage = message as ToolResultMessage;
                lastToolResults.push({
                    tool_use_id: toolMessage.tool_use_id,
                    content: toolMessage.content,
                    is_error: toolMessage.is_error
                });
            } else if (message.role === "tool" && message.content) {
                // Assuming ToolResultMessage structure is used for tool outputs in history
                const toolMessage = message as ToolResultMessage;
                lastToolResults.push({
                    tool_use_id: toolMessage.tool_use_id,
                    content: toolMessage.content,
                    is_error: toolMessage.is_error
                });
            }

            if (message.role === "tool" && (message as ToolResultMessage).is_error) {
                failurePattern.count += 1;
                failurePattern.lastSeen = history.length - i;
            }
        }

        return {
            lastToolResults: lastToolResults.slice(0, 5), // Keep last 5
            failurePattern: failurePattern,
        };
    }

    private processToolOutputs(history: ExecutionHistory): { tool_use_id: string; content: string; is_error?: boolean }[] {
        const outputs: { tool_use_id: string; content: string; is_error?: boolean }[] = [];
        for (const message of history) {
            if (message.role === "tool") {
                const toolMessage = message as ToolResultMessage;
                outputs.push({
                    tool_use_id: toolMessage.tool_use_id,
                    content: toolMessage.content,
                    is_error: toolMessage.is_error
                });
            }
        }
        return outputs;
    }
}