import { describe, it, expect } from "vitest"
import { generateToolCompatibilityMatrix } from "../src/compatibility/tool-compatibility-matrix-generator"

describe("generateToolCompatibilityMatrix", () => {
    it("should generate a compatible matrix for two compatible tools", () => {
        const toolA = {
            name: "ToolA",
            description: "A tool for task A",
            inputs: {
                user_id: "string",
                task_id: "string",
            },
            outputs: {
                result: "string",
            },
            requiredCapabilities: [
                { name: "read_user", description: "Reads user data" },
                { name: "execute_task", description: "Executes a task" },
            ],
            resourceUsage: "database:read",
        }
        const toolB = {
            name: "ToolB",
            description: "A tool for task B",
            inputs: {
                user_id: "string",
                task_id: "string",
            },
            outputs: {
                status: "string",
            },
            requiredCapabilities: [
                { name: "read_user", description: "Reads user data" },
                { name: "write_data", description: "Writes data" },
            ],
            resourceUsage: "database:write",
        }

        const matrix = generateToolCompatibilityMatrix(toolA, toolB)

        expect(matrix).toBeDefined()
        expect(matrix.compatibilityStatus).toBe("Compatible")
        expect(matrix.resourceUsageConflict).toBe(false)
        expect(matrix.capabilityConflict).toBe(false)
    })

    it("should detect a resource overlap warning between two tools", () => {
        const toolA = {
            name: "ToolA",
            description: "A tool using resource X",
            inputs: {},
            outputs: {},
            requiredCapabilities: [{ name: "read_user", description: "Reads user data" }],
            resourceUsage: "database:read",
        }
        const toolB = {
            name: "ToolB",
            description: "A tool using resource X",
            inputs: {},
            outputs: {},
            requiredCapabilities: [{ name: "read_user", description: "Reads user data" }],
            resourceUsage: "database:read",
        }

        const matrix = generateToolCompatibilityMatrix(toolA, toolB)

        expect(matrix).toBeDefined()
        expect(matrix.compatibilityStatus).toBe("Warning: Resource Overlap")
        expect(matrix.resourceUsageConflict).toBe(true)
        expect(matrix.capabilityConflict).toBe(false)
    })

    it("should detect a capability conflict when tools require different capabilities", () => {
        const toolA = {
            name: "ToolA",
            description: "Tool requiring capability X",
            inputs: {},
            outputs: {},
            requiredCapabilities: [{ name: "read_user", description: "Reads user data" }],
            resourceUsage: "network:read",
        }
        const toolB = {
            name: "ToolB",
            description: "Tool requiring capability Y",
            inputs: {},
            outputs: {},
            requiredCapabilities: [{ name: "write_data", description: "Writes data" }],
            resourceUsage: "network:write",
        }

        const matrix = generateToolCompatibilityMatrix(toolA, toolB)

        expect(matrix).toBeDefined()
        expect(matrix.compatibilityStatus).toBe("Compatible")
        expect(matrix.resourceUsageConflict).toBe(false)
        expect(matrix.capabilityConflict).toBe(false)
    })
})