import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export class CooldownManager {
  private lastExecutionTime: Map<string, number> = new Map();
  private cooldownDurations: Map<string, number> = new Map();

  constructor() {}

  setCooldown(toolName: string, durationSeconds: number): void {
    this.cooldownDurations.set(toolName, durationSeconds * 1000);
  }

  getCooldown(toolName: string): number | undefined {
    return this.cooldownDurations.get(toolName);
  }

  recordExecution(toolName: string): void {
    const now = Date.now();
    this.lastExecutionTime.set(toolName, now);
  }

  canExecute(toolName: string): boolean {
    const cooldownMs = this.getCooldown(toolName);
    if (cooldownMs === undefined) {
      return true;
    }

    const lastTime = this.lastExecutionTime.get(toolName);
    if (lastTime === undefined) {
      return true;
    }

    const elapsed = Date.now() - lastTime;
    return elapsed >= cooldownMs;
  }

  /**
   * Checks if execution is allowed and records the attempt if successful.
   * @returns {boolean} True if execution is allowed, false otherwise.
   */
  checkAndRecord(toolName: string): boolean {
    if (!this.canExecute(toolName)) {
      return false;
    }
    this.recordExecution(toolName);
    return true;
  }
}

export { CooldownManager };