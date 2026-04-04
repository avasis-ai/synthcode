import { describe, it, expect } from "vitest";
import { ToolDependencyResolver, ToolDefinition } from "../src/dependency/tool-dependency-resolver";

describe("ToolDependencyResolver", () => {
  it("should resolve dependencies correctly for a simple chain", async () => {
    const mockToolA: ToolDefinition = {
      name: "toolA",
      description: "Tool A",
      dependencies: [],
      execute: async () => "A_result",
    };
    const mockToolB: ToolDefinition = {
      name: "toolB",
      description: "Tool B",
      dependencies: ["toolA"],
      execute: async () => "B_result",
    };
    const resolver = new ToolDependencyResolver([mockToolA, mockToolB]);

    const plan = await resolver.resolvePlan(["toolB"]);
    expect(plan).toHaveLength(2);
    expect(plan[0].toolName).toBe("toolA");
    expect(plan[1].toolName).toBe("toolB");
  });

  it("should handle tools with no dependencies", async () => {
    const mockToolA: ToolDefinition = {
      name: "toolA",
      description: "Tool A",
      dependencies: [],
      execute: async () => "A_result",
    };
    const resolver = new ToolDependencyResolver([mockToolA]);

    const plan = await resolver.resolvePlan(["toolA"]);
    expect(plan).toHaveLength(1);
    expect(plan[0].toolName).toBe("toolA");
  });

  it("should throw an error if a dependency is missing", async () => {
    const mockToolA: ToolDefinition = {
      name: "toolA",
      description: "Tool A",
      dependencies: [],
      execute: async () => "A_result",
    };
    const mockToolB: ToolDefinition = {
      name: "toolB",
      description: "Tool B",
      dependencies: ["nonExistentTool"],
      execute: async () => "B_result",
    };
    const resolver = new ToolDependencyResolver([mockToolA, mockToolB]);

    await expect(async () => {
      await resolver.resolvePlan(["toolB"]);
    }).rejects.toThrow("Dependency 'nonExistentTool' not found");
  });
});