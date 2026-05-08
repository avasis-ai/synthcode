import { describe, it, expect, vi } from "vitest"
import { TransactionalServiceOrchestrator } from "../src/transaction/transactional-service-orchestrator"

describe("TransactionalServiceOrchestrator", () => {
  it("should throw an error if initialized with no steps", () => {
    expect(() => new TransactionalServiceOrchestrator([])).toThrow(
      "Orchestrator must be initialized with at least one transaction step."
    )
  })

  it("should execute all steps and compensate on failure", async () => {
    const mockStep1 = {
      name: "Step1",
      execute: vi.fn().mockResolvedValue("result1"),
      compensate: vi.fn().mockResolvedValue(undefined),
    }
    const mockStep2 = {
      name: "Step2",
      execute: vi.fn().mockResolvedValue("result2"),
      compensate: vi.fn().mockResolvedValue(undefined),
    }
    const mockStep3 = {
      name: "Step3",
      execute: vi.fn().mockRejectedValue(new Error("Step 3 failed")),
      compensate: vi.fn().mockResolvedValue(undefined),
    }

    const orchestrator = new TransactionalServiceOrchestrator([
      mockStep1,
      mockStep2,
      mockStep3,
    ])

    await expect(orchestrator.execute()).rejects.toThrow("Step 3 failed")

    // Check execution order
    expect(mockStep1.execute).toHaveBeenCalledTimes(1)
    expect(mockStep2.execute).toHaveBeenCalledTimes(1)
    expect(mockStep3.execute).toHaveBeenCalledTimes(1)

    // Check compensation order (LIFO)
    expect(mockStep2.compensate).toHaveBeenCalledTimes(1)
    expect(mockStep1.compensate).toHaveBeenCalledTimes(1)
  })

  it("should complete successfully and not compensate if all steps succeed", async () => {
    const mockStep1 = {
      name: "Step1",
      execute: vi.fn().mockResolvedValue("result1"),
      compensate: vi.fn().mockResolvedValue(undefined),
    }
    const mockStep2 = {
      name: "Step2",
      execute: vi.fn().mockResolvedValue("result2"),
      compensate: vi.fn().mockResolvedValue(undefined),
    }

    const orchestrator = new TransactionalServiceOrchestrator([
      mockStep1,
      mockStep2,
    ])

    await expect(orchestrator.execute()).resolves.toBeDefined()

    // Check execution
    expect(mockStep1.execute).toHaveBeenCalledTimes(1)
    expect(mockStep2.execute).toHaveBeenCalledTimes(1)

    // Check compensation (should not be called)
    expect(mockStep1.compensate).not.toHaveBeenCalled()
    expect(mockStep2.compensate).not.toHaveBeenCalled()
  })
})