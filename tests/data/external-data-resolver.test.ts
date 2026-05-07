import { describe, it, expect } from "vitest";
import { ExternalDataResolver } from "../data/external-data-resolver";

describe("ExternalDataResolver", () => {
  it("should resolve external data when provided with valid inputs", async () => {
    const resolver = new ExternalDataResolver();
    const mockData = {
      user_id: "user123",
      query: "What is the weather in London?",
    };
    const result = await resolver.resolve(mockData);
    expect(result).toEqual({
      data: "The weather in London is sunny and 20C.",
      source: "weather_api",
    });
  });

  it("should handle missing or invalid inputs gracefully", async () => {
    const resolver = new ExternalDataResolver();
    const mockData = {
      user_id: null,
      query: undefined,
    };
    const result = await resolver.resolve(mockData);
    expect(result).toEqual({
      data: null,
      source: null,
    });
  });

  it("should return default values when no external data is needed", async () => {
    const resolver = new ExternalDataResolver();
    const mockData = {
      user_id: "user456",
      query: "Hello, how are you?",
    };
    const result = await resolver.resolve(mockData);
    expect(result).toEqual({
      data: null,
      source: null,
    });
  });
});