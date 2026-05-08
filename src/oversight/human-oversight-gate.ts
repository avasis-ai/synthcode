import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type OversightStatus = "Pending" | "Approved" | "Vetoed";

export interface GateContext {
    currentMessage: Message;
    history: Message[];
    state: Record<string, any>;
    riskScore: number;
}

export interface GateRule {
    checkCriteria(context: GateContext): boolean;
    getReviewPayload(context: GateContext): Record<string, unknown>;
}

export interface HumanDecision {
    decision: OversightStatus;
    feedback?: string;
}

export interface GateResult {
    requiresOversight: boolean;
    payload: Record<string, unknown> | null;
    action: 'PAUSE' | 'PROCEED';
}

export class OversightGate {
    private rule: GateRule;

    constructor(rule: GateRule) {
        this.rule = rule;
    }

    public async check(context: GateContext): Promise<GateResult> {
        if (!this.rule.checkCriteria(context)) {
            return {
                requiresOversight: false,
                payload: null,
                action: 'PROCEED',
            };
        }

        const payload = this.rule.getReviewPayload(context);

        return {
            requiresOversight: true,
            payload: payload,
            action: 'PAUSE',
        };
    }

    /**
     * Simulates the asynchronous waiting for human input.
     * In a real system, this would involve an event listener or external API call.
     * @param initialContext The context when the gate was triggered.
     * @param payload The data sent to the human review interface.
     * @returns A promise that resolves with the human's decision.
     */
    public async awaitHumanDecision(initialContext: GateContext, payload: Record<string, unknown>): Promise<HumanDecision> {
        console.log("--- HUMAN OVERSIGHT REQUIRED ---");
        console.log("Review Payload:", payload);
        
        // Simulate waiting for external input (e.g., API call, Webhook)
        // For demonstration, we assume the calling pipeline handles the wait.
        
        // In a real implementation, this method would suspend execution until
        // an external event (HumanDecision) is received.
        
        return new Promise((resolve) => {
            // Mocking a successful approval after a delay
            setTimeout(() => {
                const decision: HumanDecision = {
                    decision: "Approved",
                    feedback: "Human review passed successfully.",
                };
                console.log("--- HUMAN DECISION RECEIVED ---");
                resolve(decision);
            }, 50);
        });
    }
}

export { OversightGate };