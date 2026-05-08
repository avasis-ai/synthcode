import {
  Message,
  ContentBlock,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type HookContext = {
  stage: "pre_tool_call" | "post_tool_call" | "state_update" | "context_merge";
  data: Record<string, unknown>;
  executionId: string;
};

type HookPayload = Record<string, unknown>;

type HookFunction = (context: HookContext) => HookPayload | null;

export class ContextualDebugHookManager {
  private hooks: Map<string, HookFunction[]> = new Map();

  registerHook(contextKey: string, hook: HookFunction): void {
    if (!this.hooks.has(contextKey)) {
      this.hooks.set(contextKey, []);
    }
    const existingHooks = this.hooks.get(contextKey)!;
    existingHooks.push(hook);
  }

  getHooks(contextKey: string): HookFunction[] {
    return this.hooks.get(contextKey) || [];
  }

  executeHooks(contextKey: string, context: HookContext): HookPayload[] {
    const hooks = this.getHooks(contextKey);
    const results: HookPayload[] = [];

    for (const hook of hooks) {
      const payload = hook(context);
      if (payload) {
        results.push(payload);
      }
    }
    return results;
  }

  clearHooks(contextKey: string): void {
    this.hooks.delete(contextKey);
  }
}

export const createHookManager = (): ContextualDebugHookManager => {
  return new ContextualDebugHookManager();
};