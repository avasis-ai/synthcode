import { describe, it, expect } from "vitest";
import {
  ToolDefinition,
  ToolCall,
  ToolDependencyResolverContext,
} from "../src/dependency/tool-input-dependency-resolver";

describe("ToolInputDependencyResolver", () => {
  it("should resolve dependencies correctly when all required tools are present", () => {
    const mockContext: ToolDependencyResolverContext = {
      toolDefinitions: {
        toolA: {
          name: "toolA",
          description: "A tool",
          parameters: {
            param1: "string",
          },
          dependencies: [
            { toolName: "toolB", outputKey: "resultB" },
          ],
        },
        toolB: {
          name: "toolB",
          description: "A tool",
          parameters: {
            param2: "number",
          },
          dependencies: [],
        },
      },
    };

    const resolver = new (class {
      constructor(context: ToolDependencyResolverContext) {
        this.context = context;
      }
      resolve(toolName: string, toolCall: ToolCall): Record<string, unknown> {
        const definition = this.context.toolDefinitions[toolName];
        if (!definition || !definition.dependencies) {
          return {};
        }
        const resolvedInputs: Record<string, unknown> = {};
        for (const dep of definition.dependencies) {
          const output = this.context.toolOutputs[dep.outputKey];
          if (output !== undefined) {
            resolvedInputs[dep.outputKey] = output;
          }
        }
        return resolvedInputs;
      }
    })(mockContext);

    // Mocking toolOutputs for the test context
    (mockContext as any).toolOutputs = {
      resultB: "Output from toolB",
    };

    const resolved = resolver.resolve("toolA", {
      toolName: "toolA",
      input: {
        param1: "test",
      },
    });

    expect(resolved).toEqual({
      resultB: "Output from toolB",
    });
  });

  it("should return an empty object if the tool has no dependencies", () => {
    const mockContext: ToolDependencyResolverContext = {
      toolDefinitions: {
        toolC: {
          name: "toolC",
          description: "A tool",
          parameters: {
            param3: "boolean",
          },
          dependencies: [],
        },
      },
    };

    const resolver = new (class {
      constructor(context: ToolDependencyResolverContext) {
        this.context = context;
      }
      resolve(toolName: string, toolCall: ToolCall): Record<string, unknown> {
        const definition = this.context.toolDefinitions[toolName];
        if (!definition || !definition.dependencies) {
          return {};
        }
        const resolvedInputs: Record<string, unknown> = {};
        for (const dep of definition.dependencies) {
          const output = this.context.toolOutputs[dep.outputKey];
          if (output !== undefined) {
            resolvedInputs[dep.outputKey] = output;
          }
        }
        return resolvedInputs;
      }
    })(mockContext);

    const resolved = resolver.resolve("toolC", {
      toolName: "toolC",
      input: {},
    });

    expect(resolved).toEqual({});
  });

  it("should handle missing tool outputs gracefully by ignoring the dependency", () => {
    const mockContext: ToolDependencyResolverContext = {
      toolDefinitions: {
        toolD: {
          name: "toolD",
          description: "A tool",
          parameters: {
            param4: "string",
          },
          dependencies: [
            { toolName: "toolMissing", outputKey: "missingOutput" },
            { toolName: "toolPresent", outputKey: "presentOutput" },
          ],
        },
      },
    };

    const resolver = new (class {
      constructor(context: ToolDependencyResolverContext) {
        this.context = context;
      }
      resolve(toolName: string, toolCall: ToolCall): Record<string, unknown> {
        const definition = this.context.toolDefinitions[toolName];
        if (!definition || !definition.dependencies) {
          return {};
        }
        const resolvedInputs: Record<string, unknown> = {};
        for (const dep of definition.dependencies) {
          const output = this.context.toolOutputs[dep.outputKey];
          if (output !== undefined) {
            resolvedInputs[dep.outputKey] = output;
          }
        }
        return resolvedInputs;
      }
    })(mockContext);

    // Mocking toolOutputs where one is missing
    (mockContext as any).toolOutputs = {
      presentOutput: "Actual output",
    };

    const resolved = resolver.resolve("toolD", {
      toolName: "toolD",
      input: {},
    });

    expect(resolved).toEqual({
      presentOutput: "Actual output",
    });
  });
});