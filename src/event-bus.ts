import { EventEmitter } from 'events';

type Handler<T> = (event: T) => Promise<void>;

export class EventBus {
  private listeners: Map<string, <any, Handler<any>>[]> = new Map();

  private constructor() {}

  private static instance: EventBus = new EventBus();

  public static getInstance(): EventBus {
    return this.instance;
  }

  public subscribe<T>(eventType: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const handlers = this.listeners.get(eventType)!;
    handlers.push(handler as any);

    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  public async publish<T>(eventType: string, event: T): Promise<void> {
    const handlers = this.listeners.get(eventType);
    if (!handlers || handlers.length === 0) {
      return;
    }

    const promises: Promise<void>[] = handlers.map(handler => {
      const typedHandler = handler as Handler<T>;
      return typedHandler(event).catch(err => {
        console.error(`Error handling event ${eventType}:`, err);
        return Promise.resolve();
      });
    });

    await Promise.all(promises);
  }
}

export const eventBus = EventBus.getInstance();