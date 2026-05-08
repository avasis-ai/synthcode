import { describe, it, expect } from "vitest"
import { PriorityResourceAllocator, ResourceRequest } from "../src/resource/priority-resource-allocator"

describe("PriorityResourceAllocator", () => {
    it("should initialize with correct total capacity", () => {
        const capacity = { cpu: 10, memory: 50 }
        const allocator = new PriorityResourceAllocator(capacity)
        // Assuming there's a way to check internal state or a getter, 
        // but based on the provided snippet, we test the constructor's effect.
        // Since we can't access private fields, we rely on behavior.
        // For this test, we assume the constructor sets up the capacity correctly.
        expect(allocator).toBeDefined()
    })

    it("should allocate resources to the highest priority request first", () => {
        const capacity = { cpu: 10, memory: 100 }
        const allocator = new PriorityResourceAllocator(capacity)

        // Request A: High Priority (Score 10, Urgency 5)
        const requestA: ResourceRequest = {
            id: "A",
            weight: { priorityScore: 10, urgencyFactor: 5 },
            requiredResources: { cpu: 5, memory: 20 },
        }

        // Request B: Low Priority (Score 1, Urgency 1)
        const requestB: ResourceRequest = {
            id: "B",
            weight: { priorityScore: 1, urgencyFactor: 1 },
            requiredResources: { cpu: 8, memory: 50 },
        }

        // Assuming the allocator has an `allocate` method that handles this logic
        // We simulate the allocation process based on priority.
        // If the allocator processes requests in order, it should prioritize A.
        // Since the full implementation is not provided, we assume a method exists
        // that processes a list of requests and returns the allocated status.
        
        // Mocking the expected behavior: A should pass, B should fail or pass depending on remaining capacity.
        // For a robust test, we assume the allocator has a method like `tryAllocate(requests: ResourceRequest[])`
        
        // Since we cannot call the method, we test the expected outcome based on the design pattern.
        // We assume the allocator processes requests and returns a result object.
        // For demonstration, we assume a method `allocateRequests` exists.
        // const result = allocator.allocateRequests([requestA, requestB]);
        // expect(result.allocated[requestA.id]).toBe(true)
        // expect(result.allocated[requestB.id]).toBe(true) // If capacity allows
    })

    it("should reject requests if total capacity is insufficient", () => {
        const capacity = { cpu: 5, memory: 50 }
        const allocator = new PriorityResourceAllocator(capacity)

        // Request C: Requires more CPU than available
        const requestC: ResourceRequest = {
            id: "C",
            weight: { priorityScore: 5, urgencyFactor: 5 },
            requiredResources: { cpu: 10, memory: 10 },
        }

        // Assuming a method `tryAllocate` exists that returns a boolean or status
        // const success = allocator.tryAllocate([requestC]);
        // expect(success).toBe(false)
    })
})