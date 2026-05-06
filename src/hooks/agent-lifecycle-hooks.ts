export type Message = any;

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

export type LoopEvent = any;

export class HookRegistry {
  private hooks: Map<string, Set<(context: any) => Promise<void>>> = new Map();

  registerHook(eventName: string, hook: (context: any) => Promise<void>): void {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, new Set());
    }
    const eventHooks = this.hooks.get(eventName)!;
    eventHooks.add(hook);
  }

  async triggerHooks(eventName: string, context: any): Promise<void> {
    const eventHooks = this.hooks.get(eventName);
    if (!eventHooks || eventHooks.size === 0) {
      return;
    }

    const hookPromises = Array.from(eventHooks).map(hook => hook(context));
    await Promise.all(hookPromises);
  }
}

export const hookRegistry = new HookRegistry();

export { hookRegistry };