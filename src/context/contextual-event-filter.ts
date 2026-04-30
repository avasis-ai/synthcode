import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AgentContext {
  history: Message[];
  current_tool_state: Record<string, unknown>;
}

export interface EventFilterRule {
  /**
   * Determines if the given event should pass through based on the current context.
   * @param event The incoming event to check.
   * @param context The current state of the agent context.
   * @returns True if the event should pass, false otherwise.
   */
  shouldPass(event: any, context: AgentContext): boolean;
}

export class ContextualEventFilter {
  private rules: EventFilterRule[];

  constructor() {
    this.rules = [];
  }

  addRule(rule: EventFilterRule): void {
    this.rules.push(rule);
  }

  /**
   * Processes an incoming event through all registered rules.
   * @param event The event to filter.
   * @param context The current agent context.
   * @returns True if the event passes all filters, false otherwise.
   */
  shouldProcess(event: any, context: AgentContext): boolean {
    for (const rule of this.rules) {
      if (!rule.shouldPass(event, context)) {
        return false;
      }
    }
    return true;
  }
}