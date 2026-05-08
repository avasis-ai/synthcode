import { EventEmitter } from "node:events";

export type AgentContext = {
    history: Message[];
    state: Record<string, unknown>;
    // Add other context fields as needed
};

export type RequiredInputType = "human_review" | "system_confirmation" | "expert_signoff" | "manual_input";

export interface InteractiveDecisionRequest {
    id: string;
    contextSummary: string;
    requiredInputType: RequiredInputType;
    mandatoryFields: Record<string, "mandatory" | "optional">;
    prompt: string;
}

export interface DecisionResult {
    decisionId: string;
    inputData: Record<string, unknown>;
    submittedBy: "user" | "system" | "expert";
    timestamp: Date;
}

export interface DecisionRequiredEvent {
    type: "decision_required";
    requestId: string;
    context: AgentContext;
    request: InteractiveDecisionRequest;
}

export interface DecisionResultEvent {
    type: "decision_result";
    decisionId: string;
    result: DecisionResult;
}

export class InteractiveDecisionPointManager extends EventEmitter {
    private currentDecisionRequestId: string | null = null;

    requestDecision(context: AgentContext, request: InteractiveDecisionRequest): void {
        if (this.currentDecisionRequestId !== null) {
            throw new Error("Decision request already pending. Must resolve current decision first.");
        }

        this.currentDecisionRequestId = request.id;
        
        const event: DecisionRequiredEvent = {
            type: "decision_required",
            requestId: request.id,
            context: context,
            request: request,
        };

        this.emit("decision_required", event);
    }

    handleDecisionResult(event: DecisionResultEvent): AgentContext {
        if (this.currentDecisionRequestId === null) {
            throw new Error("No active decision point. Cannot process result.");
        }

        const result = event.result;
        const context = this.getCurrentContext();

        // 1. Update the agent's state with the decision result
        const newState: Record<string, unknown> = {
            ...context.state,
            decision_made: true,
            last_decision_result: result,
            decision_id: result.decisionId,
        };

        // 2. Update history (optional, but good practice)
        const decisionMessage: Message = {
            role: "tool",
            tool_use_id: result.decisionId,
            content: `Decision received: ${result.decisionId}. Submitted by ${result.submittedBy}.`,
        };

        const newContext: AgentContext = {
            history: [...context.history, decisionMessage],
            state: newState,
        };

        // 3. Clear the pending state
        this.currentDecisionRequestId = null;

        return newContext;
    }

    private getCurrentContext(): AgentContext {
        // In a real system, this would fetch the current context from the execution engine.
        // For simulation, we return a placeholder.
        return {
            history: [],
            state: {}
        };
    }
}

export { InteractiveDecisionPointManager };