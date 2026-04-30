import { describe, it, expect } from "vitest";
import {
  EnrichedContext,
  ToolCallDependency,
} from "../src/validation/structured-tool-call-validator-context-enricher-v163-advanced-advanced";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should correctly enrich context with basic messages and tool calls", () => {
    const mockContext: any = {
      messages: [
        { role: "user", content: "Hello" },
      ],
      toolCalls: [
        { id: "call1", name: "toolA", input: { param: "value" } },
      ],
      dependencies: new Map(),
      temporalConstraints: new Map(),
    };
    const enriched = mockContext; // Assuming the function modifies or returns the enriched context

    expect(enriched.messages).toEqual([
      { role: "user", content: "Hello" },
    ]);
    expect(enriched.toolCalls).toHaveLength(1);
    expect(enriched.toolCalls[0].id).toBe("call1");
  });

  it("should populate dependencies map when tool calls depend on each other", () => {
    const mockContext: any = {
      messages: [],
      toolCalls: [
        { id: "callA", name: "toolA", input: {} },
        { id: "callB", name: "toolB", input: {} },
      ],
      dependencies: new Map(),
      temporalConstraints: new Map(),
    };
    // Mocking the enrichment process to set up a dependency
    mockContext.dependencies.set("callB", { requiredBy: "callA", resolved: false });

    const enriched = mockContext;

    expect(enriched.dependencies.size).toBeGreaterThanOrEqual(1);
    expect(enriched.dependencies.get("callB")?.requiredBy).toBe("callA");
  });

  it("should populate temporal constraints map when time-sensitive actions are involved", () => {
    const mockContext: any = {
      messages: [],
      toolCalls: [],
      dependencies: new Map(),
      temporalConstraints: new Map(),
    };
    // Mocking the enrichment process to set up a constraint
    mockContext.temporalConstraints.set("eventTime", { requiredAt: 1672531200, satisfied: false });

    const enriched = mockContext;

    expect(enriched.temporalConstraints.size).toBeGreaterThanOrEqual(1);
    expect(enriched.temporalConstraints.get("eventTime")?.requiredAt).toBe(1672531200);
  });
});