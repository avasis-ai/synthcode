import { describe, it, expect } from "vitest";
import { AdaptiveToolSelector } from "../src/tool/adaptive-tool-selector";

describe("AdaptiveToolSelector", () => {
  it("should assign higher scores to tools relevant to the conversation history", async () => {
    const mockEmbeddingModel = vi.fn().mockResolvedValue("high_relevance_score");
    const selector = new AdaptiveToolSelector(mockEmbeddingModel);

    const history: Message[] = [
      { role: "user", content: "I need to check the weather in London." }
    ];
    const goal = "Determine the current weather conditions.";
    const availableTools: ToolDefinition[] = [
      { name: "weather_api", description: "Gets weather data for a city.", parameters: {} },
      { name: "calculator", description: "Performs mathematical calculations.", parameters: {} },
    ];

    const result = await selector.selectTool(history, goal, availableTools);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(item => item.tool.name === "weather_api" && item.score > 0)).toBe(true);
  });

  it("should prioritize tools when the goal is very specific", async () => {
    const mockEmbeddingModel = vi.fn().mockResolvedValue("very_specific_score");
    const selector = new AdaptiveToolSelector(mockEmbeddingModel);

    const history: Message[] = [
      { role: "user", content: "What is the capital of France?" }
    ];
    const goal = "Find the capital city of France.";
    const availableTools: ToolDefinition[] = [
      { name: "geography_api", description: "Provides geographical facts.", parameters: {} },
      { name: "recipe_finder", description: "Finds cooking recipes.", parameters: {} },
    ];

    const result = await selector.selectTool(history, goal, availableTools);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(item => item.tool.name === "geography_api" && item.score > 0)).toBe(true);
  });

  it("should return low scores for irrelevant tools", async () => {
    const mockEmbeddingModel = vi.fn().mockResolvedValue("low_relevance_score");
    const selector = new AdaptiveToolSelector(mockEmbeddingModel);

    const history: Message[] = [
      { role: "user", content: "Can you calculate 2 plus 2?" }
    ];
    const goal = "Perform a simple arithmetic calculation.";
    const availableTools: ToolDefinition[] = [
      { name: "calculator", description: "Performs mathematical calculations.", parameters: {} },
      { name: "weather_api", description: "Gets weather data for a city.", parameters: {} },
    ];

    const result = await selector.selectTool(history, goal, availableTools);

    expect(result.length).toBe(2);
    expect(result.find(item => item.tool.name === "calculator")?.score).toBeGreaterThan(0);
    expect(result.find(item => item.tool.name === "weather_api")?.score).toBeLessThan(1);
  });
});