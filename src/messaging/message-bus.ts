import { EventEmitter } from "events";

export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
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

type Handler = (payload: any) => Promise<void>;
type Filter = (payload: any) => boolean;

interface Subscription {
    handler: Handler;
    filter: Filter;
}

export class MessageBus {
    private subscriptions: Map<string, Set<Subscription>>;

    constructor() {
        this.subscriptions = new Map();
    }

    public subscribe(
        topic: string,
        handler: Handler,
        filter?: Filter
    ): () => void {
        const defaultFilter: Filter = () => true;
        const finalFilter = filter ?? defaultFilter;

        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }

        const set = this.subscriptions.get(topic)!;
        const subscription: Subscription = { handler, filter: finalFilter };
        set.add(subscription);

        return () => {
            set.delete(subscription);
            if (set.size === 0) {
                this.subscriptions.delete(topic);
            }
        };
    }

    public async publish(topic: string, payload: any): Promise<void> {
        const subscriptions = this.subscriptions.get(topic);
        if (!subscriptions || subscriptions.size === 0) {
            return;
        }

        const tasks: Promise<void>[] = [];

        for (const subscription of subscriptions) {
            if (subscription.filter(payload)) {
                tasks.push(subscription.handler(payload));
            }
        }

        await Promise.allSettled(tasks);
    }
}

export { MessageBus };