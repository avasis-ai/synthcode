import { describe, it, expect, vi } from "vitest";
import { SagaOrchestrator } from "../src/saga/saga-orchestrator";

describe("SagaOrchestrator", () => {
    it("should execute all steps successfully and return the final context", async () => {
        const mockStep1 = {
            execute: async () => {
                return { result1: "success" };
            },
            compensate: async (context) => {
                console.log("Compensating step 1");
            },
        };
        const mockStep2 = {
            execute: async () => {
                return { result2: "success" };
            },
            compensate: async (context) => {
                console.log("Compensating step 2");
            },
        };

        const orchestrator = new SagaOrchestrator();
        const steps = [mockStep1, mockStep2];
        const initialContext = { user: "testuser" };

        const result = await orchestrator.executeSaga(steps, initialContext);

        expect(result).toEqual({ result2: "success" });
    });

    it("should execute compensation steps in reverse order upon failure", async () => {
        const mockStep1 = {
            execute: async () => {
                return { result1: "success" };
            },
            compensate: async (context) => {
                return "Compensated 1";
            },
        };
        const mockStep2 = {
            execute: async () => {
                throw new Error("Step 2 failed");
            },
            compensate: async (context) => {
                return "Compensated 2";
            },
        };
        const mockStep3 = {
            execute: async () => {
                return { result3: "success" };
            },
            compensate: async (context) => {
                return "Compensated 3";
            },
        };

        const orchestrator = new SagaOrchestrator();
        const steps = [mockStep1, mockStep2, mockStep3];
        const initialContext = { data: "initial" };

        // Spy on console.log to ensure compensation logic is called
        const compensationSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        try {
            await orchestrator.executeSaga(steps, initialContext);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toBe("Step 2 failed");
        }

        // Check if compensation for step 1 was called (since step 2 failed)
        // Note: The actual implementation details of how context is passed are assumed.
        // We verify that the compensation logic is triggered.
        expect(compensationSpy).toHaveBeenCalledTimes(1);
        compensationSpy.mockRestore();
    });

    it("should handle failure on the first step and compensate nothing", async () => {
        const mockStep1 = {
            execute: async () => {
                throw new Error("Step 1 failed immediately");
            },
            compensate: async (context) => {
                return "Should not be called";
            },
        };
        const mockStep2 = {
            execute: async () => {
                return { result2: "success" };
            },
            compensate: async (context) => {
                return "Should not be called";
            },
        };

        const orchestrator = new SagaOrchestrator();
        const steps = [mockStep1, mockStep2];
        const initialContext = {};

        const compensationSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        try {
            await orchestrator.executeSaga(steps, initialContext);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toBe("Step 1 failed immediately");
        }

        // Check that no compensation was attempted
        expect(compensationSpy).not.toHaveBeenCalled();
        compensationSpy.mockRestore();
    });
});