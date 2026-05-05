import { describe, it, expect, vi } from "vitest";
import { ResourceAwareScheduler } from "../src/scheduling/resource-aware-scheduler";

describe("ResourceAwareScheduler", () => {
  it("should schedule tasks when resources are available", async () => {
    const initialProfile: ResourceProfile = { cpuUsage: 10, memoryUsage: 20, bandwidthUsage: 30 };
    const maxCapacity: { cpu: number; memory: number; bandwidth: number } = { cpu: 100, memory: 200, bandwidth: 500 };
    const scheduler = new ResourceAwareScheduler(initialProfile, maxCapacity);

    const mockTask = {
      id: "task1",
      name: "Test Task",
      requiredResources: { cpu: 10, memory: 20, bandwidth: 30 },
      priority: 5,
      maxRetries: 3,
      currentAttempt: 0,
      execute: vi.fn().mockResolvedValue(undefined),
    };

    await scheduler.scheduleTask(mockTask);

    expect(mockTask.execute).toHaveBeenCalledTimes(1);
    expect(scheduler.getCurrentProfile()).toEqual({
      cpuUsage: 10 + 10,
      memoryUsage: 20 + 20,
      bandwidthUsage: 30 + 30,
    });
  });

  it("should not schedule a task if resources are insufficient", async () => {
    const initialProfile: ResourceProfile = { cpuUsage: 90, memoryUsage: 180, bandwidthUsage: 450 };
    const maxCapacity: { cpu: number; memory: number; bandwidth: number } = { cpu: 100, memory: 200, bandwidth: 500 };
    const scheduler = new ResourceAwareScheduler(initialProfile, maxCapacity);

    const mockTask = {
      id: "task2",
      name: "Overload Task",
      requiredResources: { cpu: 20, memory: 30, bandwidth: 50 },
      priority: 1,
      maxRetries: 1,
      currentAttempt: 0,
      execute: vi.fn().mockResolvedValue(undefined),
    };

    await scheduler.scheduleTask(mockTask);

    expect(mockTask.execute).not.toHaveBeenCalled();
    expect(scheduler.getCurrentProfile()).toEqual({
      cpuUsage: 90,
      memoryUsage: 180,
      bandwidthUsage: 450,
    });
  });

  it("should update resource profile upon task completion", async () => {
    const initialProfile: ResourceProfile = { cpuUsage: 50, memoryUsage: 100, bandwidthUsage: 200 };
    const maxCapacity: { cpu: number; memory: number; bandwidth: number } = { cpu: 100, memory: 200, bandwidth: 500 };
    const scheduler = new ResourceAwareScheduler(initialProfile, maxCapacity);

    const mockTask = {
      id: "task3",
      name: "Completing Task",
      requiredResources: { cpu: 15, memory: 25, bandwidth: 50 },
      priority: 3,
      maxRetries: 2,
      currentAttempt: 0,
      execute: vi.fn().mockResolvedValue(undefined),
    };

    // Simulate scheduling and completion
    await scheduler.scheduleTask(mockTask);
    await scheduler.completeTask(mockTask.id);

    expect(mockTask.execute).toHaveBeenCalledTimes(1);
    expect(scheduler.getCurrentProfile()).toEqual({
      cpuUsage: 50,
      memoryUsage: 100,
      bandwidthUsage: 200,
    });
  });
});