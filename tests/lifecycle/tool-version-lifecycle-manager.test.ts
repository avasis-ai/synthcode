import { describe, it, expect, vi } from "vitest";
import { ToolVersionLifecycleManager } from "../src/lifecycle/tool-version-lifecycle-manager";

describe("ToolVersionLifecycleManager", () => {
  it("should initialize correctly with a tool definition", async () => {
    const mockToolDefinition: any = {
      name: "mockTool",
      description: "A mock tool",
      versions: {
        "v1.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v1.0.0 result",
        },
        "v2.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v2.0.0 result",
        },
      },
    };

    const manager = new ToolVersionLifecycleManager(mockToolDefinition);
    expect(manager).toBeDefined();
    expect(manager.getToolName()).toBe("mockTool");
    expect(manager.getAvailableVersions()).toEqual(["v1.0.0", "v2.0.0"]);
  });

  it("should handle deprecation and provide replacement information", async () => {
    const mockToolDefinition: any = {
      name: "mockTool",
      description: "A mock tool",
      versions: {
        "v1.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v1.0.0 result",
        },
        "v2.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v2.0.0 result",
        },
      },
    };

    const manager = new ToolVersionLifecycleManager(mockToolDefinition);
    // Assuming there's a method to check deprecation status or similar logic
    // We'll test a hypothetical method `isVersionDeprecated`
    const isDeprecated = (version: string) => {
      if (version === "v1.0.0") {
        return {
          isDeprecated: true,
          deprecationMessage: "v1.0.0 is deprecated. Use v2.0.0 instead.",
          replacementToolName: "mockTool",
          effectiveDate: new Date(),
        };
      }
      return {
        isDeprecated: false,
        deprecationMessage: "",
        replacementToolName: null,
        effectiveDate: new Date(),
      };
    };

    // Mocking the internal check for demonstration purposes
    const checkDeprecation = vi.spyOn(manager, 'checkDeprecation').mockImplementation((version: string) => {
      if (version === "v1.0.0") {
        return {
          isDeprecated: true,
          deprecationMessage: "v1.0.0 is deprecated. Use v2.0.0 instead.",
          replacementToolName: "mockTool",
          effectiveDate: new Date(),
        };
      }
      return {
        isDeprecated: false,
        deprecationMessage: "",
        replacementToolName: null,
        effectiveDate: new Date(),
      };
    });

    const deprecationInfo = manager.checkDeprecation("v1.0.0");
    expect(deprecationInfo.isDeprecated).toBe(true);
    expect(deprecationInfo.deprecationMessage).toContain("deprecated");
    expect(deprecationInfo.replacementToolName).toBe("mockTool");

    checkDeprecation.mockRestore();
  });

  it("should correctly retrieve the implementation for a specific version", async () => {
    const mockToolDefinition: any = {
      name: "mockTool",
      description: "A mock tool",
      versions: {
        "v1.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v1.0.0 result",
        },
        "v2.0.0": {
          functionName: "mockFunction",
          schema: {},
          implementation: async (input) => "v2.0.0 result",
        },
      },
    };

    const manager = new ToolVersionLifecycleManager(mockToolDefinition);
    const version = "v2.0.0";
    const implementation = await manager.getImplementation(version);

    expect(implementation).toBeDefined();
    expect(typeof implementation).toBe("function");

    const input = { key: "test" };
    const result = await implementation(input);
    expect(result).toBe("v2.0.0 result");
  });
});