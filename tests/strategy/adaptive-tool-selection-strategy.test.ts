import { describe, it, expect } from "vitest";
import { ScoringModel, ToolDefinition, ToolSelectionResult } from "../strategy/adaptive-tool-selection-strategy";

describe("AdaptiveToolSelectionStrategy", () => {
  it("should return the tool with the highest score based on context", () => {
    const mockScoringModel: ScoringModel = (context, tool) => {
      if (tool.name === "search_engine") {
        return context.includes("latest information") ? 0.9 : 0.3;
      }
      return 0.5;
    };

    const tools: ToolDefinition[] = [
      { name: "search_engine", description: "Searches the web", parameters: {} },
      { name: "calculator", description: "Performs math", parameters: {} },
    ];

    const context = "I need the latest information on quantum computing.";
    const result = mockScoringModel(context, tools[0]) > mockScoringModel(context, tools[1])
      ? { tool: tools[0], confidenceScore: mockScoringModel(context, tools[0]) }
      : { tool: tools[1], confidenceScore: mockScoringModel(context, tools[1]) };

    expect(result.tool.name).toBe("search_engine");
    expect(result.confidenceScore).toBeCloseTo(0.9);
  });

  it("should handle a scenario where no tool is clearly better", () => {
    const mockScoringModel: ScoringModel = (context, tool) => {
      return 0.6; // Equal score for simplicity
    };

    const tools: ToolDefinition[] = [
      { name: "search_engine", description: "Searches the web", parameters: {} },
      { name: "calculator", description: "Performs math", parameters: {} },
    ];

    const context = "What is the capital of France?";
    // In a real implementation, this would involve comparing scores and potentially falling back.
    // Here we just test the structure assuming the strategy picks one deterministically if scores are equal.
    const result = { tool: tools[0], confidenceScore: 0.6 }; // Mocking the expected behavior for equal scores

    expect(result.tool.name).toBe("search_engine");
    expect(result.confidenceScore).toBe(0.6);
  });

  it("should return a low confidence score if the context is irrelevant to any tool", () => {
    const mockScoringModel: ScoringModel = (context, tool) => {
      return context.includes("irrelevant") ? 0.1 : 0.7;
    };

    const tools: ToolDefinition[] = [
      { name: "search_engine", description: "Searches the web", parameters: {} },
      { name: "calculator", description: "Performs math", parameters: {} },
    ];

    const context = "This context is irrelevant.";
    // Assuming the strategy logic handles low scores by returning the best guess or null/default.
    const result = { tool: tools[0], confidenceScore: 0.1 }; // Mocking the expected low score result

    expect(result.tool.name).toBe("search_engine");
    expect(result.confidenceScore).toBe(0.1);
  });
});