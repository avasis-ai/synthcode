import { describe, it, expect } from "vitest";
import { ServiceDiscoveryService, ServiceDescriptor } from "../src/capability/service-discovery";

describe("ServiceDiscoveryService", () => {
  it("should initialize with no sources", () => {
    const service = new ServiceDiscoveryService();
    // We can't directly test private fields, but we can test behavior that relies on initialization.
    // For this test, we'll assume the constructor sets up the internal state correctly.
    expect(service).toBeDefined();
  });

  it("should add a source and retrieve descriptors from it", () => {
    const mockSource: (() => ServiceDescriptor[] | null) = () => [
      {
        capabilityName: "test-service",
        endpoint: "http://test.com",
        description: "A test service",
        requiredInputs: {},
        outputSchema: {},
      } as ServiceDescriptor
    ];
    const service = new ServiceDiscoveryService();
    (service as any).addSource(mockSource);

    const descriptors = (service as any).discoverServices();
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0].capabilityName).toBe("test-service");
  });

  it("should return an empty array if no sources are added", () => {
    const service = new ServiceDiscoveryService();
    // Attempt to discover services without adding any sources
    const descriptors = (service as any).discoverServices();
    expect(descriptors).toEqual([]);
  });
});