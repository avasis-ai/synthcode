import { describe, it, expect } from "vitest";
import { ProviderAdapter, CapabilityDescriptor } from "../src/capability/dynamic-capability-discovery";

describe("ProviderAdapter", () => {
  it("should correctly discover capabilities when implemented", async () => {
    const mockAdapter: ProviderAdapter = {
      discoverCapabilities: async () => [
        {
          capabilityName: "search",
          description: "Searches for information online.",
          requiredInputs: {
            query: {
              type: "string";
              description: "The search query.";
              required: true;
            };
          },
          potentialSideEffects: ["network_access"],
          version: "1.0",
        } as CapabilityDescriptor,
      ],
    };

    const capabilities = await mockAdapter.discoverCapabilities();
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].capabilityName).toBe("search");
    expect(capabilities[0].requiredInputs).toHaveProperty("query");
    expect(capabilities[0].requiredInputs.query.required).toBe(true);
  });

  it("should return an empty array if no capabilities are available", async () => {
    const mockAdapter: ProviderAdapter = {
      discoverCapabilities: async () => [],
    };

    const capabilities = await mockAdapter.discoverCapabilities();
    expect(capabilities).toEqual([]);
  });

  it("should handle asynchronous discovery process", async () => {
    const mockAdapter: ProviderAdapter = {
      discoverCapabilities: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return [{
          capabilityName: "weather",
          description: "Gets the current weather.",
          requiredInputs: {},
          potentialSideEffects: ["api_call"],
          version: "1.0",
        } as CapabilityDescriptor];
      },
    };

    const capabilities = await mockAdapter.discoverCapabilities();
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].capabilityName).toBe("weather");
  });
});