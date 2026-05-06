import { describe, it, expect, vi, beforeEach } from "vitest"
import { ExternalPollingManager, PollingStep, PollingError } from "../src/polling/external-polling-manager.js"

describe("ExternalPollingManager", () => {
  let mockFetcher: vi.Mock
  let mockPollingStep: PollingStep
  let manager: ExternalPollingManager

  beforeEach(() => {
    mockFetcher = vi.fn()
    mockPollingStep = {
      endpoint: "test-endpoint",
      intervalMs: 100,
      maxAttempts: 3,
      successCondition: vi.fn(),
      fetcher: mockFetcher,
    }
    manager = new ExternalPollingManager(mockPollingStep)
  })

  it("should successfully poll when the success condition is met on the first attempt", async () => {
    mockFetcher.mockResolvedValueOnce({ status: "success" })
    mockPollingStep.successCondition.mockReturnValue(true)

    await manager.poll()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
  })

  it("should retry polling until the success condition is met or max attempts are reached", async () => {
    // Fail on first two attempts, succeed on the third
    mockFetcher.mockResolvedValueOnce({ status: "pending" })
    mockFetcher.mockResolvedValueOnce({ status: "pending" })
    mockFetcher.mockResolvedValueOnce({ status: "success" })

    // Set success condition to pass only on the third attempt (attempt 3)
    mockPollingStep.successCondition.mockImplementation((data) => {
      return data && data.status === "success"
    })

    await manager.poll()

    expect(mockFetcher).toHaveBeenCalledTimes(3)
  })

  it("should throw PollingError if max attempts are reached without success", async () => {
    // Always fail
    mockFetcher.mockResolvedValue({ status: "failed" })
    mockPollingStep.successCondition.mockReturnValue(false)

    await expect(manager.poll()).rejects.toThrow(PollingError)
    await expect(manager.poll()).rejects.toThrow("Polling failed after reaching maximum attempts")
    expect(mockFetcher).toHaveBeenCalledTimes(3)
  })
})