import { describe, it, expect } from "vitest";
import { ToolChaining } from "../src/stateful-tool-chaining";

describe("ToolChaining", () => {
  it("should correctly execute a single tool step when conditions are met", async () => {
    const mockTool = {
      name: "getWeather",
      description: "Gets the weather for a location.",
      inputSchema: {
        location: { type: "string" },
      },
      execute: async (input: { location: string }) => "Sunny in London",
    };

    const toolChain = new ToolChaining([
      {
        toolName: "getWeather",
        inputMapper: (state) => ({ location: "London" }),
        condition: (state) => state.history.some((msg) => msg.role === "user" && msg.content.includes("weather")),
      },
    ]);

    const state = { history: [{ role: "user", content: "What's the weather in London?" }] };
    const result = await toolChain.run(state);

    expect(result.executedTools).toHaveLength(1);
    expect(result.executedTools[0].toolName).toBe("getWeather");
    expect(result.output).toBe("Sunny in London");
  });

  it("should skip tool steps when the condition is false", async () => {
    const mockTool = {
      name: "getWeather",
      description: "Gets the weather for a location.",
      inputSchema: {
        location: { type: "string" },
      },
      execute: async (input: { location: string }) => "Sunny in London",
    };

    const toolChain = new ToolChaining([
      {
        toolName: "getWeather",
        inputMapper: (state) => ({ location: "Paris" }),
        condition: (state) => state.history.some((msg) => msg.content.includes("weather") && state.history.length > 1), // Condition fails if history length is 1
      },
    ]);

    const state = { history: [{ role: "user", content: "Hello" }] };
    const result = await toolChain.run(state);

    expect(result.executedTools).toHaveLength(0);
    expect(result.output).toBeNull();
  });

  it("should execute multiple sequential tool steps if all conditions pass", async () => {
    const mockTool1 = {
      name: "searchUsers",
      description: "Searches for users.",
      inputSchema: { query: { type: "string" } },
      execute: async (input: { query: string }) => [{ id: 1, name: "Alice" }],
    };
    const mockTool2 = {
      name: "getDetails",
      description: "Gets user details.",
      inputSchema: { userId: { type: "number" } },
      execute: async (input: { userId: number }) => ({ details: "Alice's details" }),
    };

    const toolChain = new ToolChaining([
      {
        toolName: "searchUsers",
        inputMapper: (state) => ({ query: "Alice" }),
        condition: (state) => state.history.some((msg) => msg.content.includes("user")),
      },
      {
        toolName: "getDetails",
        inputMapper: (state) => {
          // Simulate passing the result of the previous tool
          const lastToolResult = (state as any).lastToolResult;
          return { userId: (lastToolResult as any)?.id || 1 };
        },
        condition: (state) => (state as any).lastToolResult !== undefined,
      },
    ]);

    const state = { history: [{ role: "user", content: "Find a user" }] };
    const result = await toolChain.run(state);

    expect(result.executedTools).toHaveLength(2);
    expect(result.executedTools[0].toolName).toBe("searchUsers");
    expect(result.executedTools[1].toolName).toBe("getDetails");
    expect(result.output).toEqual({ details: "Alice's details" });
  });
});