import { describe, it, expect, vi, beforeEach } from "vitest";
import { PersistentTaskQueueManager, TaskQueueClient, TaskID, TaskResult } from "../src/queue/persistent-task-queue-manager";

describe("PersistentTaskQueueManager", () => {
  let mockClient: TaskQueueClient;
  let manager: PersistentTaskQueueManager;

  beforeEach(() => {
    mockClient = {
      submitTask: vi.fn(),
      pollTask: vi.fn(),
    };
    // Assuming a default polling interval for testing purposes
    manager = new PersistentTaskQueueManager(mockClient, 100);
  });

  it("should submit a task and return a TaskID", async () => {
    const payload = { data: "test payload" };
    const expectedTaskID: TaskID = "task-123";

    mockClient.submitTask.mockResolvedValue(expectedTaskID);

    const taskID = await manager.submitTask(payload);

    expect(mockClient.submitTask).toHaveBeenCalledWith(payload);
    expect(taskID).toBe(expectedTaskID);
  });

  it("should poll for task status periodically and handle task completion", async () => {
    const taskID: TaskID = "task-456";
    let pollCount = 0;

    // Mock the polling behavior: PENDING -> PENDING -> COMPLETE
    mockClient.pollTask.mockImplementation(async (id: TaskID) => {
      pollCount++;
      if (pollCount < 3) {
        return { status: "PENDING" };
      }
      return { status: "COMPLETE", result: "Success data" };
    });

    // Spy on setInterval and clearInterval to control time flow
    vi.spyOn(global, "setInterval");
    vi.spyOn(global, "clearInterval");

    // Start the polling process
    const pollPromise = manager.startPolling(taskID);

    // Simulate time passing (e.g., 2 intervals)
    await vi.advanceTimersByTimeAsync(100 * 2);

    // Check if polling was called multiple times
    expect(mockClient.pollTask).toHaveBeenCalledTimes(2);
    expect(mockClient.pollTask).toHaveBeenCalledWith(taskID);

    // Advance time one more interval to trigger completion
    await vi.advanceTimersByTimeAsync(100);

    // Wait for the final resolution (or timeout)
    await pollPromise;

    // Check if polling was called the required number of times (3 times)
    expect(mockClient.pollTask).toHaveBeenCalledTimes(3);
    expect(mockClient.pollTask).toHaveBeenCalledWith(taskID);
  });
});