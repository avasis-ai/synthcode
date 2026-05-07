import { describe, it, expect } from "vitest"
import { ResourceContentionMediator } from "../src/resource/resource-contention-mediator"

describe("ResourceContentionMediator", () => {
    it("should successfully allocate resources when capacity is sufficient and prioritize based on weighted score", async () => {
        const mediator = new ResourceContentionMediator()
        const availableResources: AvailableResources = {
            totalCapacity: {
                cpu: 100,
                memory: 200,
                gpu: 5
            }
        }

        const request1: ResourceRequest = {
            id: "req1",
            name: "HighPriorityService",
            predictedUsage: { cpu: 50, memory: 100, gpu: 2 },
            priority: 0.9,
            costSensitivity: 0.1,
            requiredResources: { cpu: 40, memory: 50, gpu: 1 }
        }
        const request2: ResourceRequest = {
            id: "req2",
            name: "LowPriorityService",
            predictedUsage: { cpu: 20, memory: 50, gpu: 0 },
            priority: 0.3,
            costSensitivity: 0.8,
            requiredResources: { cpu: 10, memory: 20, gpu: 0 }
        }

        const allocationPlan = await mediator.planAllocation(
            availableResources,
            [request1, request2]
        )

        expect(allocationPlan.status).toBe("SUCCESS")
        expect(allocationPlan.allocatedResources.length).toBe(2)
        // Check if the higher priority request (req1) received its full allocation
        const allocatedReq1 = allocationPlan.allocatedResources.find(a => a.requestId === "req1")
        expect(allocatedReq1?.grantedResources).toEqual({ cpu: 40, memory: 50, gpu: 1 })
    })

    it("should return CONFLICT status if total required resources exceed available capacity", async () => {
        const mediator = new ResourceContentionMediator()
        const availableResources: AvailableResources = {
            totalCapacity: {
                cpu: 50,
                memory: 100,
                gpu: 1
            }
        }

        const request1: ResourceRequest = {
            id: "req1",
            name: "HighPriorityService",
            predictedUsage: { cpu: 30, memory: 50, gpu: 1 },
            priority: 0.9,
            costSensitivity: 0.1,
            requiredResources: { cpu: 30, memory: 50, gpu: 1 }
        }
        const request2: ResourceRequest = {
            id: "req2",
            name: "LowPriorityService",
            predictedUsage: { cpu: 30, memory: 50, gpu: 1 },
            priority: 0.3,
            costSensitivity: 0.8,
            requiredResources: { cpu: 30, memory: 50, gpu: 1 }
        }

        // Total required CPU: 30 + 30 = 60. Available CPU: 50.
        const allocationPlan = await mediator.planAllocation(
            availableResources,
            [request1, request2]
        )

        expect(allocationPlan.status).toBe("CONFLICT")
        expect(allocationPlan.allocatedResources.length).toBe(0)
    })

    it("should return THROTTLED status and allocate resources based on weighted score when capacity is limited", async () => {
        const mediator = new ResourceContentionMediator()
        const availableResources: AvailableResources = {
            totalCapacity: {
                cpu: 60,
                memory: 100,
                gpu: 2
            }
        }

        const request1: ResourceRequest = {
            id: "req1",
            name: "HighPriorityService",
            predictedUsage: { cpu: 30, memory: 50, gpu: 1 },
            priority: 0.9,
            costSensitivity: 0.1,
            requiredResources: { cpu: 30, memory: 50, gpu: 1 }
        }
        const request2: ResourceRequest = {
            id: "req2",
            name: "LowPriorityService",
            predictedUsage: { cpu: 35, memory: 50, gpu: 1 },
            priority: 0.3,
            costSensitivity: 0.8,
            requiredResources: { cpu: 35, memory: 50, gpu: 1 }
        }

        // Total required CPU: 30 + 35 = 65. Available CPU: 60. Conflict, but should throttle.
        // Weight calculation: req1 (0.9 * 0.9 + 0.1 * 0.1) = 0.81 + 0.01 = 0.82
        // Weight calculation: req2 (0.3 * 0.9 + 0.8 * 0.1) = 0.27 + 0.08 = 0.35
        // req1 should be prioritized.

        const allocationPlan = await mediator.planAllocation(
            availableResources,
            [request1, request2]
        )

        expect(allocationPlan.status).toBe("THROTTLED")
        expect(allocationPlan.allocatedResources.length).toBe(2)
        
        // Check if req1 got its full allocation
        const allocatedReq1 = allocationPlan.allocatedResources.find(a => a.requestId === "req1")
        expect(allocatedReq1?.grantedResources).toEqual({ cpu: 30, memory: 50, gpu: 1 })

        // Check if req2 got a partial allocation (CPU: 60 - 30 = 30)
        const allocatedReq2 = allocationPlan.allocatedResources.find(a => a.requestId === "req2")
        expect(allocatedReq2?.grantedResources).toEqual({ cpu: 30, memory: 50, gpu: 1 })
    })
})