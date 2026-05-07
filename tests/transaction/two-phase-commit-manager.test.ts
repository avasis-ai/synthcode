import { describe, it, expect, vi } from "vitest";
import { TwoPhaseCommitManager, TransactionState, CompensationAction, TransactionContext } from "../../../src/transaction/two-phase-commit-manager";

describe("TwoPhaseCommitManager", () => {
  it("should successfully commit a transaction through two phases", async () => {
    const mockContext: TransactionContext = {
      transactionId: "tx-123",
      state: TransactionState.PENDING,
      compensationActions: [
        { execute: vi.fn().mockResolvedValue(undefined) },
        { execute: vi.fn().mockResolvedValue(undefined) },
      ],
      data: { key: "value" },
    };

    const manager = new TwoPhaseCommitManager();
    await manager.prepare(mockContext);
    expect(mockContext.state).toBe(TransactionState.PREPARED);

    await manager.commit(mockContext);
    expect(mockContext.state).toBe(TransactionState.COMMITTED);
  });

  it("should roll back a transaction if the commit phase fails", async () => {
    const mockContext: TransactionContext = {
      transactionId: "tx-456",
      state: TransactionState.PREPARED,
      compensationActions: [
        { execute: vi.fn().mockResolvedValue(undefined) },
      ],
      data: { key: "value" },
    };

    const manager = new TwoPhaseCommitManager();
    // Simulate failure during commit
    const failingCommit = vi.fn().mockRejectedValue(new Error("Commit failed"));
    mockContext.compensationActions[0].execute = failingCommit;

    await manager.commit(mockContext);
    expect(mockContext.state).toBe(TransactionState.ROLLED_BACK);
    expect(failingCommit).toHaveBeenCalledWith("tx-456");
  });

  it("should handle rollback correctly if preparation fails", async () => {
    const mockContext: TransactionContext = {
      transactionId: "tx-789",
      state: TransactionState.PENDING,
      compensationActions: [
        { execute: vi.fn().mockResolvedValue(undefined) },
      ],
      data: { key: "value" },
    };

    const manager = new TwoPhaseCommitManager();
    // Simulate failure during prepare
    const failingPrepare = vi.fn().mockRejectedValue(new Error("Prepare failed"));
    mockContext.compensationActions[0].execute = failingPrepare;

    await manager.prepare(mockContext);
    expect(mockContext.state).toBe(TransactionState.PENDING); // State should not change on failure

    // Attempting commit should not happen if prepare failed
    await expect(manager.commit(mockContext)).rejects.toThrow("Transaction must be PREPARED to commit");
  });
});