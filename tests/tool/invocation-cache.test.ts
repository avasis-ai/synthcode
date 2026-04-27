import { describe, it, expect } from "vitest";
import { InvocationCache } from "../tool/invocation-cache";

describe("InvocationCache", () => {
  it("should correctly cache and retrieve tool invocation results", async () => {
    const cache = new InvocationCache();
    const toolName = "get_weather";
    const input = "London";
    const mockResult = { temperature: "15C", condition: "Cloudy" };

    // Mock the underlying tool execution (assuming it's async)
    const toolExecutor = async (toolName: string, input: string) => {
      if (toolName === toolName && input === input) {
        return mockResult;
      }
      throw new Error("Tool execution failed");
    };

    // First call: should execute the tool
    const result1 = await cache.invoke(toolName, input, toolExecutor);
    expect(result1).toEqual(mockResult);

    // Second call: should use the cache
    const result2 = await cache.invoke(toolName, input, toolExecutor);
    expect(result2).toEqual(mockResult);
  });

  it("should handle different inputs for the same tool name", async () => {
    const cache = new InvocationCache();
    const toolName = "search_database";
    const executor = async (toolName: string, input: string) => {
      if (input === "apple") return { data: "Apple Inc." };
      if (input === "banana") return { data: "Banana Co." };
      return null;
    };

    // Cache for "apple"
    await cache.invoke(toolName, "apple", executor);
    // Cache for "banana"
    await cache.invoke(toolName, "banana", executor);

    // Verify both were cached and retrieved correctly
    const resultApple = await cache.invoke(toolName, "apple", executor);
    const resultBanana = await cache.invoke(toolName, "banana", executor);

    expect(resultApple).toEqual({ data: "Apple Inc." });
    expect(resultBanana).toEqual({ data: "Banana Co." });
  });

  it("should treat different tool names as separate cache entries", async () => {
    const cache = new InvocationCache();
    const executor = async (toolName: string, input: string) => {
      if (toolName === "get_weather" && input === "Paris") return { city: "Paris", temp: "20C" };
      if (toolName === "get_stock" && input === "GOOG") return { ticker: "GOOG", price: 1500 };
      return null;
    };

    // Call for weather
    await cache.invoke("get_weather", "Paris", executor);
    // Call for stock
    await cache.invoke("get_stock", "GOOG", executor);

    // Retrieve weather result
    const weatherResult = await cache.invoke("get_weather", "Paris", executor);
    expect(weatherResult).toEqual({ city: "Paris", temp: "20C" });

    // Retrieve stock result
    const stockResult = await cache.invoke("get_stock", "GOOG", executor);
    expect(stockResult).toEqual({ ticker: "GOOG", price: 1500 });
  });
});