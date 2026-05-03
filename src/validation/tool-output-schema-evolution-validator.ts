import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface SchemaRule {
    field: string;
    expectedType: string;
    allowedDrift: {
        from: string;
        to: string;
        confidence: number;
    }[];
}

interface HistoryEntry {
    schema: Record<string, unknown>;
    output: Record<string, unknown>;
}

export class ToolOutputSchemaEvolutionValidator {
    private history: HistoryEntry[] = [];
    private rules: Map<string, SchemaRule> = new Map();

    constructor() {}

    public registerSchemaRule(rule: SchemaRule): void {
        this.rules.set(rule.field, rule);
    }

    public recordHistory(schema: Record<string, unknown>, output: Record<string, unknown>): void {
        this.history.push({ schema, output });
    }

    private calculateDriftScore(current: Record<string, unknown>, expected: Record<string, unknown>): number {
        let score = 0;
        const allKeys = new Set([...Object.keys(current), ...Object.keys(expected)]);

        for (const key of allKeys) {
            const currentVal = current[key];
            const expectedVal = expected[key];

            if (currentVal === undefined || expectedVal === undefined) {
                continue;
            }

            const rule = this.rules.get(key);
            if (rule) {
                const currentType = typeof currentVal;
                const expectedType = typeof expectedVal;

                let driftDetected = false;
                for (const drift of rule.allowedDrift) {
                    if (drift.from === currentType && drift.to === expectedType) {
                        score += 1.0 * drift.confidence;
                        driftDetected = true;
                        break;
                    }
                }

                if (!driftDetected && currentType !== expectedType) {
                    score -= 0.5; // Penalty for unmanaged type change
                }
            } else {
                // Simple structural check for unknown fields
                if (typeof currentVal !== typeof expectedVal) {
                    score -= 0.1;
                }
            }
        }
        return Math.max(-10, score);
    }

    public validate(currentOutput: Record<string, unknown>): { isValid: boolean; driftScore: number; issues: string[] } {
        if (this.history.length === 0) {
            return { isValid: true, driftScore: 0, issues: ["No history available for comparison."] };
        }

        const lastHistory = this.history[this.history.length - 1];
        const driftScore = this.calculateDriftScore(currentOutput, lastHistory.schema);

        const issues: string[] = [];
        if (Math.abs(driftScore) > 1.5) {
            issues.push(`High structural drift detected. Score: ${driftScore.toFixed(2)}`);
        }

        const isValid = issues.length === 0;

        return {
            isValid: isValid,
            driftScore: driftScore,
            issues: issues
        };
    }
}