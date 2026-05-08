import { describe, it, expect, vi } from "vitest";
import { AsynchronousWaitStateManager, WaitStateStatus } from "../src/waitstate/asynchronous-wait-state-manager";

describe("AsynchronousWaitStateManager", () => {
  it("should initialize and correctly transition to WAITING state", async () => {
    const mockWaitState: WaitState = {
      targetCriteria: () => false,
      pollingIntervalMs: 10,
      timeoutMs: 100,
    };
    const manager = new AsynchronousWaitStateManager(mockWaitState);

    expect(manager.getCurrentState()).toBe(WaitStateStatus.WAITING);
  });

  it("should transition to SUCCESS state when target criteria is met", async () => {
    const mockWaitState: WaitState = {
      targetCriteria: () => true,
      pollingIntervalMs: 10,
      timeoutMs: 100,
    };
    const manager = new AsynchronousWaitStateManager(mockWaitState);

    // Simulate the check cycle
    await manager.checkState();

    expect(manager.getCurrentState()).toBe(WaitStateStatus.SUCCESS);
  });

  it("should transition to TIMEOUT state when timeout is reached", async () => {
    const mockWaitState: WaitState = {
      targetCriteria: () => false,
      pollingIntervalMs: 10,
      timeoutMs: 50,
    };
    const manager = new AsynchronousWaitStateManager(mockWaitState);

    // Mock the internal timer mechanism to simulate timeout
    vi.spyOn(manager, "checkState").mockResolvedValueOnce(undefined);
    vi.spyOn(manager, "checkState").mockResolvedValueOnce(undefined);
    
    // Manually trigger the timeout logic (assuming internal mechanism handles this)
    // For testing purposes, we assume a mechanism exists to force timeout check
    await (manager as any).forceTimeoutCheck();

    expect(manager.getCurrentState()).toBe(WaitStateStatus.TIMEOUT);
  });
});