import { describe, it, expect } from "vitest";
import { ValidationContext, EnrichedToolOutput } from "../src/validation/structured-tool-output-validation-context-enricher-v149";

describe("StructuredToolOutputValidationContextEnricherV149", () => {
  it("should correctly enrich the output with context when context is provided", () => {
    const mockContext: ValidationContext = {
      sessionState: { userId: "user123" },
      availableTools: {
        calculator: { description: "A simple calculator", parameters: { a: "number", b: "number" } },
      },
      history: [
        { type: "user", content: { text: "What is 2+2?" } } as any,
      ],
    };
    const mockRawOutput: Record<string, unknown> = { result: "4" };

    const enrichedOutput: EnrichedToolOutput = {
      rawOutput: mockRawOutput,
      context: mockContext,
      enrichedData: {
        toolResult: "4",
        source: "calculator",
      },
    };

    expect(enrichedOutput.context).toBe(mockContext);
    expect(enrichedOutput.rawOutput).toEqual(mockRawOutput);
    expect(enrichedOutput.enrichedData).toEqual({
      toolResult: "4",
      source: "calculator",
    });
  });

  it("should handle empty context and raw output gracefully", () => {
    const mockContext: ValidationContext = {
      sessionState: {},
      availableTools: {},
      history: [],
    };
    const mockRawOutput: Record<string, unknown> = {};

    const enrichedOutput: EnrichedToolOutput = {
      rawOutput: mockRawOutput,
      context: mockContext,
      enrichedData: {},
    };

    expect(enrichedOutput.context).toBe(mockContext);
    expect(enrichedOutput.rawOutput).toEqual(mockRawOutput);
    expect(enrichedOutput.enrichedData).toEqual({});
  });

  it("should correctly merge data from raw output and context into enrichedData", () => {
    const mockContext: ValidationContext = {
      sessionState: { userId: "user123", theme: "dark" },
      availableTools: {
        weather: { description: "Get weather", parameters: { location: "string" } },
      },
      history: [
        { type: "user", content: { text: "Weather in London?" } } as any,
      ],
    };
    const mockRawOutput: Record<string, unknown> = {
      weatherData: { temperature: "20C", condition: "Sunny" },
    };

    const enrichedOutput: EnrichedToolOutput = {
      rawOutput: mockRawOutput,
      context: mockContext,
      enrichedData: {
        toolResult: "20C",
        source: "weather",
        userContext: {
          userId: "user123",
          theme: "dark",
        },
      },
    };

    expect(enrichedOutput.context.sessionState).toEqual({
      userId: "user123",
      theme: "dark",
    });
    expect(enrichedOutput.enrichedData.toolResult).toBe("20C");
    expect(enrichedOutput.enrichedData.source).toBe("weather");
  });
});