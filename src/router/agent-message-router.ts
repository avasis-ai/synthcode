export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

type HandlerId = string;
type HandlerFunction = (message: Message) => Promise<Message | null>;

export class AgentMessageRouter {
  private handlers: Map<HandlerId, HandlerFunction> = new Map();
  private rules: { condition: (message: Message) => boolean; handlerId: HandlerId }[] = [];
  private loadCounts: Map<HandlerId, number> = new Map();

  registerHandler(handlerId: HandlerId, handler: HandlerFunction): void {
    this.handlers.set(handlerId, handler);
    this.loadCounts.set(handlerId, 0);
  }

  registerRule(condition: (message: Message) => boolean, handlerId: HandlerId): void {
    this.rules.push({ condition, handlerId });
  }

  private getAvailableHandlers(): HandlerId[] {
    return Array.from(this.handlers.keys());
  }

  private selectTargetHandler(message: Message): HandlerId | null {
    const matchingRules = this.rules.filter(rule => rule.condition(message));

    if (matchingRules.length === 0) {
      return null;
    }

    // Strategy 1: Prioritize the first matching rule (explicit priority)
    const primaryHandlerId = matchingRules[0].handlerId;

    // Strategy 2: Load Balancing Fallback (if primary fails or is unavailable)
    const availableHandlers = this.getAvailableHandlers();
    if (availableHandlers.length === 0) {
      return null;
    }

    // Simple round-robin load balancing across all registered handlers
    const sortedHandlers = availableHandlers.sort((a, b) => {
      const countA = this.loadCounts.get(a) || 0;
      const countB = this.loadCounts.get(b) || 0;
      return countA - countB;
    });

    return sortedHandlers[0];
  }

  private async executeHandler(handlerId: HandlerId, message: Message): Promise<Message | null> {
    const handler = this.handlers.get(handlerId);
    if (!handler) {
      return null;
    }

    try {
      const result = await handler(message);
      this.loadCounts.set(handlerId, (this.loadCounts.get(handlerId) || 0) + 1);
      return result;
    } catch (error) {
      console.error(`Handler ${handlerId} failed:`, error);
      // Failover mechanism: If primary fails, try the next available handler
      const fallbackHandlerId = this.getAvailableHandlers().find(id => id !== handlerId);
      if (fallbackHandlerId) {
        console.warn(`Attempting failover to ${fallbackHandlerId}`);
        return this.executeHandler(fallbackHandlerId, message);
      }
      return null;
    }
  }

  async routeMessage(message: Message): Promise<Message | null> {
    const targetHandlerId = this.selectTargetHandler(message);

    if (!targetHandlerId) {
      console.warn("No suitable handler found for the incoming message.");
      return null;
    }

    return this.executeHandler(targetHandlerId, message);
  }
}