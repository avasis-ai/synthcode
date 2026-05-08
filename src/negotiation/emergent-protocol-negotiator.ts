import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: ContentBlock[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

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

export type InteractionHistory = Message[];

export interface AgentContext {
    name: string;
    capabilities: string[];
    schema: Record<string, any>;
}

export interface Protocol {
    source: string;
    target: string;
    expectedFormat: string;
    requiredFields: string[];
    sequence: number;
}

export interface NegotiationStrategy {
    analyze(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): { conflict: boolean; suggestedProtocol?: Protocol };
    propose(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): Protocol;
}

class DefaultNegotiationStrategy implements NegotiationStrategy {
    analyze(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): { conflict: boolean; suggestedProtocol?: Protocol } {
        if (history.length < 2) {
            return { conflict: false };
        }

        const lastMessage = history[history.length - 1];
        const firstMessage = history[0];

        const hasSchemaMismatch = (
            (lastMessage.role === 'tool' && !contextA.schema['tool_result']) ||
            (firstMessage.role === 'user' && !contextB.schema['user_input'])
        );

        if (hasSchemaMismatch) {
            return { conflict: true };
        }

        return { conflict: false };
    }

    propose(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): Protocol {
        const source = contextA.name;
        const target = contextB.name;

        const protocol: Protocol = {
            source: source,
            target: target,
            expectedFormat: "JSON Schema v1.0",
            requiredFields: ["id", "content", "timestamp"],
            sequence: history.length + 1,
        };
        return protocol;
    }
}

export class EmergentProtocolNegotiator {
    private strategy: NegotiationStrategy;

    constructor(strategy: NegotiationStrategy = new DefaultNegotiationStrategy()) {
        this.strategy = strategy;
    }

    analyzeConflict(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): boolean {
        const analysis = this.strategy.analyze(contextA, contextB, history);
        return analysis.conflict;
    }

    negotiateProtocol(contextA: AgentContext, contextB: AgentContext, history: InteractionHistory): Protocol {
        return this.strategy.propose(contextA, contextB, history);
    }

    enforceProtocol(protocol: Protocol, message: Message): Message {
        if (protocol.requiredFields.includes("content") && typeof message.content !== 'string') {
            return { role: "assistant", content: [{ type: "text", text: `[PROTOCOL ERROR] Missing required field: content` }] };
        }
        return message;
    }
}

export { EmergentProtocolNegotiator, NegotiationStrategy };