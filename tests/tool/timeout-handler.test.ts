import { describe, it, expect } from "vitest";
import { withTimeout, TimeoutError } from "../src/tool/timeout-handler";

describe("withTimeout", () => {
  it("should resolve with the result of the tool function if it completes within the timeout", async () => {
    const mockToolFn = async (signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "success";
    };
    const result = await withTimeout(mockToolFn, 100);
    expect(result).toBe("success");
  });

  it("should reject with TimeoutError if the tool function takes longer than the timeout", async () => {
    const mockToolFn = async (signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return "should not reach";
    };
    await expect(withTimeout(mockToolFn, 10)).rejects.toThrow(TimeoutError);
    await expect(withTimeout(mockToolFn, 10)).rejects.toThrow("TimeoutError");
  });

  it("should abort the underlying function when the timeout is reached", async () => {
    const mockToolFn = vi.fn(async (signal: AbortSignal) => {
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (signal.aborted) {
            reject(new Error("Aborted"));
          } else {
            resolve("completed");
          }
        }, 50);
        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new Error("Aborted"));
        });
      });
    });
    const promise = withTimeout(mockToolFn, 10);
    // Wait briefly to allow the timeout mechanism to trigger the abort
    await new Promise(resolve => setTimeout(resolve, 50));
    await expect(promise).rejects.toThrow("Aborted");
    expect(mockToolFn).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
});