import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Context = {
  user_intent: string;
  source: string;
  session_id: string;
};

export interface Rule<T extends Message> {
  /** Determines if the event should be processed based on the current context. */
  shouldProcess(event: T, context: Context): boolean;
  /** Enriches the event with context-derived data if it passes filtering. */
  enrich(event: T, context: Context): T;
}

export class ContextualEventStreamProcessorV1 {
  private rules: { [key: string]: Rule<Message> };

  constructor(rules: { [key: string]: Rule<Message>} = {}) {
    this.rules = rules;
  }

  public addRule(key: string, rule: Rule<Message>): void {
    this.rules[key] = rule;
  }

  private getRule(eventType: string): Rule<Message> | undefined {
    return this.rules[eventType];
  }

  public processStream(
    stream: Message[],
    context: Context
  ): Message[] {
    const processedEvents: Message[] = [];

    for (const event of stream) {
      const eventType = typeof event === 'object' && 'role' in event ? (event as any).role : null;
      if (!eventType) {
        continue;
      }

      const rule = this.getRule(eventType);

      if (!rule) {
        // If no specific rule exists, pass through by default (or could filter entirely)
        processedEvents.push(event);
        continue;
      }

      if (rule.shouldProcess(event, context)) {
        const enrichedEvent = rule.enrich(event, context);
        processedEvents.push(enrichedEvent);
      }
    }

    return processedEvents;
  }
}