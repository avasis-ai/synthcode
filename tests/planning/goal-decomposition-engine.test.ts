import { describe, it, expect } from "vitest";
import { GoalDecompositionEngine, Plan } from "../src/planning/goal-decomposition-engine";

describe("GoalDecompositionEngine", () => {
  it("should create a plan when a simple goal and tool are provided", async () => {
    const mockTools = {
      search: {
        description: "Searches the web for information.",
        inputSchema: { query: "string" },
        execute: async (query: string) => `Search results for ${query}.`,
      },
    };
    const engine = new GoalDecompositionEngine(mockTools);
    const goal = "Find the capital of France.";
    const plan = await engine.decomposeGoal(goal, ["search"]);

    expect(plan).toBeDefined();
    expect(plan!.goal).toBe(goal);
    expect(plan!.steps.length).toBe(1);
    expect(plan!.steps[0].action.name).toBe("search");
    expect(plan!.steps[0].requiredInputs).toEqual(["query"]);
  });

  it("should create a multi-step plan when multiple tools are required", async () => {
    const mockTools = {
      search: {
        description: "Searches the web for information.",
        inputSchema: { query: "string" },
        execute: async (query: string) => `Search results for ${query}.`,
      },
      summarize: {
        description: "Summarizes a given text.",
        inputSchema: { text: "string" },
        execute: async (text: string) => `Summary: ${text.substring(0, 10)}...`,
      },
    };
    const engine = new GoalDecompositionEngine(mockTools);
    const goal = "Search for AI trends and summarize the findings.";
    const plan = await engine.decomposeGoal(goal, ["search", "summarize"]);

    expect(plan).toBeDefined();
    expect(plan!.goal).toBe(goal);
    expect(plan!.steps.length).toBe(2);
    expect(plan!.steps[0].action.name).toBe("search");
    expect(plan!.steps[1].action.name).toBe("summarize");
  });

  it("should handle goals that require no specific tools", async () => {
    const mockTools = {
      search: {
        description: "Searches the web for information.",
        inputSchema: { query: "string" },
        execute: async (query: string) => `Search results for ${query}.`,
      },
    };
    const engine = new GoalDecompositionEngine(mockTools);
    const goal = "Write a simple greeting.";
    const plan = await engine.decomposeGoal(goal, []);

    expect(plan).toBeDefined();
    expect(plan!.goal).toBe(goal);
    expect(plan!.steps.length).toBe(0);
  });
});