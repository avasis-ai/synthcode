import { describe, it, expect, vi } from "vitest"
import { TransactionalWorkflowCoordinator } from "../src/transaction/transactional-workflow-coordinator.js"

describe("TransactionalWorkflowCoordinator", () => {
  it("should execute all steps successfully when all steps succeed", async () => {
    const mockSteps: { execute: () => Promise<any>; rollback: () => Promise<void> }[] = [
      { execute: () => Promise.resolve("Step 1 Success"), rollback: async () => {} },
      { execute: () => Promise.resolve("Step 2 Success"), rollback: async () => {} },
      { execute: () => Promise.resolve("Step 3 Success"), rollback: async () => {} },
    ]
    const coordinator = new TransactionalWorkflowCoordinator(mockSteps)

    await coordinator.execute()

    expect(mockSteps[0].execute).toHaveBeenCalledTimes(1)
    expect(mockSteps[1].execute).toHaveBeenCalledTimes(1)
    expect(mockSteps[2].execute).toHaveBeenCalledTimes(1)
    // Ensure rollbacks were not called
    expect(mockSteps[0].rollback).toHaveBeenCalledTimes(0)
    expect(mockSteps[1].rollback).toHaveBeenCalledTimes(0)
    expect(mockSteps[2].rollback).toHaveBeenCalledTimes(0)
  })

  it("should execute rollbacks for all preceding steps if a step fails", async () => {
    const mockSteps: { execute: () => Promise<any>; rollback: () => Promise<void> }[] = [
      { execute: () => Promise.resolve("Step 1 Success"), rollback: vi.fn().mockResolvedValue(undefined) },
      { execute: () => Promise.reject(new Error("Step 2 Failed")), rollback: vi.fn().mockResolvedValue(undefined) },
      { execute: () => Promise.resolve("Step 3 Success"), rollback: vi.fn().mockResolvedValue(undefined) },
    ]
    // Overwrite the mock functions to track calls
    mockSteps[0].execute = vi.fn(() => Promise.resolve("Step 1 Success"))
    mockSteps[1].execute = vi.fn(() => Promise.reject(new Error("Step 2 Failed")))
    mockSteps[2].execute = vi.fn(() => Promise.resolve("Step 3 Success"))

    const coordinator = new TransactionalWorkflowCoordinator(mockSteps)

    await expect(coordinator.execute()).rejects.toThrow("Step 2 Failed")

    // Step 1 should execute
    expect(mockSteps[0].execute).toHaveBeenCalledTimes(1)
    // Step 2 should execute and fail
    expect(mockSteps[1].execute).toHaveBeenCalledTimes(1)
    // Step 3 should not execute
    expect(mockSteps[2].execute).toHaveBeenCalledTimes(0)

    // Rollbacks should be called for Step 1 (and potentially Step 2 if it partially succeeded, but here we assume only successful ones are rolled back)
    // Since Step 1 succeeded, its rollback should be called.
    expect(mockSteps[0].rollback).toHaveBeenCalledTimes(1)
    // Since Step 2 failed immediately, its rollback is usually skipped in this pattern, but we check the provided mock structure.
    // Assuming the coordinator only rolls back steps that successfully completed execution.
    expect(mockSteps[1].rollback).toHaveBeenCalledTimes(0)
    // Step 3 was never reached
    expect(mockSteps[2].rollback).toHaveBeenCalledTimes(0)
  })

  it("should handle multiple rollbacks gracefully even if one rollback fails", async () => {
    const mockSteps: { execute: () => Promise<any>; rollback: () => Promise<void> }[] = [
      { execute: () => Promise.resolve("Step 1 Success"), rollback: vi.fn().mockResolvedValue(undefined) },
      { execute: () => Promise.reject(new Error("Step 2 Failed")), rollback: vi.fn().mockRejectedValue(new Error("Rollback 1 Failed")) },
      { execute: () => Promise.resolve("Step 3 Success"), rollback: vi.fn().mockResolvedValue(undefined) },
    ]
    // Setup mocks
    mockSteps[0].execute = vi.fn(() => Promise.resolve("Step 1 Success"))
    mockSteps[1].execute = vi.fn(() => Promise.reject(new Error("Step 2 Failed")))
    mockSteps[2].execute = vi.fn(() => Promise.resolve("Step 3 Success"))

    const coordinator = new TransactionalWorkflowCoordinator(mockSteps)

    // The coordinator should still reject with the original failure, but ensure rollbacks are attempted.
    await expect(coordinator.execute()).rejects.toThrow("Step 2 Failed")

    // Step 1 executed
    expect(mockSteps[0].execute).toHaveBeenCalledTimes(1)
    // Step 2 failed
    expect(mockSteps[1].execute).toHaveBeenCalledTimes(1)
    // Step 3 did not execute
    expect(mockSteps[2].execute).toHaveBeenCalledTimes(0)

    // Rollback for Step 1 must be called, even if subsequent rollbacks fail.
    expect(mockSteps[0].rollback).toHaveBeenCalledTimes(1)
    // Rollback for Step 2 is called, and we expect the coordinator to handle the failure but still propagate the original error.
    expect(mockSteps[1].rollback).toHaveBeenCalledTimes(1)
  })
})