import { describe, it, expect, vi } from "vitest"
import { ServiceDescriptor, WorkflowStep } from "../src/orchestration/service-orchestrator"
import { executeWorkflow } from "../src/orchestration/service-orchestrator"

describe("executeWorkflow", () => {
    it("should execute a simple workflow successfully", async () => {
        const mockServiceA: ServiceDescriptor = {
            name: "ServiceA",
            endpoint: "/a",
            auth: (data) => ({ ...data, authKey: "A" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }
        const mockServiceB: ServiceDescriptor = {
            name: "ServiceB",
            endpoint: "/b",
            auth: (data) => ({ ...data, authKey: "B" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }

        const mockWorkflow: WorkflowStep[] = [
            { descriptor: mockServiceA, inputMapper: (state) => ({ inputA: "dataA" }) },
            { descriptor: mockServiceB, inputMapper: (state) => ({ inputB: "dataB" }) },
        ]

        const mockServiceCall = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ resultA: "SuccessA", resultB: "SuccessB" }),
        })

        const result = await executeWorkflow(mockWorkflow, {})

        expect(mockServiceCall).toHaveBeenCalledTimes(2)
        expect(result).toEqual({ resultA: "SuccessA", resultB: "SuccessB" })
    })

    it("should handle service failures and stop execution", async () => {
        const mockServiceA: ServiceDescriptor = {
            name: "ServiceA",
            endpoint: "/a",
            auth: (data) => ({ ...data, authKey: "A" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }
        const mockServiceB: ServiceDescriptor = {
            name: "ServiceB",
            endpoint: "/b",
            auth: (data) => ({ ...data, authKey: "B" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }

        const mockWorkflow: WorkflowStep[] = [
            { descriptor: mockServiceA, inputMapper: (state) => ({ inputA: "dataA" }) },
            { descriptor: mockServiceB, inputMapper: (state) => ({ inputB: "dataB" }) },
        ]

        // Mock fetch to fail on the second call (ServiceB)
        const mockServiceCall = vi.spyOn(global, "fetch").mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: async () => ({ resultA: "SuccessA" }),
        })).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Service B failed" }),
        })

        const result = await executeWorkflow(mockWorkflow, {})

        expect(result).toEqual({ resultA: "SuccessA" })
        expect(mockServiceCall).toHaveBeenCalledTimes(2)
    })

    it("should pass state from one step to the next", async () => {
        const mockServiceA: ServiceDescriptor = {
            name: "ServiceA",
            endpoint: "/a",
            auth: (data) => ({ ...data, authKey: "A" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }
        const mockServiceB: ServiceDescriptor = {
            name: "ServiceB",
            endpoint: "/b",
            auth: (data) => ({ ...data, authKey: "B" }),
            retryPolicy: { maxAttempts: 1, initialDelayMs: 10, multiplier: 2 },
            circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 },
        }

        const mockWorkflow: WorkflowStep[] = [
            { descriptor: mockServiceA, inputMapper: (state) => ({ initialInput: "dataA" }) },
            { descriptor: mockServiceB, inputMapper: (state) => ({ inputB: state.resultA }) },
        ]

        // Mock fetch to simulate successful calls
        const mockServiceCall = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ resultA: "SuccessA", resultB: "SuccessB" }),
        })

        const result = await executeWorkflow(mockWorkflow, {})

        expect(result).toEqual({ resultA: "SuccessA", resultB: "SuccessB" })
    })
})