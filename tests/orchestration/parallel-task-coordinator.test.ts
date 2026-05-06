import { describe, it, expect, vi } from "vitest";
import { ParallelTaskCoordinator } from "../../../src/orchestration/parallel-task-coordinator";

describe("ParallelTaskCoordinator", () => {
    it("should correctly coordinate and execute multiple tasks concurrently", async () => {
        const coordinator = new ParallelTaskCoordinator();
        const mockTask1 = { id: "task1", duration: 10, resourceNeeds: { cpu: 1, memory: 1, timeMs: 10 } };
        const mockTask2 = { id: "task2", duration: 5, resourceNeeds: { cpu: 1, memory: 1, timeMs: 5 } };

        // Mock the execution mechanism to simulate concurrent execution
        vi.spyOn(coordinator, "executeTask").mockImplementation(async (task) => {
            await new Promise(resolve => setTimeout(resolve, task.duration));
            return { id: task.id, result: `Completed ${task.id}` };
        });

        const tasks = [mockTask1, mockTask2];
        const results = await coordinator.coordinate(tasks);

        // Check if all tasks were processed
        expect(results).toHaveLength(2);
        // Check if the execution mechanism was called for both tasks
        expect(coordinator.executeTask).toHaveBeenCalledTimes(2);
        expect(coordinator.executeTask).toHaveBeenCalledWith(mockTask1);
        expect(coordinator.executeTask).toHaveBeenCalledWith(mockTask2);
    });

    it("should handle an empty list of tasks gracefully", async () => {
        const coordinator = new ParallelTaskCoordinator();
        const tasks: any[] = [];

        const results = await coordinator.coordinate(tasks);

        // Expect an empty array of results
        expect(results).toEqual([]);
        // Ensure the execution method was never called
        await expect(coordinator.executeTask).toHaveBeenCalledTimes(0);
    });

    it("should wait for all tasks to complete before returning results", async () => {
        const coordinator = new ParallelTaskCoordinator();
        const mockTask = { id: "task3", duration: 20, resourceNeeds: { cpu: 1, memory: 1, timeMs: 20 } };

        // Mock the execution mechanism to simulate a delay
        vi.spyOn(coordinator, "executeTask").mockImplementation(async (task) => {
            await new Promise(resolve => setTimeout(resolve, task.duration));
            return { id: task.id, result: `Completed ${task.id}` };
        });

        const startTime = Date.now();
        const results = await coordinator.coordinate([mockTask]);
        const endTime = Date.now();

        // The total time elapsed should be close to the task duration (20ms)
        // We use a tolerance because of asynchronous nature and test overhead.
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("task3");
        expect(endTime - startTime).toBeGreaterThanOrEqual(15);
        expect(endTime - startTime).toBeLessThan(30);
    });
});