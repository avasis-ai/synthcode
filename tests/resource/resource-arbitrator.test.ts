import { describe, it, expect } from "vitest"
import { ResourceArbitrator } from "../src/resource/resource-arbitrator"

describe("ResourceArbitrator", () => {
    it("should grant resources when sufficient capacity is available", () => {
        const initialUsage = {
            "resourceA": 10,
            "resourceB": 5,
        }
        const arbitrator = new ResourceArbitrator(initialUsage)

        const request1: ResourceRequest = {
            requestId: "req1",
            resourceId: "resourceA",
            requiredAmount: 5,
            priority: 1,
            stepId: "step1",
        }
        const request2: ResourceRequest = {
            requestId: "req2",
            resourceId: "resourceB",
            requiredAmount: 2,
            priority: 2,
            stepId: "step2",
        }

        const result = arbitrator.arbitrate([request1, request2])

        expect(result.plan.length).toBe(2)
        expect(result.plan.find(g => g.request.requestId === "req1")?.isGranted).toBe(true)
        expect(result.plan.find(g => g.request.requestId === "req2")?.isGranted).toBe(true)
        expect(result.updatedUsage["resourceA"]).toBe(15)
        expect(result.updatedUsage["resourceB"]).toBe(7)
    })

    it("should deny resources when capacity is insufficient", () => {
        const initialUsage = {
            "resourceA": 10,
            "resourceB": 5,
        }
        const arbitrator = new ResourceArbitrator(initialUsage)

        const request1: ResourceRequest = {
            requestId: "req1",
            resourceId: "resourceA",
            requiredAmount: 15, // Exceeds capacity
            priority: 1,
            stepId: "step1",
        }
        const request2: ResourceRequest = {
            requestId: "req2",
            resourceId: "resourceB",
            requiredAmount: 1,
            priority: 2,
            stepId: "step2",
        }

        const result = arbitrator.arbitrate([request1, request2])

        expect(result.plan.length).toBe(2)
        expect(result.plan.find(g => g.request.requestId === "req1")?.isGranted).toBe(false)
        expect(result.plan.find(g => g.request.requestId === "req2")?.isGranted).toBe(true)
        expect(result.updatedUsage["resourceA"]).toBe(10) // Should remain unchanged
        expect(result.updatedUsage["resourceB"]).toBe(6) // Updated by req2
    })

    it("should prioritize requests correctly when multiple resources are constrained", () => {
        const initialUsage = {
            "resourceA": 10,
            "resourceB": 10,
        }
        const arbitrator = new ResourceArbitrator(initialUsage)

        const request1: ResourceRequest = {
            requestId: "req1",
            resourceId: "resourceA",
            requiredAmount: 6,
            priority: 1, // Highest priority
            stepId: "step1",
        }
        const request2: ResourceRequest = {
            requestId: "req2",
            resourceId: "resourceA",
            requiredAmount: 5,
            priority: 2,
            stepId: "step2",
        }
        const request3: ResourceRequest = {
            requestId: "req3",
            resourceId: "resourceB",
            requiredAmount: 15, // Too much
            priority: 3,
            stepId: "step3",
        }

        // Order: req1 (P1), req2 (P2), req3 (P3)
        const requests = [request1, request2, request3]

        const result = arbitrator.arbitrate(requests)

        // req1 (P1) should pass (10 - 6 = 4 remaining)
        expect(result.plan.find(g => g.request.requestId === "req1")?.isGranted).toBe(true)
        // req2 (P2) should pass (4 - 5 = -1, wait, this logic needs to handle sequential checks)
        // Assuming the arbitrator processes in priority order (P1, P2, P3)
        // After req1: resourceA usage = 6. Remaining = 4.
        // req2 needs 5. Should fail.
        expect(result.plan.find(g => g.request.requestId === "req2")?.isGranted).toBe(false)
        // req3 needs 15. Should fail immediately.
        expect(result.plan.find(g => g.request.requestId === "req3")?.isGranted).toBe(false)

        // Final usage: resourceA = 6 (only updated by req1)
        expect(result.updatedUsage["resourceA"]).toBe(16)
        expect(result.updatedUsage["resourceB"]).toBe(10)
    })
})