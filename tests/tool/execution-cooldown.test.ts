import { describe, it, expect, vi } from "vitest";
import { CooldownManager } from "../src/tool/execution-cooldown";

describe("CooldownManager", () => {
  it("should initialize with no cooldowns set", () => {
    const manager = new CooldownManager();
    // We can't directly test private maps, but we can test methods that rely on them
    // A simple check that calling getCooldown on an unset tool returns undefined/default
    expect(manager.getCooldown("nonExistentTool")).toBeUndefined();
  });

  it("should set and retrieve the correct cooldown duration in milliseconds", () => {
    const manager = new CooldownManager();
    const toolName = "testTool";
    const durationSeconds = 5;
    manager.setCooldown(toolName, durationSeconds);
    expect(manager.getCooldown(toolName)).toBe(durationSeconds * 1000);
  });

  it("should correctly check if enough time has passed since the last execution", () => {
    const manager = new CooldownManager();
    const toolName = "apiCall";
    const cooldownSeconds = 2;
    manager.setCooldown(toolName, cooldownSeconds);

    // Simulate initial execution
    const initialTime = Date.now();
    manager.recordExecution(toolName, initialTime);

    // Test immediately after execution (should be too soon)
    const tooSoonTime = initialTime + 1000; // 1 second later
    expect(manager.canExecute(toolName, tooSoonTime)).toBe(false);

    // Test just before cooldown ends (should still be too soon)
    const justBeforeTime = initialTime + (cooldownSeconds * 1000) - 1;
    expect(manager.canExecute(toolName, justBeforeTime)).toBe(false);

    // Test exactly when cooldown ends (should be allowed)
    const exactlyTime = initialTime + (cooldownSeconds * 1000);
    expect(manager.canExecute(toolName, exactlyTime)).toBe(true);

    // Test well after cooldown ends (should be allowed)
    const laterTime = initialTime + (cooldownSeconds * 1000) + 1000;
    expect(manager.canExecute(toolName, laterTime)).toBe(true);
  });
});