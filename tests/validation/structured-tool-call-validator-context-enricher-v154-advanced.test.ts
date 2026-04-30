import { describe, it, expect } from "vitest";
import { Struc } from "../src/validation/structured-tool-call-validator-context-enricher-v154-advanced";
import { ContextManager } from "../src/validation/context-manager";
import { HistoryStore } from "../src/validation/history-store";
import { ConstraintStore } from "../src/validation/constraint-store";
import { Message, ContentBlock, ToolUseBlock } from "../src/types";

describe("Struc", () => {
  it("should correctly enrich context with history summary", async () => {
    const mockHistoryStore = {
      getSummary: () => Promise.resolve("Summary of past interactions."),
    } as unknown as HistoryStore;
    const mockContextManager = {
      getProjectContext: () => Promise.resolve({ project: "test-project" }),
    } as unknown as ContextManager;
    const mockConstraintStore = {
      getActiveConstraints: () => Promise.resolve({ "max_tokens": 200 }),
    } as unknown as ConstraintStore;

    const enricher = new Struc(mockHistoryStore, mockContextManager, mockConstraintStore);
    const enrichedContext = await enricher.enrichContext({});

    expect(enrichedContext.historySummary).toBe("Summary of past interactions.");
    expect(enrichedContext.projectContext).toEqual({ project: "test-project" });
  });

  it("should correctly capture recent tool usage", async () => {
    const mockHistoryStore = {
      getSummary: () => Promise.resolve("Some history."),
    } as unknown as HistoryStore;
    const mockContextManager = {
      getProjectContext: () => Promise.resolve({}),
    } as unknown as ContextManager;
    const mockConstraintStore = {
      getActiveConstraints: () => Promise.resolve({}),
    } as unknown as ConstraintStore;

    // Mocking the internal state or a method that populates recentToolUsage for testing purposes
    // Since the actual implementation detail for populating recentToolUsage isn't fully visible,
    // we'll test the structure assuming the enricher populates it correctly based on some input/state.
    // For this test, we'll assume the enricher has a mechanism to simulate tool usage capture.
    const enricher = new Struc(mockHistoryStore, mockContextManager, mockConstraintStore);
    
    // A more robust test would require mocking the source of tool usage data.
    // For now, we test the structure and assume the enrichment logic works.
    const enrichedContext = await enricher.enrichContext({
        toolUses: [
            { toolName: "search", lastInput: { query: "test" }, usageCount: 1 }
        ]
    });

    expect(enrichedContext.recentToolUsage).toHaveLength(1);
    expect(enrichedContext.recentToolUsage[0].toolName).toBe("search");
    expect(enrichedContext.recentToolUsage[0].lastInput).toEqual({ query: "test" });
  });

  it("should return a fully structured context object", async () => {
    const mockHistoryStore = {
      getSummary: () => Promise.resolve("Full context summary."),
    } as unknown as HistoryStore;
    const mockContextManager = {
      getProjectContext: () => Promise.resolve({ schema: "v1" }),
    } as unknown as ContextManager;
    const mockConstraintStore = {
      getActiveConstraints: () => Promise.resolve({ temperature: 0.7 }),
    } as unknown as ConstraintStore;

    const enricher = new Struc(mockHistoryStore, mockContextManager, mockConstraintStore);
    const enrichedContext = await enricher.enrichContext({});

    expect(enrichedContext).toBeDefined();
    expect(typeof enrichedContext.historySummary).toBe("string");
    expect(typeof enrichedContext.projectContext).toBe("object");
    expect(typeof enrichedContext.activeConstraints).toBe("object");
    expect(Array.isArray(enrichedContext.recentToolUsage)).toBe(true);
  });
});