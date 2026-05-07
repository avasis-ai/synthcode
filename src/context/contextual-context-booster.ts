export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: ContentBlock[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
    type: "text";
    text: string;
}

export interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

export interface Context {
    history: Message[];
    current_input: string;
}

export type BoosterFunction = (score: number, context: Context) => number;

export interface BoosterRule {
    /**
     * Determines if the rule should apply based on the context.
     * @param context The current operational context.
     * @returns True if the rule should be applied, false otherwise.
     */
    trigger(context: Context): boolean;
    /**
     * Applies the boosting/dampening logic to the raw score.
     * @param score The raw score calculated by the scoring mechanism.
     * @param context The current operational context.
     * @returns The adjusted score.
     */
    boost(score: number, context: Context): number;
}

export class ContextualContextBooster {
    private rules: BoosterRule[];

    constructor() {
        this.rules = [];
    }

    addRule(rule: BoosterRule): void {
        this.rules.push(rule);
    }

    /**
     * Applies all registered rules to boost or dampen a raw score based on the context.
     * The final score is the sum of the raw score and all applied adjustments.
     * @param rawScore The initial score calculated by the scoring mechanism.
     * @param context The operational context (history, current input).
     * @returns The adjusted, boosted score.
     */
    boostScore(rawScore: number, context: Context): number {
        let totalBoost = 0;

        for (const rule of this.rules) {
            if (rule.trigger(context)) {
                const adjustedScore = rule.boost(rawScore, context);
                // We accumulate the boost/dampening effect relative to the raw score
                // For simplicity, we treat the boost function output as the final adjusted score
                // and take the maximum/average, but following the prompt's intent of
                // aggregating results, we will average the adjustments.
                totalBoost += adjustedScore;
            }
        }

        // Simple aggregation: return the average of the raw score and all boosted scores.
        // If no rules apply, it returns the raw score.
        if (this.rules.length === 0) {
            return rawScore;
        }

        // A more robust aggregation might be needed, but for a simple booster,
        // we'll return the raw score plus the average adjustment factor.
        const averageAdjustment = totalBoost / Math.max(1, this.rules.length);
        return rawScore + averageAdjustment;
    }
}