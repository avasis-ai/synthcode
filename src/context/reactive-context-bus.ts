import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

type ContextUpdate = Partial<Record<string, unknown>>;

interface Subscription<T> {
  path: string;
  filter: (value: unknown) => boolean;
  handler: (newValue: unknown) => void;
}

export class ReactiveContextBus {
  private subscriptions: Subscription<any>[] = [];

  subscribe<T>(
    path: string,
    filter: (value: unknown) => boolean,
    handler: (newValue: unknown) => void
  ): () => void {
    const subscription: Subscription<T> = {
      path,
      filter,
      handler,
    };
    this.subscriptions.push(subscription);

    return () => {
      this.subscriptions = this.subscriptions.filter((sub) => sub !== subscription);
    };
  }

  private getDeepValue(obj: Record<string, unknown>, path: string): unknown | undefined {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (typeof current === 'object' && current !== null && (part as keyof typeof current) !== undefined) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  publish(contextUpdate: ContextUpdate): void {
    for (const subscription of this.subscriptions) {
      const { path, filter, handler } = subscription;

      const currentValue = this.getDeepValue(contextUpdate, path);

      if (currentValue === undefined) {
        continue;
      }

      if (filter(currentValue)) {
        handler(currentValue);
      }
    }
  }
}