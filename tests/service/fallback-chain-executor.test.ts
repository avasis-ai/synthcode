import { describe, it, expect } from "vitest"
import { ServiceFallbackChainExecutor, FallbackStep } from "../../../src/service/fallback-chain-executor.js"

describe("ServiceFallbackChainExecutor", () => {
  it("should execute the first service call and return its result if successful", async () => {
    const mockServiceCall = async (input: Record<string, unknown>) => {
      return "Success Result"
    }
    const executor = new ServiceFallbackChainExecutor([
      { serviceCall: mockServiceCall }
    ])
    const result = await executor.execute({})
    expect(result).toBe("Success Result")
  })

  it("should execute subsequent fallback steps if the primary service call fails", async () => {
    const mockServiceCall1 = async () => {
      throw new Error("Primary failure")
    }
    const mockServiceCall2 = async () => {
      return "Fallback Success"
    }
    const executor = new ServiceFallbackChainExecutor([
      { serviceCall: mockServiceCall1 },
      { serviceCall: mockServiceCall2 }
    ])
    const result = await executor.execute({})
    expect(result).toBe("Fallback Success")
  })

  it("should stop execution and return the last error if all service calls fail", async () => {
    const mockServiceCall1 = async () => {
      throw new Error("Failure 1")
    }
    const mockServiceCall2 = async () => {
      throw new Error("Failure 2")
    }
    const executor = new ServiceFallbackChainExecutor([
      { serviceCall: mockServiceCall1 },
      { serviceCall: mockServiceCall2 }
    ])
    await expect(executor.execute({})).rejects.toThrow("Failure 2")
  })
})