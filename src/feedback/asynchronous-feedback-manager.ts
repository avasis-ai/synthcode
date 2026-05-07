export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = any;

export interface Feedback {
    source: FeedbackSource;
    timestamp: number;
    raw_data: Record<string, unknown>;
}

export enum Severity {
    CRITICAL = 3,
    HIGH = 2,
    MEDIUM = 1,
    LOW = 0,
}

export interface ContextualConstraint {
    type: "constraint";
    severity: Severity;
    description: string;
    action_required: string;
}

export interface ContextualObservation {
    type: "observation";
    severity: Severity;
    data: Record<string, unknown>;
    summary: string;
}

export interface FeedbackSource {
    source_type: "alert" | "user_comment" | "monitoring" | "external_system";
    metadata: Record<string, unknown>;
    raw_content: string;
    severity: Severity;
}

export class AsynchronousFeedbackManager {
    constructor() {}

    private isRelevant(feedback: Feedback): boolean {
        const severity = feedback.source.severity;
        if (severity < Severity.MEDIUM) {
            return false;
        }
        return true;
    }

    private filterAndPrioritize(feedback: Feedback): {
        constraint: ContextualConstraint | null;
        observation: ContextualObservation | null;
    } {
        if (!this.isRelevant(feedback)) {
            return { constraint: null, observation: null };
        }

        const { source_type, raw_content, severity } = feedback.source;

        if (source_type === "alert" && severity >= Severity.CRITICAL) {
            return {
                constraint: {
                    type: "constraint",
                    severity: severity,
                    description: `Critical system alert received: ${raw_content}`,
                    action_required: "Immediate halt and investigation required.",
                },
                observation: null,
            };
        }

        if (source_type === "user_comment") {
            const observation = {
                type: "observation",
                severity: severity,
                data: { comment: raw_content },
                summary: `User provided feedback on functionality.`,
            };
            return { constraint: null, observation: observation };
        }

        if (source_type === "monitoring") {
            return {
                constraint: null,
                observation: {
                    type: "observation",
                    severity: Severity.HIGH,
                    data: { metric: "latency", value: raw_content },
                    summary: "System performance degradation detected.",
                },
            };
        }

        return { constraint: null, observation: null };
    }

    processFeedback(feedback: Feedback): {
        contextual_updates: Array<ContextualConstraint | ContextualObservation>;
    } {
        const { constraint, observation } = this.filterAndPrioritize(feedback);
        const contextual_updates: Array<ContextualConstraint | ContextualObservation> = [];

        if (constraint) {
            contextual_updates.push(constraint);
        }
        if (observation) {
            contextual_updates.push(observation);
        }

        return { contextual_updates };
    }
}

export { AsynchronousFeedbackManager };