import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ContextChunk {
    messages: Message[];
    score: number;
    summary?: string;
}

export class AdaptiveContextWindowManager {
    private readonly maxTokens: number;
    private contextHistory: ContextChunk[] = [];

    constructor(maxTokens: number) {
        this.maxTokens = maxTokens;
    }

    private calculateImportanceScore(messages: Message[]): number {
        if (messages.length === 0) {
            return 0;
        }

        let score = 0;
        let complexityWeight = 1.0;

        for (const message of messages) {
            let contentLength = 0;
            if (message.role === "user") {
                contentLength = message.content.length;
                score += 1.5; // User input is often high importance
            } else if (message.role === "assistant") {
                contentLength = message.content.length;
                score += 1.0;
            } else if (message.role === "tool") {
                contentLength = message.content.length;
                score += 0.8; // Tool results are factual but might be noisy
            }

            // Simple complexity heuristic: longer messages or tool results increase score slightly
            score += Math.min(1.0, contentLength / 100);
        }

        // Topic drift detection proxy: penalize very old, low-interaction messages slightly
        // For simplicity, we just return the accumulated score.
        return score;
    }

    private chunkContext(messages: Message[]): ContextChunk {
        const score = this.calculateImportanceScore(messages);
        return {
            messages: [...messages],
            score: score,
        };
    }

    public addMessages(newMessages: Message[]): void {
        const newChunk = this.chunkContext(newMessages);
        this.contextHistory.push(newChunk);
    }

    public getPrioritizedContext(): ContextChunk[] {
        // Sort by score descending (most important first)
        const sortedContext = [...this.contextHistory].sort((a, b) => b.score - a.score);
        return sortedContext;
    }

    public analyzeAndPrune(currentTokens: number): {
        prunedContext: ContextChunk[];
        suggestion: string;
    } {
        let totalScore = 0;
        let totalTokens = 0;
        let currentContext = [...this.contextHistory];

        // Calculate total score and tokens of current context
        for (const chunk of currentContext) {
            totalScore += chunk.score;
            // Rough token estimation: 1 token per 4 characters + 1 token per message
            const chunkTokenEstimate = chunk.messages.reduce((acc, msg) => acc + (msg.content.length / 4) + 1, 0);
            totalTokens += chunkTokenEstimate;
        }

        if (totalTokens <= this.maxTokens * 0.8) {
            return {
                prunedContext: currentContext,
                suggestion: "Context window is healthy. No pruning necessary.",
            };
        }

        const neededReduction = totalTokens - this.maxTokens;
        let remainingCapacity = this.maxTokens;
        let prunedContext: ContextChunk[] = [];
        let reductionAmount = 0;

        // 1. Sort by score (lowest score first for pruning candidates)
        const sortedCandidates = [...currentContext].sort((a, b) => a.score - b.score);

        // 2. Iteratively prune the lowest scoring chunks until capacity is met
        for (const chunk of sortedCandidates) {
            const chunkTokenEstimate = chunk.messages.reduce((acc, msg) => acc + (msg.content.length / 4) + 1, 0);

            if (remainingCapacity < chunkTokenEstimate * 0.9) {
                // If the next chunk is too big to fit, we stop pruning here
                break;
            }

            prunedContext.push(chunk);
            remainingCapacity -= chunkTokenEstimate;
            reductionAmount += chunkTokenEstimate;
        }

        // Re-sort the final context by score (highest first) for the output
        prunedContext.sort((a, b) => b.score - a.score);

        let suggestion: string;
        if (reductionAmount > 0) {
            suggestion = `Warning: Context was pruned by estimating a reduction of ${Math.round(reductionAmount)} tokens. Consider summarizing older, lower-scoring blocks.`;
        } else {
            suggestion = "Context is at capacity, but no obvious low-score blocks were pruned.";
        }

        return {
            prunedContext: prunedContext,
            suggestion: suggestion,
        };
    }
}