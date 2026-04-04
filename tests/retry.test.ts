// tests/retry.test.ts
import { describe, it, expect } from "vitest"
import { retry } from "../src/retry.js"

describe("Retry Strategy", () => {
  it("should retry a failed service call a specified number of times", () => {
    // Mock a service that fails the first few times and then succeeds
    const mockService = jest.fn().mockImplementation(() => {
      if (mockService.mock.calls.length < 3) {
        throw new Error("Service failed")
      }
      return { status: "success" }
    })

    // Retry the service call with a retry strategy
    const result = retry(mockService, { maxAttempts: 5, delay: 100 })

    // The service should have been called 5 times (3 failed + 2 successful)
    expect(mockService).toHaveBeenCalledTimes(5)

    // The final result should be successful
    expect(result).toEqual({ status: "success" })
  })

  it("should stop retrying after the maximum number of attempts", () => {
    // Mock a service that always fails
    const mockService = jest.fn().mockImplementation(() => {
      throw new Error("Service failed")
    })

    // Retry the service call with a retry strategy
    const result = retry(mockService, { maxAttempts: 3, delay: 100 })

    // The service should have been called 3 times (all failed)
    expect(mockService).toHaveBeenCalledTimes(3)

    // The final result should be the last failure
    expect(result).toEqual({ status: "failure" })
  })

  it("should retry with an exponential backoff delay", () => {
    // Mock a service that fails the first time and then succeeds
    const mockService = jest.fn().mockImplementation(() => {
      if (mockService.mock.calls.length === 1) {
        throw new Error("Service failed")
      }
      return { status: "success" }
    })

    // Retry the service call with a retry strategy
    const result = retry(mockService, { maxAttempts: 5, delay: 100, backoff: true })

    // The service should have been called 5 times (1 failed + 4 successful)
    expect(mockService).toHaveBeenCalledTimes(5)

    // The final result should be successful
    expect(result).toEqual({ status: "success" })
  })
})