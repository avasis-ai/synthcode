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

type ToolInteractionRecord = {
    tool_name: string;
    input: Record<string, unknown>;
    success: boolean;
    duration_ms: number;
};

type State = {
    message_type: "user" | "assistant" | "tool";
    content: string;
    tool_name?: string;
};

interface PatternGraph {
    transitions: Map<string, Map<string, { count: number; total_success: number; total_attempts: number }>>;
}

export class BehavioralPatternDetector {
    private graph: PatternGraph;

    constructor() {
        this.graph = {
            transitions: new Map(),
        };
    }

    private extractState(message: Message): State {
        if (typeof message === "object" && "role" in message) {
            const role = message.role as "user" | "assistant" | "tool";
            if (role === "user") {
                return { message_type: "user", content: (message as UserMessage).content };
            }
            if (role === "assistant") {
                const content = (message as AssistantMessage).content.map(block => {
                    if (block.type === "text") return block.text;
                    return "";
                }).join(" ");
                return { message_type: "assistant", content: content };
            }
            if (role === "tool") {
                const toolMessage = message as ToolResultMessage;
                return {
                    message_type: "tool",
                    content: toolMessage.content,
                    tool_name: (toolMessage as any).tool_use_id,
                };
            }
        }
        throw new Error("Invalid message type provided.");
    }

    private buildGraph(history: Message[]): void {
        this.graph.transitions.clear();

        let currentState: State | null = null;

        for (const message of history) {
            const newState = this.extractState(message);

            if (currentState) {
                const startKey = `${currentState.message_type}:${currentState.tool_name || "N/A"}`;
                const endKey = `${newState.message_type}:${newState.tool_name || "N/A"}`;

                if (!this.graph.transitions.has(startKey)) {
                    this.graph.transitions.set(startKey, new Map());
                }

                const transitionsMap = this.graph.transitions.get(startKey)!;
                const transitionData = transitionsMap.get(endKey) || { count: 0, total_success: 0, total_attempts: 0 };

                transitionData.count += 1;
                transitionData.total_attempts += 1;

                // Simplified success tracking: Assume tool result success is based on content/error flag
                let isSuccess = false;
                if (newState.message_type === "tool") {
                    const toolMessage = message as ToolResultMessage;
                    isSuccess = !toolMessage.is_error;
                } else {
                    isSuccess = true; // Assume non-tool steps are successful for simplicity
                }

                if (isSuccess) {
                    transitionData.total_success += 1;
                }

                transitionsMap.set(endKey, transitionData);
            }
            currentState = newState;
        }
    }

    private calculateScore(startStateKey: string, endStateKey: string): { probability: number; success_rate: number } {
        const transitionsMap = this.graph.transitions.get(startStateKey);
        if (!transitionsMap || !transitionsMap.has(endStateKey)) {
            return { probability: 0, success_rate: 0 };
        }

        const data = transitionsMap.get(endStateKey)!;
        const probability = data.count > 0 ? (data.count / 100) : 0; // Normalized count
        const success_rate = data.total_attempts > 0 ? (data.total_success / data.total_attempts) : 0;

        return { probability, success_rate };
    }

    /**
     * Analyzes historical traces to detect behavioral patterns and calculate risk scores.
     * @param history The sequence of historical messages/interactions.
     * @param nextToolName The tool name being considered for the next step.
     * @returns A score object indicating risk and predicted probability.
     */
    detectBehavioralRisk(history: Message[], nextToolName: string): { risk_score: number; probability: number; message: string } {
        this.buildGraph(history);

        // Determine the last state in the history
        const lastMessage = history[history.length - 1];
        const lastState = this.extractState(lastMessage);

        // Define the key for the potential transition
        const startKey = `${lastState.message_type}:${lastState.tool_name || "N/A"}`;
        const endKey = `tool:${nextToolName}`;

        const { probability, success_rate } = this.calculateScore(startKey, endKey);

        // Risk Score calculation: Low probability * (1 - success rate)
        // High risk = Low probability AND Low success rate
        const risk_score = (1 - probability) * (1 - success_rate);

        const message = `Detected transition (${startKey} -> ${endKey}). Probability: ${Math.round(probability * 100)}%, Success Rate: ${(success_rate * 100).toFixed(0)}%. Risk Score: ${risk_score.toFixed(4)}`;

        return {
            risk_score: risk_score,
            probability: probability,
            message: message
        };
    }
}