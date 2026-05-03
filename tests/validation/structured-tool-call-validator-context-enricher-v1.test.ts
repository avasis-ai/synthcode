import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherV1 } from "../src/validation/structured-tool-call-validator-context-enricher-v1";

describe("StructuredToolCallValidatorContextEnricherV1", () => {
  it("should correctly enrich context from history, state, and external sources", () => {
    const mockHistory: Message[] = [
      { role: "user", content: { type: "text", value: "Hello" } },
      { role: "assistant", content: { type: "text", value: "Hi there!" } },
    ];
    const mockState: Record<string, unknown> = { userId: "user123", session: "active" };
    const mockExternal: Record<string, unknown> = { ipAddress: "192.168.1.1" };

    const mockContextSource: any = {
      getHistory: () => mockHistory,
      getState: () => mockState,
      getExternalContext: () => mockExternal,
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV1();
    const enrichedContext = enricher.enrichContext(mockContextSource);

    expect(enrichedContext.history).toEqual(mockHistory);
    expect(enrichedContext.state).toEqual(mockState);
    expect(enrichedContext.external).toEqual(mockExternal);
    expect(enrichedContext.combined).toEqual({ ...mockState, ...mockExternal });
  });

  it("should handle empty context sources gracefully", () => {
    const mockHistory: Message[] = [];
    const mockState: Record<string, unknown> = {};
    const mockExternal: Record<string, unknown> = {};

    const mockContextSource: any = {
      getHistory: () => mockHistory,
      getState: () => mockState,
      getExternalContext: () => mockExternal,
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV1();
    const enrichedContext = enricher.enrichContext(mockContextSource);

    expect(enrichedContext.history).toEqual([]);
    expect(enrichedContext.state).toEqual({});
    expect(enrichedContext.external).toEqual({});
    expect(enrichedContext.combined).toEqual({});
  });

  it("should correctly combine state and external context when keys overlap", () => {
    const mockHistory: Message[] = [];
    const mockState: Record<string, unknown> = { key: "stateValue", sharedKey: "state" };
    const mockExternal: Record<string, unknown> = { sharedKey: "external" };

    const mockContextSource: any = {
      getHistory: () => mockHistory,
      getState: () => mockState,
      getExternalContext: () => mockExternal,
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV1();
    const enrichedContext = enricher.enrichContext(mockContextSource);

    // Expect external context to overwrite state context on overlap
    expect(enrichedContext.combined).toEqual({ key: "stateValue", sharedKey: "external" });
  });
});