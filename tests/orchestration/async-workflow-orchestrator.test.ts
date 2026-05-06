import { describe, it, expect, vi } from "vitest"
import { WorkflowOrchestrator } from "../../../src/orchestration/async-workflow-orchestrator.js"

describe("WorkflowOrchestrator", () => {
    it("should successfully execute a simple synchronous workflow", async () => {
        const mockStep1 = { name: "Step 1", execute: () => Promise.resolve("Data 1") }
        const mockStep2 = { name: "Step 2", execute: () => Promise.resolve("Data 2") }

        const orchestrator = new WorkflowOrchestrator([mockStep1, mockStep2])

        await orchestrator.run()

        expect(orchestrator.getStatus()).toBe("COMPLETED")
        // Assuming the orchestrator stores the final result or context
        // We'll check the internal context if possible, or just the status for simplicity
    })

    it("should handle a workflow that fails at any step", async () => {
        const mockStep1 = { name: "Step 1", execute: () => Promise.resolve("Success") }
        const mockStep2 = { name: "Step 2", execute: () => Promise.reject(new Error("Failure")) }
        const mockStep3 = { name: "Step 3", execute: () => Promise.resolve("Should not run") }

        const orchestrator = new WorkflowOrchestrator([mockStep1, mockStep2, mockStep3])

        await orchestrator.run()

        expect(orchestrator.getStatus()).toBe("FAILED")
    })

    it("should correctly manage state when running an asynchronous polling step", async () => {
        const mockAsyncStep = {
            name: "Async Step",
            asyncExecute: async (context) => {
                // Simulate polling logic
                await new Promise(resolve => setTimeout(resolve, 10))
                return { success: true, data: "Poll Success", pollIntervalMs: 100 };
            }
        }

        const orchestrator = new WorkflowOrchestrator([mockAsyncStep])

        await orchestrator.run()

        expect(orchestrator.getStatus()).toBe("COMPLETED")
    })
})