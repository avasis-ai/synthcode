import { ToolResultMessage, Message, ContentBlock, TextBlock } from "./types";

export class ToolCallResultAggregator {
    private results: Map<string, ToolResultMessage[]>;

    constructor() {
        this.results = new Map<string, ToolResultMessage[]>();
    }

    public addResult(result: ToolResultMessage): void {
        const key = result.tool_use_id;
        if (!this.results.has(key)) {
            this.results.set(key, []);
        }
        const existingResults = this.results.get(key)!;
        existingResults.push(result);
    }

    public aggregate(): ToolResultMessage[] {
        const aggregated: ToolResultMessage[] = [];
        for (const [key, results] of this.results.entries()) {
            // For simplicity, we take the last result or combine them if necessary.
            // Here, we'll just return the last one as the primary representation
            // unless a more complex merging logic is required.
            // For this implementation, we assume the last result is the most complete.
            aggregated.push(results[results.length - 1]);
        }
        return aggregated;
    }

    public formatForLLM(results: ToolResultMessage[]): Message[] {
        if (results.length === 0) {
            return [];
        }

        const toolMessages: Message[] = results.map(result => ({
            role: "tool",
            tool_use_id: result.tool_use_id,
            content: result.content,
            is_error: result.is_error ?? false,
        }));

        return toolMessages;
    }
}