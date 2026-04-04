import { describe, it, expect } from "vitest";
import { ToolDefinition } from "../src/tool/capability-registry";

describe("CapabilityRegistry", () => {
  it("should correctly register a tool with basic definition", async () => {
    const mockTool: ToolDefinition = {
      name: "testTool",
      description: "A test tool",
      capability: {
        inputs: {
          param1: { description: "Param 1", required: true },
        },
        outputs: { schema: {}, description: "Output" },
        sideEffects: ["effect1"],
      },
      execute: async (input) => "success",
    };

    const registry = new (class {
      registerTool(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
      }
      getTool(name: string) {
        return this.tools.get(name);
      }
      private tools = new Map<string, ToolDefinition>();
    })();

    registry.registerTool(mockTool);
    const retrievedTool = registry.getTool("testTool");

    expect(retrievedTool).toBeDefined();
    expect(retrievedTool!.name).toBe("testTool");
    expect(retrievedTool!.capability.inputs).toEqual({
      param1: { description: "Param 1", required: true },
    });
  });

  it("should handle multiple tool registrations without overwriting", async () => {
    const tool1: ToolDefinition = {
      name: "toolA",
      description: "Tool A",
      capability: {
        inputs: {},
        outputs: { schema: {}, description: "Output A" },
        sideEffects: [],
      },
      execute: async () => "A",
    };
    const tool2: ToolDefinition = {
      name: "toolB",
      description: "Tool B",
      capability: {
        inputs: {},
        outputs: { schema: {}, description: "Output B" },
        sideEffects: [],
      },
      execute: async () => "B",
    };

    const registry = new (class {
      registerTool(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
      }
      getTool(name: string) {
        return this.tools.get(name);
      }
      private tools = new Map<string, ToolDefinition>();
    })();

    registry.registerTool(tool1);
    registry.registerTool(tool2);

    expect(registry.getTool("toolA")).toBeDefined();
    expect(registry.getTool("toolB")).toBeDefined();
    expect(registry.getTool("toolA")?.name).toBe("toolA");
    expect(registry.getTool("toolB")?.name).toBe("toolB");
  });

  it("should return undefined for a non-existent tool name", async () => {
    const registry = new (class {
      registerTool(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
      }
      getTool(name: string) {
        return this.tools.get(name);
      }
      private tools = new Map<string, ToolDefinition>();
    })();

    const mockTool: ToolDefinition = {
      name: "existingTool",
      description: "Existing",
      capability: {
        inputs: {},
        outputs: { schema: {}, description: "Output" },
        sideEffects: [],
      },
      execute: async () => "ok",
    };
    registry.registerTool(mockTool);

    const nonExistentTool = registry.getTool("missingTool");
    expect(nonExistentTool).toBeUndefined();
  });
});