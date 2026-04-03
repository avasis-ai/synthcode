import type { Message, CompactionResult } from "./types.js";

export interface AgentHooks {
  onTurnStart?: (turn: number, messages: Message[]) => Promise<Message[] | void>;
  onTurnEnd?: (turn: number, messages: Message[]) => Promise<void>;
  onToolUse?: (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<{ allow?: boolean; input?: Record<string, unknown> } | void>;
  onToolResult?: (result: {
    id: string;
    name: string;
    output: string;
    isError: boolean;
    durationMs: number;
  }) => Promise<string | void>;
  onError?: (error: Error, turn: number) => Promise<{ retry?: boolean; message?: string } | void>;
  onCompact?: (result: CompactionResult) => Promise<void>;
}

export class HookRunner {
  private hooks: AgentHooks;

  constructor(hooks?: AgentHooks) {
    this.hooks = hooks ?? {};
  }

  async runOnTurnStart(turn: number, messages: Message[]): Promise<Message[]> {
    if (!this.hooks.onTurnStart) return messages;
    const result = await this.hooks.onTurnStart(turn, messages);
    return Array.isArray(result) ? result : messages;
  }

  async runOnTurnEnd(turn: number, messages: Message[]): Promise<void> {
    await this.hooks.onTurnEnd?.(turn, messages);
  }

  async runOnToolUse(
    name: string,
    input: Record<string, unknown>,
  ): Promise<{ allow: boolean; input: Record<string, unknown> }> {
    if (!this.hooks.onToolUse) return { allow: true, input };
    const result = await this.hooks.onToolUse(name, input);
    return {
      allow: result?.allow ?? true,
      input: result?.input ?? input,
    };
  }

  async runOnToolResult(result: {
    id: string;
    name: string;
    output: string;
    isError: boolean;
    durationMs: number;
  }): Promise<string> {
    if (!this.hooks.onToolResult) return result.output;
    const modified = await this.hooks.onToolResult(result);
    return modified ?? result.output;
  }

  async runOnError(error: Error, turn: number): Promise<{ retry: boolean; message?: string }> {
    if (!this.hooks.onError) return { retry: false };
    const result = await this.hooks.onError(error, turn);
    return { retry: result?.retry ?? false, message: result?.message };
  }

  async runOnCompact(result: CompactionResult): Promise<void> {
    await this.hooks.onCompact?.(result);
  }
}
