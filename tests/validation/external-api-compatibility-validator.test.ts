import { describe, it, expect } from "vitest"
import { ExternalApiCompatibilityValidator } from "../src/validation/external-api-compatibility-validator.js"

describe("ExternalApiCompatibilityValidator", () => {
    it("should report compatibility when all aspects match the contract", () => {
        const validator = new ExternalApiCompatibilityValidator()
        const apiCall = {
            endpoint: "users",
            version: "v1",
            payload: { name: "John", age: 30 },
            headers: { "Authorization": "Bearer token" },
            params: { id: 1 }
        }
        const contract = {
            endpoint: "users",
            version: "v1",
            schema: {
                name: { required: true, type: "string" },
                age: { required: false, type: "number" }
            },
            requiredHeaders: { "Authorization": "Bearer token" },
            allowedParams: { id: true }
        }

        const report = validator.validate(apiCall, contract)
        expect(report.isCompatible).toBe(true)
        expect(report.issues).toEqual([])
    })

    it("should report incompatibility when payload fields are missing or incorrect", () => {
        const validator = new ExternalApiCompatibilityValidator()
        const apiCall = {
            endpoint: "users",
            version: "v1",
            payload: { age: 25 }, // Missing required 'name'
            headers: { "Authorization": "Bearer token" },
            params: { id: 2 }
        }
        const contract = {
            endpoint: "users",
            version: "v1",
            schema: {
                name: { required: true, type: "string" },
                age: { required: false, type: "number" }
            },
            requiredHeaders: { "Authorization": "Bearer token" },
            allowedParams: { id: true }
        }

        const report = validator.validate(apiCall, contract)
        expect(report.isCompatible).toBe(false)
        expect(report.issues).toContain("Payload validation failed: Missing required field 'name'")
    })

    it("should report incompatibility when headers or parameters are incorrect", () => {
        const validator = new ExternalApiCompatibilityValidator()
        const apiCall = {
            endpoint: "users",
            version: "v1",
            payload: { name: "Jane", age: 30 },
            headers: { "Authorization": "Bearer token", "X-Custom": "value" }, // Extra header
            params: { id: 3, extraParam: "test" } // Extra parameter
        }
        const contract = {
            endpoint: "users",
            version: "v1",
            schema: {
                name: { required: true, type: "string" },
                age: { required: false, type: "number" }
            },
            requiredHeaders: { "Authorization": "Bearer token" },
            allowedParams: { id: true }
        }

        const report = validator.validate(apiCall, contract)
        expect(report.isCompatible).toBe(false)
        expect(report.issues).toContain("Header validation failed: Found unexpected header 'X-Custom'")
        expect(report.issues).toContain("Parameter validation failed: Found unexpected parameter 'extraParam'")
    })
})