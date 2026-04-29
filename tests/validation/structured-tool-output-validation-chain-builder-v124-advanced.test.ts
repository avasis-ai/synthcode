import { describe, it, expect } from "vitest";
import { AdvancedValidationOptions } from "../src/validation/structured-tool-output-validation-chain-builder-v124-advanced";
import { ValidationStep } from "../src/validation/structured-tool-output-validation-chain-builder-v124-advanced";

describe("AdvancedValidationOptions", () => {
    it("should correctly initialize with no context providers", async () => {
        const options: AdvancedValidationOptions = { initialContext: { user: "test" } };
        expect(options.initialContext).toEqual({ user: "test" });
        expect(options.contextProviders).toBeUndefined();
    });

    it("should handle multiple context providers", async () => {
        const mockProvider1 = async (context: Record<string, unknown>) => ({ provider1Data: "data1" });
        const mockProvider2 = async (context: Record<string, unknown>) => ({ provider2Data: "data2" });

        const options: AdvancedValidationOptions = {
            contextProviders: [
                { key: "provider1", provider: mockProvider1 },
                { key: "provider2", provider: mockProvider2 },
            ],
        };

        expect(options.contextProviders).toHaveLength(2);
        expect(options.contextProviders![0].key).toBe("provider1");
    });

    it("should allow initial context to override or supplement provider data", async () => {
        const mockProvider = async (context: Record<string, unknown>) => ({
            ...context,
            providerData: "from_provider"
        });

        const initialContext: Record<string, unknown> = {
            initialKey: "initial_value"
        };

        const options: AdvancedValidationOptions = {
            initialContext: initialContext,
            contextProviders: [{ key: "main", provider: mockProvider }],
        };

        // Simulate the execution flow to check if both are present
        const context = { initialKey: "initial_value" };
        const result = await options.contextProviders![0].provider(context);

        expect(result).toHaveProperty("initialKey", "initial_value");
        expect(result).toHaveProperty("providerData", "from_provider");
    });
});