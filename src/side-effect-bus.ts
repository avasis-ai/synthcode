import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SideEffect {
  payload: Record<string, unknown>;
  execute: (payload: Record<string, unknown>) => Promise<void>;
}

export class SideEffectBus {
  private effects: SideEffect[] = [];

  registerEffect(effect: SideEffect): void {
    this.effects.push(effect);
  }

  /**
   * Executes all registered side effects concurrently and returns a Promise
   * that resolves when all effects have completed.
   * @returns A Promise<void> representing the completion of all background tasks.
   */
  async executeAllEffects(): Promise<void> {
    if (this.effects.length === 0) {
      return Promise.resolve();
    }

    const executionPromises = this.effects.map(effect => {
      return effect.execute(effect.payload).catch(err => {
        console.error("Side Effect failed during execution:", err);
        // We catch the error here so that one failure does not prevent others from running
      });
    });

    await Promise.all(executionPromises);
  }

  /**
   * Clears all registered side effects.
   */
  clearEffects(): void {
    this.effects = [];
  }
}

export { SideEffectBus };