import { describe, it, expect } from "vitest";
import { CapabilityDiscoveryManager } from "../src/capability-discovery";
import { Tool } from "../src/tool";

describe("CapabilityDiscoveryManager", () => {
  it("should discover capabilities from a list of tools", () => {
    const mockTool1: Partial<Tool> = {
      getCapabilities: () => [
        { name: "read_file", metadata: { path: "file.txt" }, checkExistence: () => true },
        { name: "write_file", metadata: { path: "file.txt" }, checkExistence: () => false },
      ],
    };
    const mockTool2: Partial<Tool> = {
      getCapabilities: () => [
        { name: "list_directory", metadata: {}, checkExistence: () => true },
      ],
    };

    const manager = new CapabilityDiscoveryManager();
    const capabilities = manager.discoverAllCapabilities([mockTool1 as Tool, mockTool2 as Tool]);

    expect(capabilities.size).toBe(2);
    expect(capabilities.has("read_file")).toBe(true);
    expect(capabilities.has("list_directory")).toBe(true);
    expect(capabilities.get("read_file")!.metadata).toEqual({ path: "file.txt" });
  });

  it("should handle tools without getCapabilities method gracefully", () => {
    const mockTool1: Partial<Tool> = {
      getCapabilities: () => [
        { name: "read_file", metadata: { path: "file.txt" }, checkExistence: () => true },
      ],
    };
    const mockTool2: Partial<Tool> = {
      // Intentionally missing getCapabilities
    } as Tool;

    const manager = new CapabilityDiscoveryManager();
    const capabilities = manager.discoverAllCapabilities([mockTool1 as Tool, mockTool2 as Tool]);

    expect(capabilities.size).toBe(1);
    expect(capabilities.has("read_file")).toBe(true);
  });

  it("should overwrite capabilities with the last encountered definition if names clash", () => {
    const mockTool1: Partial<Tool> = {
      getCapabilities: () => [
        { name: "shared_capability", metadata: { source: "tool1" }, checkExistence: () => true },
      ],
    };
    const mockTool2: Partial<Tool> = {
      getCapabilities: () => [
        { name: "shared_capability", metadata: { source: "tool2" }, checkExistence: () => true },
      ],
    };

    const manager = new CapabilityDiscoveryManager();
    const capabilities = manager.discoverAllCapabilities([mockTool1 as Tool, mockTool2 as Tool]);

    expect(capabilities.size).toBe(1);
    expect(capabilities.get("shared_capability")!.metadata).toEqual({ source: "tool2" });
  });
});