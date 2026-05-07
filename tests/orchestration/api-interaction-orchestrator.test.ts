import { describe, it, expect, vi } from "vitest";
import { ApiInteractionOrchestrator } from "../src/orchestration/api-interaction-orchestrator.js";

describe("ApiInteractionOrchestrator", () => {
    it("should successfully execute a sequence of API steps", async () => {
        const mockStep1 = {
            name: "step1",
            endpoint: "/api/step1",
            parameters: {},
            execute: vi.fn(() => Promise.resolve({ result: "data1" })),
            policy: { maxRetries: 0, initialBackoffMs: 100, retryStrategy: 'linear' },
        };
        const mockStep2 = {
            name: "step2",
            endpoint: "/api/step2",
            parameters: {},
            execute: vi.fn(() => Promise.resolve({ result: "data2" })),
            policy: { maxRetries: 0, initialBackoffMs: 100, retryStrategy: 'linear' },
        };

        const orchestrator = new ApiInteractionOrchestrator([mockStep1, mockStep2]);

        const result = await orchestrator.execute({});

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ step1: { result: "data1" }, step2: { result: "data2""} );
        expect(mockStep1.execute).toHaveBeenCalledTimes(1);
        expect(mockStep2.execute).toHaveBeenCalledTimes(1);
    });

    it("should handle failure in an early step and stop execution", async () => {
        const mockStep1 = {
            name: "step1",
            endpoint: "/api/step1",
            parameters: {},
            execute: vi.fn(() => Promise.reject("Step 1 failed")),
            policy: { maxRetries: 0, initialBackoffMs: 100, retryStrategy: 'linear' },
        };
        const mockStep2 = {
            name: "step2",
            endpoint: "/api/step2",
            parameters: {},
            execute: vi.fn(() => Promise.resolve("Should not run")),
            policy: { maxRetries: 0, initialBackoffMs: 100, retryStrategy: 'linear' },
        };

        const orchestrator = new ApiInteractionOrchestrator([mockStep1, mockStep2]);

        const result = await orchestrator.execute({});

        expect(result.success).toBe(false);
        expect(result.error).toContain("Step 1 failed");
        expect(mockStep1.execute).toHaveBeenCalledTimes(1);
        expect(mockStep2.execute).not.toHaveBeenCalled();
    });

    it("should retry a step if it fails but succeed within max retries", async () => {
        const mockStep = {
            name: "retryStep",
            endpoint: "/api/retry",
            parameters: {},
            execute: vi.fn()
                .mockRejectedValueOnce("Attempt 1 failed")
                .mockRejectedValueOnce("Attempt 2 failed")
                .mockResolvedValue("Attempt 3 succeeded"),
            policy: { maxRetries: 2, initialBackoffMs: 10, retryStrategy: 'linear' },
        };

        const orchestrator = new ApiInteractionOrchestrator([mockStep]);

        const result = await orchestrator.execute({});

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ retryStep: "Attempt 3 succeeded" });
        expect(mockStep.execute).toHaveBeenCalledTimes(3);
    });
});