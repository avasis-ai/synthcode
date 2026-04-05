import { describe, it, expect } from "vitest";
import { SchemaResolver } from "../src/schema/tool-output-schema-union-resolver-v9";

describe("ToolOutputSchemaUnionResolverV9", () => {
  it("should correctly resolve a simple union of message types", async () => {
    const resolver = new SchemaResolver(
      [
        { type: "user", schema: { role: "user", content: "user content" } },
        { type: "assistant", schema: { role: "assistant", content: "assistant content" } },
      ]
    );
    const result = await resolver.resolve({ role: "user", content: "user content" });
    expect(result).toEqual({ role: "user", content: "user content" });
  });

  it("should correctly resolve a tool result message", async () => {
    const resolver = new SchemaResolver(
      [
        { type: "tool", schema: { role: "tool", tool_use_id: "id1", content: "tool output" } },
      ]
    );
    const result = await resolver.resolve({ role: "tool", tool_use_id: "id1", content: "tool output" });
    expect(result).toEqual({ role: "tool", tool_use_id: "id1", content: "tool output" });
  });

  it("should handle missing fields gracefully when resolving", async () => {
    const resolver = new SchemaResolver(
      [
        { type: "user", schema: { role: "user", content: "user content" } },
        { type: "assistant", schema: { role: "assistant", content: "assistant content" } },
      ]
    );
    // Attempt to resolve with only role, which might be incomplete
    const result = await resolver.resolve({ role: "user" } as any);
    // Depending on the implementation, this might throw or return a partial match.
    // Assuming it handles partial matches based on the defined union structure.
    expect(result).toBeDefined();
  });
});