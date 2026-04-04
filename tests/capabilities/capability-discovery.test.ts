import { describe, it, expect } from "vitest";
import { CapabilityDiscoveryService, ToolService } from "../src/capabilities/capability-discovery";

describe("CapabilityDiscoveryService", () => {
  it("should initialize with no registered tools and empty capabilities", () => {
    const service = new CapabilityDiscoveryService();
    expect(service.getRegisteredTools()).toHaveLength(0);
    expect(service.getDiscoveredCapabilities()).toEqual(new Set<string>());
  });

  it("should register tools and accumulate their capabilities", () => {
    const service = new CapabilityDiscoveryService();
    const mockTool1: ToolService = {
      name: "tool1",
      reportCapabilities: () => [
        { name: "cap1", description: "desc1", args: ["a"] },
        { name: "cap2", description: "desc2", args: ["b"] },
      ],
    };
    const mockTool2: ToolService = {
      name: "tool2",
      reportCapabilities: () => [
        { name: "cap2", description: "desc2_alt", args: ["b"] },
        { name: "cap3", description: "desc3", args: ["c"] },
      ],
    };

    service.registerTool(mockTool1);
    service.registerTool(mockTool2);

    const capabilities = service.getDiscoveredCapabilities();
    expect(capabilities).toHaveSize(3);
    expect(capabilities.has("cap1")).toBe(true);
    expect(capabilities.has("cap2")).toBe(true);
    expect(capabilities.has("cap3")).toBe(true);
  });

  it("should handle duplicate capabilities from different tools correctly (only store unique names)", () => {
    const service = new CapabilityDiscoveryService();
    const mockTool1: ToolService = {
      name: "tool1",
      reportCapabilities: () => [
        { name: "shared_cap", description: "shared", args: ["a"] },
      ],
    };
    const mockTool2: ToolService = {
      name: "tool2",
      reportCapabilities: () => [
        { name: "shared_cap", description: "shared_alt", args: ["b"] },
      ],
    };

    service.registerTool(mockTool1);
    service.registerTool(mockTool2);

    const capabilities = service.getDiscoveredCapabilities();
    expect(capabilities).toHaveSize(1);
    expect(capabilities.has("shared_cap")).toBe(true);
  });
});