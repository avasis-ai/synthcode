import { describe, it, expect } from "vitest";
import { ToolCapabilityDiscoveryService } from "../src/capability/tool-capability-discovery-service";

describe("ToolCapabilityDiscoveryService", () => {
  it("should initialize with tool definitions", () => {
    const mockTools = [
      { name: "toolA", description: "A tool for task A" },
      { name: "toolB", description: "A tool for task B" },
    ];
    const service = new ToolCapabilityDiscoveryService(mockTools);
    // We can't directly test private members, but we can test the public interface
    // or assume internal state is set up correctly if the constructor doesn't throw.
    expect(service).toBeDefined();
  });

  it("should discover capabilities when provided with tools", () => {
    const mockTools = [
      { name: "search", description: "Searches the web for information." },
      { name: "calculator", description: "Performs mathematical calculations." },
    ];
    const service = new ToolCapabilityDiscoveryService(mockTools);
    // Assuming there's a method like discoverCapabilities() that returns CapabilityList
    // Since the provided code snippet is incomplete, we'll assume a method exists
    // that processes the tools and returns a list.
    // For this test, we'll mock the expected behavior if a discovery method existed.
    // If the service has a method like getCapabilities(), we'd use it here.
    // For now, we'll test the structure if we assume a method call.
    const capabilities = service.discoverCapabilities(); // Assuming this method exists
    expect(capabilities).toBeInstanceOf(Array);
    expect(capabilities.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle an empty list of tool definitions gracefully", () => {
    const mockTools: { name: string; description: string }[] = [];
    const service = new ToolCapabilityDiscoveryService(mockTools);
    const capabilities = service.discoverCapabilities(); // Assuming this method exists
    expect(capabilities).toEqual([]);
  });
});