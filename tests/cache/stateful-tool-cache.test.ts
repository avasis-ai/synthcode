import { describe, it, expect, vi } from "vitest";
import { StatefulToolCache } from "../src/cache/stateful-tool-cache";

describe("StatefulToolCache", () => {
  it("should correctly set and get a cache entry", () => {
    const mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const keyGenerator = vi.fn((toolName, inputs, sessionId) => `${toolName}:${JSON.stringify(inputs)}:${sessionId}`);
    const cache = new StatefulToolCache(mockStorage, keyGenerator);

    const toolName = "testTool";
    const inputs = { query: "test" };
    const sessionId = "session123";
    const cacheKey = "testTool:{\"query\":\"test\"}:session123";
    const testValue = { result: "cached_data" };

    mockStorage.get.mockReturnValue(undefined);
    cache.set(toolName, inputs, sessionId, testValue);

    expect(mockStorage.set).toHaveBeenCalledWith(cacheKey, testValue, 1000);
  });

  it("should generate a unique key based on tool name, inputs, and session ID", () => {
    const mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const keyGenerator = vi.fn((toolName, inputs, sessionId) => `${toolName}:${JSON.stringify(inputs)}:${sessionId}`);
    const cache = new StatefulToolCache(mockStorage, keyGenerator);

    const toolName = "weather";
    const inputs = { city: "London" };
    const sessionId = "session456";

    cache.set(toolName, inputs, sessionId, { data: "weather_data" });

    expect(keyGenerator).toHaveBeenCalledWith(toolName, inputs, sessionId);
    expect(keyGenerator).toHaveBeenCalledTimes(1);
  });

  it("should delete a cache entry when explicitly told to", () => {
    const mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const keyGenerator = vi.fn((toolName, inputs, sessionId) => `${toolName}:${JSON.stringify(inputs)}:${sessionId}`);
    const cache = new StatefulToolCache(mockStorage, keyGenerator);

    const toolName = "calculator";
    const inputs = { a: 1, b: 2 };
    const sessionId = "session789";
    const cacheKey = "calculator:{\"a\":1,\"b\":2\":session789";

    cache.delete(toolName, inputs, sessionId);

    expect(mockStorage.delete).toHaveBeenCalledWith(cacheKey);
  });
});