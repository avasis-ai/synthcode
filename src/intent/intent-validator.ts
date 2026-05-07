import {
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

export interface IntentValidationContext {
    initialIntent: string;
    currentState: Message[];
    proposedAction: {
        thought: string;
        toolCalls?: {
            name: string;
            input: Record<string, unknown>;
        }[];
    };
}

export interface CorrectionPayload {
    isDriftDetected: boolean;
    driftScore: number;
    suggestedCorrection: string;
    reFocusContext: string;
}

export class IntentValidator {
    constructor() {}

    /**
     * Calculates a quantitative score representing the deviation from the initial intent.
     * Lower score means closer alignment.
     * @param currentState The history of messages/events.
     * @param initialIntent The user's original stated goal.
     * @returns A drift score (0.0 to 1.0).
     */
    calculateDriftScore(currentState: Message[], initialIntent: string): number {
        let totalDeviation = 0;
        const historyLength = currentState.length;

        if (historyLength === 0) {
            return 0.0;
        }

        // Simple heuristic: Check if the last few steps deviate significantly from keywords in the intent.
        const intentKeywords = initialIntent.toLowerCase().split(/\s+/).filter(k => k.length > 2);
        let deviationCount = 0;

        for (let i = Math.max(0, historyLength - 3); i < historyLength; i++) {
            const message = currentState[i];
            let messageContent = "";

            if (message.role === "user") {
                messageContent = message.content;
            } else if (message.role === "assistant") {
                messageContent = message.content.map(block => {
                    if (block.type === "text") return block.text;
                    return "";
                }).join(" ");
            } else if (message.role === "tool") {
                messageContent = `Tool result for ${message.tool_use_id}: ${message.content}`;
            }

            const messageLower = messageContent.toLowerCase();
            let matchedKeywords = 0;

            for (const keyword of intentKeywords) {
                if (messageLower.includes(keyword)) {
                    matchedKeywords++;
                }
            }

            if (matchedKeywords === 0 && messageContent.length > 10) {
                deviationCount++;
            }
        }

        // Normalize deviation score (0.0 = perfect alignment, 1.0 = total drift)
        const maxPossibleDeviation = Math.min(3, historyLength);
        const drift = Math.min(1.0, deviationCount / maxPossibleDeviation);

        return drift;
    }

    /**
     * Validates the proposed action against the initial intent and current state.
     * @param context The validation context containing intent, state, and proposed action.
     * @returns A CorrectionPayload detailing any detected drift.
     */
    validate(context: IntentValidationContext): CorrectionPayload {
        const driftScore = this.calculateDriftScore(context.currentState, context.initialIntent);

        const driftThreshold = 0.4;
        const isDriftDetected = driftScore > driftThreshold;

        let suggestedCorrection = "";
        let reFocusContext = "";

        if (isDriftDetected) {
            suggestedCorrection = `The proposed action seems to deviate from the core intent: "${context.initialIntent}". Please re-evaluate the goal.`;
            reFocusContext = `Focus on the original goal: ${context.initialIntent}. The current state suggests a shift in topic.`;
        } else {
            suggestedCorrection = "Action appears semantically aligned with the original intent.";
            reFocusContext = "Context remains focused on the initial goal.";
        }

        return {
            isDriftDetected: isDriftDetected,
            driftScore: driftScore,
            suggestedCorrection: suggestedCorrection,
            reFocusContext: reFocusContext,
        };
    }
}

export { IntentValidator };