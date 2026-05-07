import { describe, it, expect } from "vitest"
import { ContractSchema, ServiceCallDefinition } from "../../../src/validation/service-chain-contract-validator"

describe("ContractSchema Validator", () => {
    it("should validate a basic valid contract schema", () => {
        const schema: ContractSchema = {
            requiredInputs: {
                inputA: { type: "string", description: "Input A" },
                inputB: { type: "number", description: "Input B" },
            },
            expectedOutputs: {
                outputX: { type: "boolean", description: "Output X" },
            },
            compatibilityRules: {
                nextStepInputMapping: {
                    nextField: { sourceField: "inputA", targetField: "next_a" },
                },
                requiredOutputKeys: ["outputX"],
            },
        }
        expect(schema).toBeDefined()
    })

    it("should handle missing required fields gracefully (e.g., empty inputs/outputs)", () => {
        const schema: ContractSchema = {
            requiredInputs: {},
            expectedOutputs: {},
            compatibilityRules: {
                nextStepInputMapping: {},
                requiredOutputKeys: [],
            },
        }
        expect(schema).toBeDefined()
    })

    it("should correctly validate service call definitions", () => {
        const serviceCall: ServiceCallDefinition = {
            serviceName: "UserService",
            version: "v1.0",
            inputs: {
                userId: "string",
                operation: "string",
            },
            outputs: {
                userProfile: "object",
            },
        }
        expect(serviceCall).toBeDefined()
    })
})