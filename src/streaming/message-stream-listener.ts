import { EventEmitter } from "events";

export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
    [key: string]: any;
};

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

export type LoopEvent =
    | { type: "text"; text: string }
    | { type: "thinking"; thinking: string }
    | { type: "tool_result"; tool_use_id: string; content: string };

export interface AgentEvent {
    type: "external_message";
    payload: Message;
    source: string;
}

export interface StreamSource {
    sourceId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    onMessage(callback: (payload: any) => void): void;
}

class MessageStreamListener {
    private eventBus: EventEmitter;
    private sources: Map<string, StreamSource> = new Map();

    constructor(eventBus: EventEmitter) {
        this.eventBus = eventBus;
    }

    registerSource(source: StreamSource): void {
        if (this.sources.has(source.sourceId)) {
            throw new Error(`Source ID ${source.sourceId} already registered.`);
        }
        this.sources.set(source.sourceId, source);
        source.onMessage(this.handleIncomingMessage.bind(this));
    }

    private handleIncomingMessage(rawPayload: any): void {
        const sourceId = this.sources.size > 0 ? Array.from(this.sources.values())[0].sourceId : "unknown";
        
        const event = this.mapPayloadToAgentEvent(rawPayload, sourceId);
        
        if (event) {
            this.eventBus.emit("external_event", event);
        }
    }

    private mapPayloadToAgentEvent(rawPayload: any, sourceId: string): AgentEvent | null {
        let message: Message;

        if (typeof rawPayload === 'object' && rawPayload !== null && 'role' in rawPayload) {
            message = rawPayload as Message;
        } else {
            console.warn("Received unmappable payload:", rawPayload);
            return null;
        }

        return {
            type: "external_message",
            payload: message,
            source: sourceId,
        };
    }

    async connectAll(): Promise<Promise<void>[]> {
        const connectionPromises: Promise<void>[] = [];
        for (const source of this.sources.values()) {
            connectionPromises.push(source.connect().catch(err => {
                console.error(`Failed to connect to source ${source.sourceId}:`, err);
                return Promise.resolve();
            }));
        }
        return Promise.all(connectionPromises);
    }

    async disconnectAll(): Promise<void> {
        const disconnectionPromises: Promise<void>[] = [];
        for (const source of this.sources.values()) {
            disconnectionPromises.push(source.disconnect().catch(err => {
                console.error(`Failed to disconnect from source ${source.sourceId}:`, err);
                return Promise.resolve();
            }));
        }
        await Promise.all(disconnectionPromises);
    }
}

export { MessageStreamListener };