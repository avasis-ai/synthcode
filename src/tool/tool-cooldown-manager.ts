import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface CooldownMetadata {
  lastExecutionTime: number;
  cooldownDurationMs: number;
}

export class ToolCooldownManager {
  private cooldowns: Map<string, CooldownMetadata> = new Map();

  constructor() {}

  private getCooldownMetadata(toolId: string): CooldownMetadata {
    if (!this.cooldowns.has(toolId)) {
      return {
        lastExecutionTime: 0,
        cooldownDurationMs: 0,
      };
    }
    return this.cooldowns.get(toolId)!;
  }

  public setCooldown(toolId: string, durationMs: number): void {
    this.cooldowns.set(toolId, {
      lastExecutionTime: 0,
      cooldownDurationMs: durationMs,
    });
  }

  public canExecute(toolId: string): boolean {
    const metadata = this.getCooldownMetadata(toolId);
    const currentTime = Date.now();
    const minimumAllowedTime = metadata.lastExecutionTime + metadata.cooldownDurationMs;

    return currentTime >= minimumAllowedTime;
  }

  public recordExecution(toolId: string): void {
    const cooldownDurationMs = this.getCooldownMetadata(toolId).cooldownDurationMs;
    const currentTime = Date.now();

    this.cooldowns.set(toolId, {
      lastExecutionTime: currentTime,
      cooldownDurationMs: cooldownDurationMs,
    });
  }

  public clearCooldown(toolId: string): void {
    this.cooldowns.delete(toolId);
  }
}