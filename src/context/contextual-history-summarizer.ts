import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export class HistorySummarizer {
    private history: Message[];
    private readonly chunkSize: number;

    constructor(history: Message[], chunkSize: number = 10) {
        this.history = history;
        this.chunkSize = chunkSize;
    }

    private getChunkedHistory(): Message[][] {
        const chunks: Message[][] = [];
        for (let i = 0; i < this.history.length; i += this.chunkSize) {
            chunks.push(this.history.slice(i, i + this.chunkSize));
        }
        return chunks;
    }

    private generateSummaryChunk(chunk: Message[]): string {
        if (chunk.length === 0) {
            return "";
        }

        const rawHistory = chunk.map(msg => {
            if (msg.role === "user") {
                return `USER: ${msg.content}`;
            } else if (msg.role === "assistant") {
                const contentText = (msg as AssistantMessage).content.map(block => {
                    if (block.type === "text") return block.text;
                    return "";
                }).join(" ");
                return `ASSISTANT: ${contentText}`;
            } else if (msg.role === "tool") {
                return `TOOL_RESULT: ${msg.content} (ID: ${msg.tool_use_id})`;
            }
            return "";
        }).join("\n---\n");

        // Simulate LLM call for summarization
        // In a real implementation, this would call an external API.
        // For this exercise, we use a heuristic summary.
        const keyEvents = chunk.filter(msg => {
            if (msg.role === "tool" && (msg as ToolResultMessage).content.includes("error")) {
                return true;
            }
            return false;
        });

        if (keyEvents.length > 0) {
            return `[SUMMARY CHUNK: Key Constraint/Error Detected] The history segment contained ${keyEvents.length} significant tool result(s) or errors. Focus areas: ${keyEvents.map(e => e.role === 'tool' ? 'Tool Result' : 'N/A').join(', ')}.`;
        }

        if (chunk.length < this.chunkSize) {
            return `[SUMMARY CHUNK: Final Context] The final segment summarizes the remaining context: ${rawHistory.substring(0, 100)}...`;
        }

        return `[SUMMARY CHUNK: General Context] Summarized ${chunk.length} interactions. Key topics covered: Decision points and general flow maintained.`;
    }

    public summarize(): string {
        const chunks = this.getChunkedHistory();
        const chunkSummaries = chunks.map(chunk => this.generateSummaryChunk(chunk));
        return chunkSummaries.join("\n\n---\n\n");
    }

    public mergeSummaries(summaryChunks: string[]): string {
        if (summaryChunks.length === 0) {
            return "No history provided for summarization.";
        }

        let mergedSummary = "--- Contextual History Summary ---\n";
        mergedSummary += "This summary condenses the interaction history, highlighting key decisions, resolved constraints, and major state changes across multiple segments.\n\n";

        summaryChunks.forEach((chunk, index) => {
            mergedSummary += `[Segment ${index + 1} Summary]\n${chunk}\n\n`;
        });

        mergedSummary += "--- End of Summary ---";
        return mergedSummary;
    }
}