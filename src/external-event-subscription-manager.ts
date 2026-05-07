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

export type ExternalEventPayload = Record<string, unknown>;

export type SubscriptionHandler = (payload: ExternalEventPayload) => Promise<void> | void;

export class ExternalEventSubscriptionManager {
  private subscriptions: Map<string, Set<SubscriptionHandler>>;

  constructor() {
    this.subscriptions = new Map<string, Set<SubscriptionHandler>>();
  }

  subscribe(eventName: string, handler: SubscriptionHandler): void {
    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, new Set<SubscriptionHandler>());
    }
    const handlers = this.subscriptions.get(eventName)!;
    handlers.add(handler);
  }

  async publish(eventName: string, payload: ExternalEventPayload): Promise<void> {
    const handlers = this.subscriptions.get(eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`Error executing handler for event ${eventName}:`, error);
      }
    }

    await Promise.all(promises);
  }

  async handleIncomingEvent(payload: ExternalEventPayload): Promise<void> {
    console.log("Handling incoming external event...");
    await this.publish("external_event", payload);
  }
}

export { ExternalEventSubscriptionManager };