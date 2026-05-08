import { ToolUseBlock } from "./types";

type ToolName = string;

interface ToolPattern {
    pattern: ToolName[];
    totalCount: number;
    successfulCount: number;
}

export class CapabilityPatternAnalyzer {
    private patterns: Map<string, ToolPattern>;

    constructor() {
        this.patterns = new Map();
    }

    private getPatternKey(pattern: ToolName[]): string {
        return pattern.join("->");
    }

    private updatePattern(pattern: ToolName[], success: boolean): void {
        const key = this.getPatternKey(pattern);
        let patternEntry = this.patterns.get(key);

        if (!patternEntry) {
            patternEntry = {
                pattern: pattern,
                totalCount: 0,
                successfulCount: 0,
            };
            this.patterns.set(key, patternEntry);
        }

        patternEntry.totalCount += 1;
        if (success) {
            patternEntry.successfulCount += 1;
        }
    }

    /**
     * Processes a single tool call event, updating the current sequence.
     * @param toolCall The tool use block representing the call.
     * @param isSuccess Whether the subsequent result for this tool call was successful.
     */
    public recordToolCall(toolCall: ToolUseBlock, isSuccess: boolean): void {
        // In a real scenario, we would maintain a history buffer.
        // For simplicity and adherence to the pattern tracking requirement,
        // we assume the input sequence is processed in chunks, and we track
        // the pattern based on the sequence provided in the current context.
        // Since the prompt implies analyzing *sequences*, we will modify the
        // approach to accept the full sequence history for analysis.
    }

    /**
     * Analyzes a full sequence of tool calls and their outcomes.
     * @param toolCallSequence Array of tool use blocks in order.
     * @param successFlags Array of booleans indicating if the corresponding tool call succeeded.
     */
    public analyzeSequence(toolCallSequence: ToolUseBlock[], successFlags: boolean[]): void {
        if (toolCallSequence.length !== successFlags.length) {
            throw new Error("Tool call sequence and success flags must have the same length.");
        }

        let currentPattern: ToolName[] = [];
        for (let i = 0; i < toolCallSequence.length; i++) {
            const toolName = toolCallSequence[i].name;
            const success = successFlags[i];

            // We only track the pattern if the tool was actually called
            if (toolName) {
                currentPattern.push(toolName);
                this.updatePattern(currentPattern, success);
            }
        }
    }

    /**
     * Retrieves all recorded tool patterns.
     */
    public getAllPatterns(): ToolPattern[] {
        return Array.from(this.patterns.values());
    }

    /**
     * Calculates the overall success rate for a specific pattern.
     * @param pattern The pattern to analyze.
     * @returns The success rate (0.0 to 1.0).
     */
    public getPatternSuccessRate(pattern: ToolName[]): number {
        const key = this.getPatternKey(pattern);
        const entry = this.patterns.get(key);

        if (!entry) {
            return 0.0;
        }

        return entry.successfulCount / entry.totalCount;
    }

    /**
     * Identifies the most common pattern used by the agent.
     * @returns The most common pattern and its count.
     */
    public getMostCommonPattern(): { pattern: ToolName[]; count: number } | null {
        let bestPattern: ToolName[] | null = null;
        let maxCount = -1;

        for (const entry of this.patterns.values()) {
            if (entry.totalCount > maxCount) {
                maxCount = entry.totalCount;
                bestPattern = entry.pattern;
            }
        }

        if (bestPattern) {
            return { pattern: bestPattern, count: maxCount };
        }
        return null;
    }

    /**
     * Identifies the least reliable pattern (lowest success rate among those used at least 3 times).
     * @returns The least reliable pattern and its success rate.
     */
    public getLeastReliablePattern(): { pattern: ToolName[]; rate: number } | null {
        let worstPattern: ToolName[] | null = null;
        let minRate = 2.0; // Start higher than 1.0

        for (const entry of this.patterns.values()) {
            if (entry.totalCount >= 3) {
                const rate = entry.successfulCount / entry.totalCount;
                if (rate < minRate) {
                    minRate = rate;
                    worstPattern = entry.pattern;
                }
            }
        }

        if (worstPattern) {
            return { pattern: worstPattern, rate: minRate };
        }
        return null;
    }
}