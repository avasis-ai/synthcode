import { describe, it, expect } from "vitest"
import { CapabilityContract, ResourceAgreement, SideEffectDeclaration } from "../src/contract/capability-contract-enforcer.js"

describe("CapabilityContract", () => {
    it("should correctly validate a basic contract structure", () => {
        const contract: CapabilityContract = {
            schema: {
                user: {
                    id: "string",
                    email: "string"
                }
            },
            requiredResources: [
                {
                    resourceName: "User",
                    requiredBy: "A",
                    minVersion: "1.0.0",
                    maxVersion: "2.0.0"
                }
            ],
            sideEffects: [
                {
                    effectName: "UpdateUser",
                    description: "Updates user details",
                    isIdempotent: true,
                    requiresPermission: "user:write"
                }
            ]
        }
        expect(contract.schema).toBeDefined()
        expect(contract.requiredResources).toHaveLength(1)
        expect(contract.sideEffects).toHaveLength(1)
    })

    it("should handle multiple required resources and side effects", () => {
        const contract: CapabilityContract = {
            schema: {},
            requiredResources: [
                {
                    resourceName: "Product",
                    requiredBy: "A",
                    minVersion: "1.0.0",
                    maxVersion: "3.0.0"
                },
                {
                    resourceName: "Inventory",
                    requiredBy: "B",
                    minVersion: "2.1.0",
                    maxVersion: "2.5.0"
                }
            ],
            sideEffects: [
                {
                    effectName: "CreateProduct",
                    description: "Creates a new product",
                    isIdempotent: false,
                    requiresPermission: "product:create"
                },
                {
                    effectName: "CheckStock",
                    description: "Checks current stock levels",
                    isIdempotent: true,
                    requiresPermission: "inventory:read"
                }
            ]
        }
        expect(contract.requiredResources).toHaveLength(2)
        expect(contract.sideEffects).toHaveLength(2)
        expect(contract.requiredResources[0].resourceName).toBe("Product")
        expect(contract.sideEffects[1].requiresPermission).toBe("inventory:read")
    })

    it("should validate an empty contract structure", () => {
        const contract: CapabilityContract = {
            schema: {},
            requiredResources: [],
            sideEffects: []
        }
        expect(contract.schema).toEqual({})
        expect(contract.requiredResources).toEqual([])
        expect(contract.sideEffects).toEqual([])
    })
})