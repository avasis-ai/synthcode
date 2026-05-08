import { describe, it, expect } from "vitest";
import { ExternalApiContractManager } from "../service/external-api-contract-manager.js";

describe("ExternalApiContractManager", () => {
    it("should initialize correctly with a list of contracts", () => {
        const mockContract = {
            endpoint: "test-endpoint",
            schema: (payload) => ({ isValid: true, errors: [] }),
            versionRange: { min: 1, max: 5 },
            fallback: (payload) => ({ status: "ok" }),
        };
        const manager = new ExternalApiContractManager([mockContract]);
        expect(manager).toBeInstanceOf(ExternalApiContractManager);
    });

    it("should validate a payload against the correct contract schema", () => {
        const mockContract = {
            endpoint: "test-endpoint",
            schema: (payload) => ({ isValid: true, errors: [] }),
            versionRange: { min: 1, max: 5 },
            fallback: (payload) => ({ status: "ok" }),
        };
        const manager = new ExternalApiContractManager([mockContract]);
        const payload = { key: "value" };
        const validationResult = manager.validatePayload(payload, "test-endpoint");
        expect(validationResult).toEqual({ isValid: true, errors: [] });
    });

    it("should use the fallback mechanism if validation fails or contract is missing", () => {
        const mockContract = {
            endpoint: "test-endpoint",
            schema: (payload) => ({ isValid: false, errors: ["Invalid payload"] }),
            versionRange: { min: 1, max: 5 },
            fallback: (payload) => ({ status: "fallback", original: payload }),
        };
        const manager = new ExternalApiContractManager([mockContract]);
        const payload = { key: "value" };

        // Test validation failure
        const validationResult = manager.validatePayload(payload, "test-endpoint");
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain("Invalid payload");

        // Test fallback usage (assuming a method that triggers fallback, e.g., process)
        const processedResult = manager.processPayload(payload, "test-endpoint");
        expect(processedResult).toEqual({ status: "fallback", original: payload });
    });
});