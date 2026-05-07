import { describe, it, expect, vi } from "vitest";
import { ServiceContract } from "../src/contract/service-contract-registry";

describe("ServiceContract", () => {
    it("should correctly initialize with service details and schemas", () => {
        const serviceId = "test-service";
        const version = "v1.0";
        const inputSchema: any = { type: "object", properties: { name: { type: "string" } } };
        const outputSchema: any = { type: "object", properties: { result: { type: "string" } } };
        const compatibilityRules: string[] = ["rule1", "rule2"];

        const contract = new ServiceContract(
            serviceId,
            version,
            inputSchema,
            outputSchema,
            compatibilityRules
        );

        expect(contract.getServiceId()).toBe(serviceId);
        expect(contract.getVersion()).toBe(version);
        expect(contract.getInputSchema()).toEqual(inputSchema);
        expect(contract.getOutputSchema()).toEqual(outputSchema);
        expect(contract.getCompatibilityRules()).toEqual(compatibilityRules);
    });

    it("should handle empty or minimal schemas correctly", () => {
        const serviceId = "minimal-service";
        const version = "v0.1";
        const inputSchema: any = {};
        const outputSchema: any = {};
        const compatibilityRules: string[] = [];

        const contract = new ServiceContract(
            serviceId,
            version,
            inputSchema,
            outputSchema,
            compatibilityRules
        );

        expect(contract.getServiceId()).toBe(serviceId);
        expect(contract.getVersion()).toBe(version);
        expect(contract.getInputSchema()).toEqual(inputSchema);
        expect(contract.getOutputSchema()).toEqual(outputSchema);
        expect(contract.getCompatibilityRules()).toEqual(compatibilityRules);
    });

    it("should throw an error if serviceId is missing", () => {
        const inputSchema: any = {};
        const outputSchema: any = {};
        const compatibilityRules: string[] = [];

        expect(() => {
            new ServiceContract(
                "",
                "v1.0",
                inputSchema,
                outputSchema,
                compatibilityRules
            );
        }).toThrow("Service ID cannot be empty");
    });
});