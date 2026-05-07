import { describe, it, expect, vi } from "vitest";
import { AsyncTaskOrchestrator } from "../../../src/orchestration/async-task-orchestrator.js";

describe("AsyncTaskOrchestrator", () => {
    it("should initialize and process a simple task successfully", async () => {
        const mockTaskDefinition = {
            pollingIntervalMs: 10,
            completionCondition: (data) => data.progress === 100,
            initialState: { progress: 0, totalSteps: 3 },
        };
        const orchestrator = new AsyncTaskOrchestrator();
        const task = {
            taskId: "test-task-1",
            status: "PENDING",
            definition: mockTaskDefinition,
            currentData: mockTaskDefinition.initialState,
            createdAt: new Date(),
        };

        // Mock the internal update logic to simulate progress
        vi.spyOn(orchestrator, "updateTaskData").mockImplementation(async (task) => {
            if (task.currentData.progress < 100) {
                task.currentData.progress += 33;
                return task;
            }
            return task;
        });

        // Simulate running the task until completion
        await orchestrator.processTask(task);

        // Check if the task status is COMPLETE
        expect(task.status).toBe("COMPLETE");
        // Check if the internal update logic was called enough times
        expect(orchestrator.updateTaskData).toHaveBeenCalledTimes(3);
    });

    it("should mark the task as FAILED if the completion condition is never met", async () => {
        const mockTaskDefinition = {
            pollingIntervalMs: 10,
            completionCondition: (data) => data.progress === 100,
            initialState: { progress: 0, totalSteps: 3 },
        };
        const orchestrator = new AsyncTaskOrchestrator();
        const task = {
            taskId: "test-task-fail",
            status: "PENDING",
            definition: mockTaskDefinition,
            currentData: mockTaskDefinition.initialState,
            createdAt: new Date(),
        };

        // Mock the internal update logic to simulate reaching a stable, incomplete state
        vi.spyOn(orchestrator, "updateTaskData").mockImplementation(async (task) => {
            // Keep progress low, simulating a failure state
            task.currentData.progress = 50;
            return task;
        });

        // Process the task, but limit the iterations to prevent infinite loop in test
        // We expect the task to eventually fail after a few attempts (e.g., 5 cycles)
        await orchestrator.processTask(task);

        // Since the mock update function keeps progress at 50, the task should eventually fail
        // (assuming the orchestrator has a built-in failure mechanism after N attempts)
        // For this test, we assert that the status is not COMPLETE and is marked as FAILED
        // (Note: The actual failure logic depends on the implementation details of the orchestrator, 
        // but we assume it handles timeout/failure detection.)
        expect(task.status).toBe("FAILED");
    });

    it("should handle tasks with webhooks and update status correctly", async () => {
        const mockWebhookUrl = "http://mock-webhook.com/success";
        const mockTaskDefinition = {
            pollingIntervalMs: 10,
            completionCondition: (data) => data.status === "SUCCESS",
            webhookEndpoint: mockWebhookUrl,
            initialState: { status: "PENDING" },
        };
        const orchestrator = new AsyncTaskOrchestrator();
        const task = {
            taskId: "webhook-task",
            status: "PENDING",
            definition: mockTaskDefinition,
            currentData: mockTaskDefinition.initialState,
            createdAt: new Date(),
        };

        // Mock the webhook call to ensure it's called upon completion
        const mockFetch = vi.spyOn("node-fetch", "default");
        mockFetch.mockResolvedValue({});

        // Mock the internal update logic to simulate success
        vi.spyOn(orchestrator, "updateTaskData").mockImplementation(async (task) => {
            task.currentData.status = "SUCCESS";
            return task;
        });

        await orchestrator.processTask(task);

        // 1. Check if the task status is COMPLETE
        expect(task.status).toBe("COMPLETE");
        // 2. Check if the webhook was triggered
        expect(mockFetch).toHaveBeenCalledWith(mockWebhookUrl, expect.any(Object));
    });
});