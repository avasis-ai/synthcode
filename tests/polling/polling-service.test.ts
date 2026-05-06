import { describe, it, expect, vi } from "vitest";
import { PollingService } from "../src/polling/polling-service.js";

describe("PollingService", () => {
  it("should successfully poll until the function returns a non-null value", async () => {
    const pollingService = new PollingService();
    let callCount = 0;
    const mockPollingFunction = vi.fn(async (attempt) => {
      callCount++;
      if (callCount < 3) {
        return null;
      }
      return "Success";
    });

    const result = await pollingService.poll(mockPollingFunction, 10, 100);

    expect(mockPollingFunction).toHaveBeenCalledTimes(3);
    expect(result).toBe("Success");
  });

  it("should throw an error if the polling function fails after multiple attempts", async () => {
    const pollingService = new PollingService();
    const mockPollingFunction = vi.fn(async (attempt) => {
      if (attempt < 3) {
        throw new Error("Polling failed");
      }
      return null;
    });

    await expect(pollingService.poll(mockPollingFunction, 3, 100)).rejects.toThrow("Polling failed");
  });

  it("should throw an error if polling exceeds the maximum number of attempts", async () => {
    const pollingService = new PollingService();
    const mockPollingFunction = vi.fn(async (attempt) => {
      return null;
    });

    await expect(pollingService.poll(mockPollingFunction, 3, 100)).rejects.toThrow("Maximum attempts reached");
  });
});