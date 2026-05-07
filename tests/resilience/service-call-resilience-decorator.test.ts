import { describe, it, expect, vi } from "vitest";
import { ServiceCallDecorator } from "../src/resilience/service-call-resilience-decorator";

describe("ServiceCallDecorator", () => {
  vi.useFakeTimers();

  it("should retry the decorated function upon failure with exponential backoff", async () => {
    const mockService = vi.fn(() => Promise.reject(new Error("Failed")));
    const decorator = ServiceCallDecorator({
      maxRetries: 3,
      initialBackoffMs: 10,
    });

    const decoratedFunction = decorator(mockService);

    // First call fails
    let result = await decoratedFunction();
    expect(result).rejects.toThrow("Failed");

    // Check if the mock service was called 4 times (1 initial + 3 retries)
    expect(mockService).toHaveBeenCalledTimes(4);
    
    // Advance time to simulate backoff delays
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);
    await vi.advanceTimersByTimeAsync(40);
  });

  it("should succeed on the Nth attempt if maxRetries is set", async () => {
    const mockService = vi.fn()
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValue("Success"); // Succeeds on the 3rd attempt (index 2)
    
    const decorator = ServiceCallDecorator({
      maxRetries: 2,
      initialBackoffMs: 10,
    });

    const decoratedFunction = decorator(mockService);

    const result = await decoratedFunction();

    expect(result).toBe("Success");
    // Called 3 times: 1 initial + 2 retries
    expect(mockService).toHaveBeenCalledTimes(3);
  });

  it("should throw an error if all retries fail", async () => {
    const mockService = vi.fn(() => Promise.reject(new Error("Permanent Failure")));
    const decorator = ServiceCallDecorator({
      maxRetries: 2,
      initialBackoffMs: 10,
    });

    const decoratedFunction = decorator(mockService);

    // Expect the final rejection after all retries
    await expect(decoratedFunction()).rejects.toThrow("Permanent Failure");
    
    // Called 3 times: 1 initial + 2 retries
    expect(mockService).toHaveBeenCalledTimes(3);
  });
});