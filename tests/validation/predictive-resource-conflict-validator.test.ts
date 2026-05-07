import { describe, it, expect } from "vitest"
import { PredictiveResourceConflictValidator } from "../src/validation/predictive-resource-conflict-validator"

describe("PredictiveResourceConflictValidator", () => {
    it("should detect a resource conflict when cumulative CPU usage exceeds the limit", () => {
        const validator = new PredictiveResourceConflictValidator()
        const plan: PlanStep[] = [
            { startTime: 0, duration: 10, resources: { cpu: 3, memory: 1 }, description: "Step A" },
            { startTime: 5, duration: 10, resources: { cpu: 5, memory: 1 }, description: "Step B" },
        ]
        const limits: ResourceLimits = { maxCpu: 7, maxMemory: 5 }
        const report = validator.validate(plan, limits)

        expect(report.hasConflict).toBe(true)
        expect(report.conflicts).toHaveLength(1)
        const cpuConflict = report.conflicts.find(c => c.resource === "CPU")
        expect(cpuConflict).toBeDefined()
        expect(cpuConflict!.exceededAmount).toBe(8)
        expect(cpuConflict!.limit).toBe(7)
    })

    it("should detect a resource conflict when cumulative Memory usage exceeds the limit", () => {
        const validator = new PredictiveResourceConflictValidator()
        const plan: PlanStep[] = [
            { startTime: 0, duration: 10, resources: { cpu: 1, memory: 2 }, description: "Step A" },
            { startTime: 0, duration: 10, resources: { cpu: 1, memory: 4 }, description: "Step B" },
        ]
        const limits: ResourceLimits = { maxCpu: 5, maxMemory: 5 }
        const report = validator.validate(plan, limits)

        expect(report.hasConflict).toBe(true)
        expect(report.conflicts).toHaveLength(1)
        const memoryConflict = report.conflicts.find(c => c.resource === "Memory")
        expect(memoryConflict).toBeDefined()
        expect(memoryConflict!.exceededAmount).toBe(6)
        expect(memoryConflict!.limit).toBe(5)
    })

    it("should report no conflict when all resource usages are within limits", () => {
        const validator = new PredictiveResourceConflictValidator()
        const plan: PlanStep[] = [
            { startTime: 0, duration: 10, resources: { cpu: 2, memory: 1 }, description: "Step A" },
            { startTime: 15, duration: 10, resources: { cpu: 3, memory: 2 }, description: "Step B" },
        ]
        const limits: ResourceLimits = { maxCpu: 5, maxMemory: 5 }
        const report = validator.validate(plan, limits)

        expect(report.hasConflict).toBe(false)
        expect(report.conflicts).toHaveLength(0)
    })
})