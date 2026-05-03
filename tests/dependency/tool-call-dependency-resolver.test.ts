import { describe, it, expect } from "vitest";
import { ToolCallDependencyResolver } from "../src/dependency/tool-call-dependency-resolver";

describe("ToolCallDependencyResolver", () => {
  it("should resolve dependencies when all tools are independent", async () => {
    const resolver = new ToolCallDependencyResolver();
    const toolDefinitions = {
      getWeather: {
        name: "getWeather",
        description: "Get the weather for a location",
        parameters: {
          location: { type: "string" },
        },
      },
      getStocks: {
        name: "getStocks",
        description: "Get stock prices",
        parameters: {
          ticker: { type: "string" },
        },
      },
    };
    const requestedCalls = [
      { tool_name: "getWeather", input: { location: "New York" } },
      { tool_name: "getStocks", input: { ticker: "GOOGL" } },
    ];

    const result = await resolver.resolveDependencies(requestedCalls, toolDefinitions);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.tool_name)).toEqual(["getWeather", "getStocks"]);
  });

  it("should resolve dependencies when one tool depends on another's output", async () => {
    const resolver = new ToolCallDependencyResolver();
    const toolDefinitions = {
      getWeather: {
        name: "getWeather",
        description: "Get the weather for a location",
        parameters: {
          location: { type: "string" },
        },
      },
      getForecast: {
        name: "getForecast",
        description: "Get a forecast based on weather data",
        parameters: {
          location: { type: "string" },
          weather_data: { type: "string" }, // Depends on weather data
        },
      },
    };
    const requestedCalls = [
      { tool_name: "getWeather", input: { location: "London" } },
      { tool_name: "getForecast", input: { location: "London", weather_data: "Sunny" } },
    ];

    const result = await resolver.resolveDependencies(requestedCalls, toolDefinitions);
    expect(result).toHaveLength(2);
    // The order should reflect the dependency chain: getWeather first, then getForecast
    expect(result[0].tool_name).toBe("getWeather");
    expect(result[1].tool_name).toBe("getForecast");
  });

  it("should handle circular dependencies by throwing an error", async () => {
    const resolver = new ToolCallDependencyResolver();
    const toolDefinitions = {
      toolA: {
        name: "toolA",
        description: "A tool",
        parameters: {
          inputB: { type: "string" },
        },
      },
      toolB: {
        name: "toolB",
        description: "A tool",
        parameters: {
          inputA: { type: "string" },
        },
      },
    };
    const requestedCalls = [
      { tool_name: "toolA", input: { inputB: "valueB" } },
      { tool_name: "toolB", input: { inputA: "valueA" } },
    ];

    await expect(async () => {
      await resolver.resolveDependencies(requestedCalls, toolDefinitions);
    }).rejects.toThrow("Circular dependency detected");
  });
});