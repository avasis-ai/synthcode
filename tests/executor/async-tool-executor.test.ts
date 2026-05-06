import { describe, it, expect, vi } from "vitest"
import { AsyncToolExecutor } from "../../../src/executor/async-tool-executor.js"

describe("AsyncToolExecutor", () => {
  it("should successfully execute a tool job and return the final result", async () => {
    const mockSubmitJob = vi.fn().mockResolvedValue("job-id-123")
    const mockCheckStatus = vi.fn()
      .mockResolvedValueOnce({ status: "PENDING" })
      .mockResolvedValueOnce({ status: "PENDING" })
      .mockResolvedValueOnce({ status: "SUCCESS", result: "Final Result" })

    const executor = new AsyncToolExecutor({
      tool: {
        name: "test-tool",
        submitJob: mockSubmitJob,
        checkStatus: mockCheckStatus,
      },
      pollingStrategy: {
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffFactor: 2,
      },
    })

    const result = await executor.execute()

    expect(mockSubmitJob).toHaveBeenCalled()
    expect(mockCheckStatus).toHaveBeenCalledWith("job-id-123")
    expect(mockCheckStatus).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ status: "SUCCESS", result: "Final Result" })
  })

  it("should handle job failure after multiple attempts", async () => {
    const mockSubmitJob = vi.fn().mockResolvedValue("job-id-fail")
    const mockCheckStatus = vi.fn()
      .mockResolvedValueOnce({ status: "PENDING" })
      .mockResolvedValueOnce({ status: "FAILURE", error: "Job failed due to bad input" })

    const executor = new AsyncToolExecutor({
      tool: {
        name: "fail-tool",
        submitJob: mockSubmitJob,
        checkStatus: mockCheckStatus,
      },
      pollingStrategy: {
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffFactor: 2,
      },
    })

    const result = await executor.execute()

    expect(mockSubmitJob).toHaveBeenCalled()
    expect(mockCheckStatus).toHaveBeenCalledWith("job-id-fail")
    expect(mockCheckStatus).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ status: "FAILURE", error: "Job failed due to bad input" })
  })

  it("should timeout if the job status remains pending after max attempts", async () => {
    const mockSubmitJob = vi.fn().mockResolvedValue("job-id-timeout")
    const mockCheckStatus = vi.fn()
      .mockResolvedValue({ status: "PENDING" })
      .mockResolvedValue({ status: "PENDING" })

    const executor = new AsyncToolExecutor({
      tool: {
        name: "timeout-tool",
        submitJob: mockSubmitJob,
        checkStatus: mockCheckStatus,
      },
      pollingStrategy: {
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffFactor: 2,
      },
    })

    const result = await executor.execute()

    expect(mockSubmitJob).toHaveBeenCalled()
    expect(mockCheckStatus).toHaveBeenCalledWith("job-id-timeout")
    expect(mockCheckStatus).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ status: "TIMEOUT" })
  })
})