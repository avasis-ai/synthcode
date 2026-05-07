import { describe, it, expect, vi } from "vitest";
import { AsyncPollingManager, ResourceState } from "../src/polling/async-resource-waiter";

describe("AsyncPollingManager", () => {
  vi.useFakeTimers();

  it("should successfully wait for a resource to reach SUCCESS state", async () => {
    const manager = new AsyncPollingManager();
    let attemptCount = 0;
    const mockPollingFunction = async (attempt: number): Promise<ResourceState> => {
      attemptCount++;
      if (attempt < 3) {
        return { status: "IN_PROGRESS" };
      }
      return { status: "SUCCESS", result: "Data loaded" };
    };

    const result = await manager.waitForResource(mockPollingFunction, 100, 5);

    expect(attemptCount).toBe(3);
    expect(result).toEqual({ status: "SUCCESS", result: "Data loaded" });
  });

  it("should fail gracefully when resource reaches FAILURE state", async () => {
    const manager = new AsyncPollingManager();
    let attemptCount = 0;
    const mockPollingFunction = async (attempt: number): Promise<ResourceState> => {
      attemptCount++;
      if (attempt < 2) {
        return { status: "IN_PROGRESS" };
      }
      return { status: "FAILURE", error: new Error("Resource unavailable") };
    };

    const result = await manager.waitForResource(mockPollingFunction, 100, 5);

    expect(attemptCount).toBe(3);
    expect(result).toEqual({ status: "FAILURE", error: expect.any(Error) });
  });

  it("should throw an error if the resource does not stabilize within the maximum attempts", async () => {
    const manager = new AsyncPollingManager();
    let attemptCount = 0;
    const mockPollingFunction = async (attempt: number): Promise<ResourceState> => {
      attemptCount++;
      return { status: "IN_PROGRESS" };
    };

    // Set max attempts to 3, but the function will always return IN_PROGRESS
    await expect(manager.waitForResource(mockPollingFunction, 100, 3)).rejects.toThrow(
      "Timeout waiting for resource to stabilize"
    );

    // Verify that the polling function was called exactly 3 times (max attempts)
    expect(attemptCount).toBe(3);
  });
});