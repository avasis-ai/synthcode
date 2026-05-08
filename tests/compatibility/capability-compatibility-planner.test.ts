import { describe, it, expect } from "vitest"
import { CapabilityCompatibilityPlanner } from "../src/compatibility/capability-compatibility-planner.js"
import { Capability, CapabilityRegistry, DesiredCapability, Conflict } from "../src/compatibility/types.js"

describe("CapabilityCompatibilityPlanner", () => {
    it("should generate a valid plan when all desired capabilities are available", () => {
        const mockRegistry: CapabilityRegistry = {
            getCapability: (id: string): Capability | undefined => {
                if (id === "cap-a") {
                    return { id: "cap-a", version: "1.0.0", description: "A" }
                }
                if (id === "cap-b") {
                    return { id: "cap-b", version: "2.0.0", description: "B" }
                }
                return undefined
            }
        }
        const desiredCapabilities: DesiredCapability[] = [
            { id: "cap-a", minVersion: "1.0.0" },
            { id: "cap-b", minVersion: "2.0.0" }
        ]
        const planner = new CapabilityCompatibilityPlanner(desiredCapabilities, mockRegistry)
        const plan = planner.plan()

        expect(plan).toBeDefined()
        expect(plan!.plan).toHaveLength(2)
        expect(plan!.plan.every(p => p.capabilityId)).toBe(true)
    })

    it("should detect and handle version conflicts", () => {
        const mockRegistry: CapabilityRegistry = {
            getCapability: (id: string): Capability | undefined => {
                if (id === "cap-a") {
                    return { id: "cap-a", version: "1.5.0", description: "A" }
                }
                if (id === "cap-b") {
                    return { id: "cap-b", version: "1.0.0", description: "B" }
                }
                return undefined
            }
        }
        const desiredCapabilities: DesiredCapability[] = [
            { id: "cap-a", minVersion: "1.0.0" },
            { id: "cap-b", minVersion: "2.0.0" }
        ]
        const planner = new CapabilityCompatibilityPlanner(desiredCapabilities, mockRegistry)
        const plan = planner.plan()

        expect(plan).toBeDefined()
        expect(plan!.conflict).toBeInstanceOf(Conflict)
        expect(plan!.conflict!.message).toContain("cap-b")
    })

    it("should return null plan if a required capability is missing", () => {
        const mockRegistry: CapabilityRegistry = {
            getCapability: (id: string): Capability | undefined => {
                if (id === "cap-a") {
                    return { id: "cap-a", version: "1.0.0", description: "A" }
                }
                return undefined
            }
        }
        const desiredCapabilities: DesiredCapability[] = [
            { id: "cap-a", minVersion: "1.0.0" },
            { id: "cap-missing", minVersion: "1.0.0" }
        ]
        const planner = new CapabilityCompatibilityPlanner(desiredCapabilities, mockRegistry)
        const plan = planner.plan()

        expect(plan).toBeDefined()
        expect(plan!.plan).toHaveLength(1)
        expect(plan!.conflict).toBeNull()
    })
})