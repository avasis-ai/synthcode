import { describe, it, expect } from "vitest";
import { TemporalScheduler } from "../src/scheduling/temporal-scheduler";

describe("TemporalScheduler", () => {
  it("should schedule a single task correctly", () => {
    const scheduler = new TemporalScheduler(
      [
        {
          id: "taskA",
          duration: 10,
          resources: { cpu: 1 },
          dependencies: [],
          weight: 1,
        },
      ],
      { cpu: 2, memory: 10 }
    );
    const schedule = scheduler.schedule();

    expect(schedule.steps).toHaveLength(1);
    expect(schedule.steps[0].taskId).toBe("taskA");
    expect(schedule.steps[0].startTime).toBe(0);
    expect(schedule.steps[0].endTime).toBe(10);
    expect(schedule.steps[0].resourcesUsed).toEqual({ cpu: 1, memory: 0 });
    expect(schedule.totalDuration).toBe(10);
  });

  it("should schedule dependent tasks sequentially", () => {
    const tasks = [
      {
        id: "taskA",
        duration: 5,
        resources: { cpu: 1 },
        dependencies: [],
        weight: 1,
      },
      {
        id: "taskB",
        duration: 3,
        resources: { cpu: 1 },
        dependencies: ["taskA"],
        weight: 1,
      },
    ];
    const scheduler = new TemporalScheduler(tasks, { cpu: 2, memory: 10 });
    const schedule = scheduler.schedule();

    expect(schedule.steps).toHaveLength(2);
    expect(schedule.steps[0].taskId).toBe("taskA");
    expect(schedule.steps[0].startTime).toBe(0);
    expect(schedule.steps[0].endTime).toBe(5);
    expect(schedule.steps[1].taskId).toBe("taskB");
    expect(schedule.steps[1].startTime).toBe(5);
    expect(schedule.steps[1].endTime).toBe(8);
    expect(schedule.totalDuration).toBe(8);
  });

  it("should handle resource contention by delaying tasks", () => {
    const tasks = [
      {
        id: "taskA",
        duration: 5,
        resources: { cpu: 2 },
        dependencies: [],
        weight: 1,
      },
      {
        id: "taskB",
        duration: 5,
        resources: { cpu: 2 },
        dependencies: [],
        weight: 1,
      },
    ];
    // Capacity is only 3 CPU, so task B must wait after task A finishes
    const scheduler = new TemporalScheduler(tasks, { cpu: 3, memory: 10 });
    const schedule = scheduler.schedule();

    expect(schedule.steps).toHaveLength(2);
    expect(schedule.steps[0].taskId).toBe("taskA");
    expect(schedule.steps[0].startTime).toBe(0);
    expect(schedule.steps[0].endTime).toBe(5);
    expect(schedule.steps[1].taskId).toBe("taskB");
    expect(schedule.steps[1].startTime).toBe(5);
    expect(schedule.steps[1].endTime).toBe(10);
    expect(schedule.totalDuration).toBe(10);
  });
});