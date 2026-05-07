import { describe, it, expect } from "vitest"
import { ResourceContentionSimulator } from "../src/simulation/resource-contention-simulator.js"

describe("ResourceContentionSimulator", () => {
    it("should correctly calculate resource availability and detect simple contention", () => {
        const simulator = new ResourceContentionSimulator({
            initialState: {
                availableCapacity: { "CPU": 10, "Memory": 50 },
                totalCapacity: { "CPU": 10, "Memory": 50 },
            },
            resourceTypes: ["CPU", "Memory"],
        })

        const action1: any = {
            name: "Task A",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 5, startTime: 0, endTime: 10 },
                { resourceId: "Memory", resourceType: "Memory", quantity: 10, startTime: 0, endTime: 10 },
            ],
        }

        const action2: any = {
            name: "Task B",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 6, startTime: 5, endTime: 15 }, // Overlaps with Task A
                { resourceId: "Memory", resourceType: "Memory", quantity: 5, startTime: 5, endTime: 15 },
            ],
        }

        const report1 = simulator.simulate(action1, action2)

        // Check if contention is detected for CPU
        expect(report1.contentionDetected).toBe(true)
        expect(report1.contentionDetails.CPU).toBeDefined()
        expect(report1.contentionDetails.CPU).toContain("Task A and Task B overlap in CPU usage")
    })

    it("should handle non-overlapping actions without contention", () => {
        const simulator = new ResourceContentionSimulator({
            initialState: {
                availableCapacity: { "CPU": 20, "Memory": 100 },
                totalCapacity: { "CPU": 20, "Memory": 100 },
            },
            resourceTypes: ["CPU", "Memory"],
        })

        const action1: any = {
            name: "Task A",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 5, startTime: 0, endTime: 5 },
            ],
        }

        const action2: any = {
            name: "Task B",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 8, startTime: 6, endTime: 10 }, // Starts after Task A ends
            ],
        }

        const report = simulator.simulate(action1, action2)

        expect(report.contentionDetected).toBe(false)
        expect(report.contentionDetails).toEqual({})
    })

    it("should correctly report insufficient capacity if total capacity is exceeded", () => {
        const simulator = new ResourceContentionSimulator({
            initialState: {
                availableCapacity: { "CPU": 10, "Memory": 10 },
                totalCapacity: { "CPU": 10, "Memory": 10 },
            },
            resourceTypes: ["CPU", "Memory"],
        })

        const action1: any = {
            name: "Task A",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 8, startTime: 0, endTime: 10 },
            ],
        }

        const action2: any = {
            name: "Task B",
            resourceRequirements: [
                { resourceId: "CPU", resourceType: "CPU", quantity: 5, startTime: 0, endTime: 10 }, // Total required: 8 + 5 = 13 > 10
            ],
        }

        const report = simulator.simulate(action1, action2)

        expect(report.contentionDetected).toBe(true)
        expect(report.contentionDetails.CPU).toContain("Exceeds total capacity")
    })
})