import { describe, it, expect } from "vitest";
import { AdvancedToolCallContext } from "../src/validation/structured-tool-call-validator-context-enricher-v156-advanced-new";

describe("AdvancedToolCallContext", () => {
  it("should correctly initialize with basic structure", () => {
    const context: AdvancedToolCallContext = {
      messages: [
        { type: "user", content: [{ type: "text", text: "Hello" }] } as any,
      ],
      toolCall: {
        name: "someTool",
        input: { key: "value" },
      },
      resourceUsage: {
        resources: [
          { resourceName: "api_key", requiredAmount: 1, unit: "count" },
        ],
        compatibility: [
          { requiredCapability: "auth", isCompatible: true },
        ],
      },
    };
    expect(context.messages).toBeInstanceOf(Array);
    expect(context.toolCall.name).toBe("someTool");
    expect(context.resourceUsage.resources).toBeInstanceOf(Array);
  });

  it("should handle empty message history", () => {
    const context: AdvancedToolCallContext = {
      messages: [],
      toolCall: {
        name: "emptyTool",
        input: {},
      },
      resourceUsage: {
        resources: [],
        compatibility: [],
      },
    };
    expect(context.messages.length).toBe(0);
    expect(context.toolCall.input).toEqual({});
  });

  it("should correctly process multiple resource usages and compatibility checks", () => {
    const context: AdvancedToolCallContext = {
      messages: [
        { type: "user", content: [{ type: "text", text: "Test" }] } as any,
      ],
      toolCall: {
        name: "complexTool",
        input: { param1: "A", param2: 123 },
      },
      resourceUsage: {
        resources: [
          { resourceName: "storage", requiredAmount: 10, unit: "MB" },
          { resourceName: "cpu", requiredAmount: 2, unit: "cores" },
        ],
        compatibility: [
          { requiredCapability: "network", isCompatible: true },
          { requiredCapability: "billing", isCompatible: false, reason: "Not enabled" },
        ],
      },
    };
    expect(context.resourceUsage.resources.length).toBe(2);
    expect(context.resourceUsage.compatibility.length).toBe(2);
    expect(context.resourceUsage.compatibility[1].reason).toBe("Not enabled");
  });
});