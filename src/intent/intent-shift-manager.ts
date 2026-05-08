import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type IntentShiftReport = {
    isShiftDetected: boolean;
    shiftScore: number;
    newActiveIntent: string | null;
    contextResetRequired: boolean;
    reportMessage: string;
};

export class IntentShiftManager {
    private readonly shiftThreshold: number;
    private readonly minTurnsForShift: number;

    constructor(shiftThreshold: number = 0.75, minTurnsForShift: number = 3) {
        this.shiftThreshold = shiftThreshold;
        this.minTurnsForShift = minTurnsForShift;
    }

    private calculateSemanticSimilarity(context: Message[], initialGoal: string): number {
        // Placeholder for complex embedding calculation (e.g., Cosine Similarity)
        // In a real system, this would involve calling an embedding model.
        // We simulate a score based on context length and content variance.
        const contextLength = context.length;
        const score = Math.min(1.0, 0.5 + (contextLength * 0.05));
        return score;
    }

    detectShift(currentContext: Message[], history: Message[]): { score: number, context: Message } {
        const initialGoal = history.length > 0 ? history[0].content : "Initial conversation goal.";
        const shiftScore = this.calculateSemanticSimilarity(currentContext, initialGoal);
        return { score: shiftScore, context: currentContext };
    }

    validateShift(shiftScore: number, history: Message[]): { isValid: boolean, reason: string } {
        if (shiftScore < this.shiftThreshold) {
            return { isValid: false, reason: "Score below threshold." };
        }
        if (history.length < this.minTurnsForShift) {
            return { isValid: false, reason: `Insufficient history turns (${history.length}/${this.minTurnsForShift}).` };
        }
        return { isValid: true, reason: "Significant shift detected and validated." };
    }

    executeShift(newIntent: string, currentContext: Message[]): IntentShiftReport {
        const report: IntentShiftReport = {
            isShiftDetected: true,
            shiftScore: 1.0, // Assuming validation passed
            newActiveIntent: newIntent,
            contextResetRequired: true,
            reportMessage: `Intent successfully shifted to: ${newIntent}. Context reset initiated.`
        };

        // Logic for context reset and re-planning trigger
        console.log(`[IntentShiftManager] Resetting context and initiating re-planning for intent: ${newIntent}`);

        return report;
    }

    manageIntentShift(currentContext: Message[], history: Message[]): IntentShiftReport {
        const { score: shiftScore, context: contextChunk } = this.detectShift(currentContext, history);

        const validation = this.validateShift(shiftScore, history);

        if (!validation.isValid) {
            return {
                isShiftDetected: false,
                shiftScore: shiftScore,
                newActiveIntent: null,
                contextResetRequired: false,
                reportMessage: `No significant intent shift detected. ${validation.reason}`
            };
        }

        // Simulate determining the new intent based on the context chunk
        const newIntent = "New Goal Identified"; 

        return this.executeShift(newIntent, contextChunk);
    }
}