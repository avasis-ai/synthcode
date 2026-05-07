import { describe, it, expect } from "vitest"
import { ResourceConflictMediator, ResourceRequest } from "../src/resource/resource-conflict-mediator.js"

describe("ResourceConflictMediator", () => {
    it("should successfully allocate resources when capacity is sufficient", () => {
        const mediator = new ResourceConflictMediator({
            totalCapacity: {
                cpu: 10,
                memory: 20,
            },
        })
        const request1: ResourceRequest = {
            resourceType: "cpu",
            requiredAmount: 3,
            duration: 5,
            priority: 1,
        }
        const request2: ResourceRequest = {
            resourceType: "memory",
            requiredAmount: 10,
            duration: 2,
            priority: 2,
        }

        const plan = mediator.mediate([request1, request2])

        expect(plan.successfulAllocations.length).toBe(2)
        expect(plan.rejectedRequests.length).toBe(0)
        expect(plan.totalResourcesUsed.cpu).toBe(3)
        expect(plan.totalResourcesUsed.memory).toBe(10)
    })

    it("should reject requests when capacity is insufficient", () => {
        const mediator = new ResourceConflictMediator({
            totalCapacity: {
                cpu: 5,
                memory: 5,
            },
        })
        const request1: ResourceRequest = {
            resourceType: "cpu",
            requiredAmount: 6,
            duration: 1,
            priority: 1,
        }
        const request2: ResourceRequest = {
            resourceType: "memory",
            requiredAmount: 1,
            duration: 1,
            priority: 2,
        }

        const plan = mediator.mediate([request1, request2])

        expect(plan.successfulAllocations.length).toBe(1)
        expect(plan.rejectedRequests.length).toBe(1)
        expect(plan.successfulAllocations[0].resourceType).toBe("memory")
        expect(plan.rejectedRequests[0].resourceType).toBe("cpu")
    })

    it("should handle mixed requests prioritizing higher priority ones", () => {
        const mediator = new ResourceConflictMediator({
            totalCapacity: {
                cpu: 10,
                memory: 10,
            },
        })
        const requestLowPriority: ResourceRequest = {
            resourceType: "cpu",
            requiredAmount: 8,
            duration: 1,
            priority: 1,
        }
        const requestHighPriority: ResourceRequest = {
            resourceType: "cpu",
            requiredAmount: 5,
            duration: 1,
            priority: 5,
        }
        const requestMediumPriority: ResourceRequest = {
            resourceType: "cpu",
            requiredAmount: 3,
            duration: 1,
            priority: 3,
        }

        // Order: Low (P1), High (P5), Medium (P3)
        // Expected order of processing: High (P5), Medium (P3), Low (P1)
        const requests = [requestLowPriority, requestHighPriority, requestMediumPriority]
        const plan = mediator.mediate(requests)

        expect(plan.successfulAllocations.length).toBe(3)
        expect(plan.rejectedRequests.length).toBe(0)
        expect(plan.totalResourcesUsed.cpu).toBe(16)
    })
})