import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV13 } from "../src/schema/tool-output-schema-union-resolver-v13";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/schema/types";

describe("ToolOutputSchemaUnionResolverV13", () => {
  it("should resolve the union when the context suggests a specific tool output type", () => {
    const mockSchemas: any[] = [
      { name: "schemaA", description: "Schema A", properties: { fieldA: { type: "string" } } },
      { name: "schemaB", description: "Schema B", properties: { fieldB: { type: "number" } } },
    ];
    const mockContext: any = {
      messages: [
        new UserMessage("User", "Call tool A"),
        new AssistantMessage("Assistant", "The tool output should match schema A."),
      ],
    };
    const resolver = new ToolOutputSchemaUnionResolverV13(mockSchemas, mockContext);
    const result = resolver.resolveUnion();

    expect(result).toBeDefined();
    // Simplified assertion based on expected behavior of a resolver
    expect(result.resolvedSchemaName).toBe("schemaA");
  });

  it("should handle an empty context gracefully", () => {
    const mockSchemas: any[] = [
      { name: "schemaA", description: "Schema A", properties: { fieldA: { type: "string" } } },
    ];
    const mockContext: any = {
      messages: [],
    };
    const resolver = new ToolOutputSchemaUnionResolverV13(mockSchemas, mockContext);
    const result = resolver.resolveUnion();

    expect(result).toBeDefined();
    // Expecting a default or fallback resolution if context is empty
    expect(result.resolvedSchemaName).toBe("schemaA"); // Assuming first schema is default
  });

  it("should prioritize the schema mentioned in the latest assistant message", () => {
    const mockSchemas: any[] = [
      { name: "schemaA", description: "Schema A", properties: { fieldA: { type: "string" } } },
      { name: "schemaB", description: "Schema B", properties: { fieldB: { type: "number" } } },
    ];
    const mockContext: any = {
      messages: [
        new UserMessage("User", "Initial query"),
        new AssistantMessage("Assistant", "Use schema B for the next step."),
      ],
    };
    const resolver = new ToolOutputSchemaUnionResolverV13(mockSchemas, mockContext);
    const result = resolver.resolveUnion();

    expect(result).toBeDefined();
    expect(result.resolvedSchemaName).toBe("schemaB");
  });
});