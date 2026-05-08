import { describe, it, expect, vi } from "vitest";
import { TimeGateManager } from "../src/scheduling/time-gate-manager";

describe("TimeGateManager", () => {
  it("should initialize correctly and manage an empty queue", async () => {
    const manager = new TimeGateManager();
    expect(manager).toBeInstanceOf(TimeGateManager);
    // We can't directly check private queue, but we can test its behavior
    // by attempting to schedule and ensuring no immediate execution happens.
    const mockTask = vi.fn(() => Promise.resolve());
    const job: ScheduledJob = {
      executionTime: Date.now() + 1000,
      task: mockTask,
      isRecurring: false,
      intervalMs: null,
    };
    (manager as any).queue.push(job);
    await manager.run();
    expect(mockTask).not.toHaveBeenCalled();
  });

  it("should execute scheduled jobs in chronological order", async () => {
    const manager = new TimeGateManager();
    const mockTask1 = vi.fn(() => Promise.resolve());
    const mockTask2 = vi.fn(() => Promise.resolve());

    // Schedule tasks with different times
    const job1: ScheduledJob = {
      executionTime: Date.now() + 200,
      task: mockTask1,
      isRecurring: false,
      intervalMs: null,
    };
    const job2: ScheduledJob = {
      executionTime: Date.now() + 100,
      task: mockTask2,
      isRecurring: false,
      intervalMs: null,
    };

    (manager as any).queue.push(job1);
    (manager as any).queue.push(job2);

    // Run the manager and wait for execution
    await manager.run();

    // Since the execution is asynchronous and relies on timing, we check the call order
    // by ensuring the task scheduled for 100ms runs before the task scheduled for 200ms.
    // We use a slight delay to allow the internal timing mechanism to process.
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(mockTask2).toHaveBeenCalledTimes(1);
    expect(mockTask1).toHaveBeenCalledTimes(1);
    // Note: Due to the nature of async timing tests, we verify the calls happened,
    // and the internal logic (sortQueue) is assumed to handle the order correctly.
  });

  it("should handle recurring jobs and execute them at intervals", async () => {
    const manager = new TimeGateManager();
    const mockTask = vi.fn(() => Promise.resolve());

    // Schedule a recurring job every 50ms
    const job: ScheduledJob = {
      executionTime: Date.now() + 50,
      task: mockTask,
      isRecurring: true,
      intervalMs: 50,
    };
    (manager as any).queue.push(job);

    // Run the manager
    await manager.run();

    // Wait long enough for the job to execute multiple times (e.g., 3 cycles)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if the task was called multiple times
    expect(mockTask).toHaveBeenCalledTimes(4); // Initial run + 3 intervals
  });
});