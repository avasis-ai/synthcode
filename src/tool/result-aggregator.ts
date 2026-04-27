import { ToolResultMessage, ContentBlock, TextBlock } from "./types";

export class ToolResultAggregator {
    private results: ToolResultMessage[];

    constructor(results: ToolResultMessage[]) {
        this.results = results;
    }

    private getToolId(result: ToolResultMessage): string {
        return result.tool_use_id;
    }

    private groupResultsByTool(results: ToolResultMessage[]): Map<string, ToolResultMessage[]> {
        const grouped = new Map<string, ToolResultMessage[]>();
        for (const result of results) {
            const toolId = this.getToolId(result);
            if (!grouped.has(toolId)) {
                grouped.set(toolId, []);
            }
            grouped.get(toolId)!.push(result);
        }
        return grouped;
    }

    private summarizeToolResults(toolResults: ToolResultMessage[]): TextBlock {
        if (toolResults.length === 0) {
            return { type: "text", text: "" };
        }

        const successfulResults: ToolResultMessage[] = toolResults.filter(r => !r.is_error);
        const errorResults: ToolResultMessage[] = toolResults.filter(r => r.is_error);

        let summaryText = "";

        if (successfulResults.length > 0) {
            const successfulContent = successfulResults.map(r => `[Tool Output for ${r.tool_use_id}]:\n${r.content}`).join("\n\n");
            summaryText += `\n--- Successful Tool Outputs ---\n${successfulContent}\n\n`;
        }

        if (errorResults.length > 0) {
            const errorContent = errorResults.map(r => `[Tool Error for ${r.tool_use_id}]:\n${r.content}`).join("\n\n");
            summaryText += `\n--- Tool Errors Encountered ---\n${errorContent}\n`;
        }

        return { type: "text", text: summaryText.trim() };
    }

    public aggregate(): TextBlock {
        if (this.results.length === 0) {
            return { type: "text", text: "No tool results were provided for aggregation." };
        }

        const grouped = this.groupResultsByTool(this.results);
        const aggregatedBlocks: TextBlock[] = [];

        for (const [toolId, toolResults] of grouped.entries()) {
            const summary = this.summarizeToolResults(toolResults);
            aggregatedBlocks.push(summary);
        }

        const finalSummaryText = aggregatedBlocks.map(block => block.text).join("\n\n---\n\n");

        return { type: "text", text: `\n\n[Aggregated Tool Results]\n${finalSummaryText}` };
    }

    public toContextBlock(): ContentBlock {
        return this.aggregate();
    }
}