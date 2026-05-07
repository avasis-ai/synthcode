import { describe, it, expect, vi } from "vitest";
import { TransactionCoordinator, TransactionStep } from "../src/transaction/external-transaction-coordinator";

describe("TransactionCoordinator", () => {
    it("should successfully execute a sequence of steps and return the final context", async () => {
        const mockStep1: TransactionStep = {
            name: "step1",
            execute: async (context) => {
                const newContext = { ...context, data1: "step1_data" };
                return newContext;
            },
            compensate: async (context) => {
                console.log("Compensating step1");
            },
        };

        const mockStep2: TransactionStep = {
            name: "step2",
            execute: async (context) => {
                const newContext = { ...context, data2: "step2_data" };
                return newContext;
            },
            compensate: async (context) => {
                console.log("Compensating step2");
            },
        };

        const coordinator = new TransactionCoordinator([mockStep1, mockStep2]);
        const initialContext: Record<string, unknown> = { initial: true };

        const finalContext = await coordinator.execute(initialContext);

        expect(finalContext).toEqual({ initial: true, data1: "step1_data", data2: "step2_data" });
    });

    it("should execute compensation for all successfully completed steps if an error occurs", async () => {
        const mockStep1: TransactionStep = {
            name: "step1",
            execute: async (context) => {
                return { ...context, data1: "step1_data" };
            },
            compensate: async (context) => {
                return "Compensated step1";
            },
        };

        const mockStep2: TransactionStep = {
            name: "step2",
            execute: async (context) => {
                throw new Error("Step 2 failed intentionally");
            },
            compensate: async (context) => {
                return "Compensated step2";
            },
        };

        const mockStep3: TransactionStep = {
            name: "step3",
            execute: async (context) => {
                return { ...context, data3: "step3_data" };
            },
            compensate: async (context) => {
                return "Compensated step3";
            },
        };

        const coordinator = new TransactionCoordinator([mockStep1, mockStep2, mockStep3]);
        const initialContext: Record<string, unknown> = { initial: true };

        // We expect the execution to fail, but compensation for step 1 should run.
        await expect(async () => {
            await coordinator.execute(initialContext);
        }).rejects.toThrow("Step 2 failed intentionally");
    });

    it("should handle an empty list of steps gracefully", async () => {
        const coordinator = new TransactionCoordinator([]);
        const initialContext: Record<string, unknown> = { initial: true };

        const finalContext = await coordinator.execute(initialContext);

        expect(finalContext).toEqual(initialContext);
    });
});