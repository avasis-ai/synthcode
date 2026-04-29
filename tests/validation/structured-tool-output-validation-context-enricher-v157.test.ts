import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV157,
} from "../src/validation/structured-tool-output-validation-context-enricher-v157";

describe("StructuredToolOutputValidationContextEnricherV157", () => {
  it("should enrich context with basic history and metadata when provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV157();
    const originalContext: Record<string, unknown> = {
      userQuery: "What is the capital of France?",
    };
    const history: ExecutionHistory = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] },
        { role: "model", content: [{ type: "text", text: "The capital of France is Paris." }] },
      ],
      toolOutputs: {
        search: { result: "Paris, France" },
      },
    };
    const dependencyGraph: DependencyGraph = {
      search: {
        dependencies: [],
        metadata: { source: "Google Search" },
      },
    };

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history,
      dependencyGraph,
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.originalContext).toEqual(originalContext);
    expect(enrichedContext?.history).toEqual(history);
    expect(enrichedContext?.dependencyGraph).toEqual(dependencyGraph);
    expect(enrichedContext?.enrichedMetadata).toBeDefined();
  });

  it("should handle empty history and dependency graph gracefully", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV157();
    const originalContext: Record<string, unknown> = {};
    const history: ExecutionHistory = {
      messages: [],
      toolOutputs: {},
    };
    const dependencyGraph: DependencyGraph = {};

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history,
      dependencyGraph,
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.originalContext).toEqual(originalContext);
    expect(enrichedContext?.history).toEqual(history);
    expect(enrichedContext?.dependencyGraph).toEqual(dependencyGraph);
    expect(enrichedContext?.enrichedMetadata).toEqual({});
  });

  it("should correctly merge and enrich metadata from history and graph", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV157();
    const originalContext: Record<string, unknown> = {
      sessionId: "test-session-123",
    };
    const history: ExecutionHistory = {
      messages: [
        { role: "user", content: [{ type: "text", text: "Check weather" }] },
      ],
      toolOutputs: {
        weatherApi: { temperature: "25C" },
      },
    };
    const dependencyGraph: DependencyGraph = {
      weatherApi: {
        dependencies: ["location"],
        metadata: { source: "WeatherService", version: "1.0" },
      },
    };

    const enrichedContext = await enricher.enrichContext(
      originalContext,
      history,
      dependencyGraph,
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.enrichedMetadata).toEqual({
      sessionId: "test-session-123",
      toolOutputs: {
        weatherApi: { temperature: "25C" },
      },
      dependencyGraph: {
        weatherApi: {
          dependencies: ["location"],
          metadata: { source: "WeatherService", version: "1.0" },
        },
      },
    });
  });
});