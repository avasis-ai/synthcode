import { describe, it, expect, vi } from "vitest";
import { ExternalActionCoordinator, ExternalAction } from "../src/coordination/external-action-coordinator";

describe("ExternalActionCoordinator", () => {
  it("should execute a sequence of actions and compensate on failure", async () => {
    const mockAction1: ExternalAction = {
      idempotencyKey: "action1",
      execute: vi.fn().mockResolvedValue("result1"),
      compensate: vi.fn().mockResolvedValue(undefined),
    };
    const mockAction2: ExternalAction = {
      idempotencyKey: "action2",
      execute: vi.fn().mockResolvedValue("result2"),
      compensate: vi.fn().mockResolvedValue(undefined),
    };
    const mockAction3: ExternalAction: ExternalAction = {
      idempotencyKey: "action3",
      execute: vi.fn().mockRejectedValue(new Error("Action 3 failed")),
      compensate: vi.fn().mockResolvedValue(undefined),
    };

    const coordinator = new ExternalActionCoordinator();

    // Execute the sequence
    await coordinator.executeActions([mockAction1, mockAction2, mockAction3]);

    // Assertions
    expect(mockAction1.execute).toHaveBeenCalledTimes(1);
    expect(mockAction2.execute).toHaveBeenCalledTimes(1);
    expect(mockAction3.execute).toHaveBeenCalledTimes(1);

    // Check compensation logic
    expect(mockAction1.compensate).toHaveBeenCalledTimes(1);
    expect(mockAction2.compensate).toHaveBeenCalledTimes(1);
    expect(mockAction3.compensate).not.toHaveBeenCalled();
  });

  it("should complete successfully and not compensate if all actions succeed", async () => {
    const mockAction1: ExternalAction = {
      idempotencyKey: "action1",
      execute: vi.fn().mockResolvedValue("result1"),
      compensate: vi.fn().mockResolvedValue(undefined),
    };
    const mockAction2: ExternalAction = {
      idempotencyKey: "action2",
      execute: vi.fn().mockResolvedValue("result2"),
      compensate: vi.fn().mockResolvedValue(undefined),
    };

    const coordinator = new ExternalActionCoordinator();

    await coordinator.executeActions([mockAction1, mockAction2]);

    // Assertions
    expect(mockAction1.execute).toHaveBeenCalledTimes(1);
    expect(mockAction2.execute).toHaveBeenCalledTimes(1);

    // Check compensation logic (should not run)
    expect(mockAction1.compensate).not.toHaveBeenCalled();
    expect(mockAction2.compensate).not.toHaveBeenCalled();
  });

  it("should handle empty action list gracefully", async () => {
    const coordinator = new ExternalActionCoordinator();

    await coordinator.executeActions([]);

    // Assertions
    expect(await coordinator.executeActions([])).toBeUndefined();
  });
});