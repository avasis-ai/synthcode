import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type EventHandler<T> = (event: T) => Promise<void>;

interface EventBus {
  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void;
  publish<T>(eventName: string, event: T): Promise<void>;
}

export class AgentEventBus implements EventBus {
  private handlers: Map<string, <any, any>[]>;

  constructor() {
    this.handlers = new Map();
  }

  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const eventHandlers = this.handlers.get(eventName)!;
    eventHandlers.push(handler);

    return () => {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    };
  }

  async publish<T>(eventName: string, event: T): Promise<void> {
    const eventHandlers = this.handlers.get(eventName);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    const promises: Promise<void>[] = eventHandlers.map(handler => {
      try {
        return handler(event).catch(error => {
          console.error(`Error handling event '${eventName}' in a subscriber:`, error);
          return Promise.resolve();
        });
      } catch (e) {
        console.error(`Synchronous error handling event '${eventName}' in a subscriber:`, e);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }
}