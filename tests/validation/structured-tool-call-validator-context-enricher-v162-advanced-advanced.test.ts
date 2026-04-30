import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v162-advanced-advanced";
import { Message, ToolCallContext, ToolCallDetails } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should initialize correctly with a history store and limit", () => {
    const mockHistoryStore = {
      getToolCallHistory: jest.fn(),
    } as any;
    const enricher = new StructuredToolCallValidatorContextEnricher(mockHistoryStore, 5);
    // We can't directly test private members, but we can test its usage via methods if available.
    // For now, we'll just ensure instantiation doesn't throw.
    expect(enricher).toBeDefined();
  });

  it("should enrich context with tool call history when available", async () => {
    const mockHistoryStore = {
      getToolCallHistory: jest.fn().mockResolvedValue([
        { input: { query: "history 1" }, output: "result 1" },
        { input: { query: "history 2" }, output: "result 2" },
      ]),
    } as any;
    const enricher = new StructuredToolCallValidatorContextEnricher(mockHistoryStore, 10);

    const mockContext: ToolCallContext = {
      toolCalls: [{ toolName: "testTool", toolCallId: "id1" }],
      // Add other necessary properties if the method signature requires them
    };

    // Assuming enrichContext takes context and returns an enriched context or modifies it
    // Since the method signature isn't fully provided, we mock the expected behavior.
    const enrichedContext = await (enricher as any).enrichContext(mockContext, { message: {} } as Message);

    expect(mockHistoryStore.getToolCallHistory).toHaveBeenCalledWith("testTool", 2);
    expect(enrichedContext).toHaveProperty("history");
  });

  it("should handle empty tool call history gracefully", async () => {
    const mockHistoryStore = {
      getToolCallHistory: jest.fn().mockResolvedValue([]),
    } as any;
    const enricher = new StructuredToolCallValidatorContextEnricher(mockHistoryStore, 3);

    const mockContext: ToolCallContext = {
      toolCalls: [{ toolName: "otherTool", toolCallId: "id2" }],
    };

    const enrichedContext = await (enricher as any).enrichContext(mockContext, { message: {} } as Message);

    expect(mockHistoryStore.getToolCallHistory).toHaveBeenCalledWith("otherTool", 3);
    expect(enrichedContext).toHaveProperty("history", []);
  });
});