import { describe, it, expect, vi } from "vitest";
import { TransactionalSagaManager } from "../src/orchestration/transactional-saga-manager";

describe("TransactionalSagaManager", () => {
  it("should initialize correctly and manage a simple successful saga", async () => {
    const sagaManager = new TransactionalSagaManager();
    const sagaId = "test-saga-id";

    // Mocking the underlying execution logic for simplicity
    vi.spyOn(sagaManager, "executeSagaStep").mockResolvedValue({ success: true, result: "Step 1 completed" });
    vi.spyOn(sagaManager, "executeSagaStep").mockResolvedValue({ success: true, result: "Step 2 completed" });

    await sagaManager.runSaga(sagaId, [
      { stepName: "step1", payload: {} },
      { stepName: "step2", payload: {} },
    ]);

    expect(sagaManager.getSagaStatus(sagaId)).toBe("COMPLETED");
    expect(sagaManager.getSagaResult(sagaId)).toContain("Step 2 completed");
  });

  it("should handle failure and rollback when a step fails", async () => {
    const sagaManager = new TransactionalSagaManager();
    const sagaId = "test-failure-saga";

    // Mocking the execution steps: Step 1 succeeds, Step 2 fails, Step 3 (rollback) is called
    vi.spyOn(sagaManager, "executeSagaStep")
      .mockResolvedValueOnce({ success: true, result: "Step 1 success" })
      .mockRejectedValueOnce(new Error("Step 2 failed critically"))
      .mockResolvedValueOnce({ success: true, result: "Rollback successful" });

    await sagaManager.runSaga(sagaId, [
      { stepName: "step1", payload: {} },
      { stepName: "step2", payload: {} },
      { stepName: "rollback_step", payload: {} }, // Rollback step is explicitly defined or handled internally
    ]);

    // In a real implementation, the rollback logic should be triggered automatically.
    // We check if the status reflects the failure and if the rollback was attempted.
    expect(sagaManager.getSagaStatus(sagaId)).toBe("FAILED");
    // Depending on implementation, the result might reflect the failure or the rollback attempt.
    expect(sagaManager.getSagaResult(sagaId)).toContain("Rollback successful");
  });

  it("should maintain state and allow status checking throughout the process", async () => {
    const sagaManager = new TransactionalSagaManager();
    const sagaId = "test-state-management";

    // Mocking the execution steps
    vi.spyOn(sagaManager, "executeSagaStep").mockResolvedValue({ success: true, result: "Initial step" });

    // Start the saga
    const sagaPromise = sagaManager.runSaga(sagaId, [{ stepName: "step1", payload: {} }]);

    // Check initial status (before completion)
    await new Promise(resolve => setTimeout(resolve, 10)); // Wait briefly for async updates
    expect(sagaManager.getSagaStatus(sagaId)).toBe("RUNNING");

    // Wait for the saga to complete
    await sagaPromise;

    // Check final status
    expect(sagaManager.getSagaStatus(sagaId)).toBe("COMPLETED");
  });
});