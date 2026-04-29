import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV152,
  GraphMetadata,
  EnrichedValidationContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v152";

describe("StructuredToolOutputValidationContextEnricherV152", () => {
  it("should enrich context with graph metadata when provided", async () => {
    const mockContext = {
      originalContext: "some original context",
    } as any;
    const mockGraphMetadata: GraphMetadata = {
      dependencies: [
        { sourceId: "A", targetId: "B" },
      ],
      resourceConstraints: [
        { resourceName: "file", limit: 10, unit: "count" },
      ],
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV152();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      mockGraphMetadata
    );

    expect(enrichedContext).toHaveProperty("graphMetadata");
    expect(enrichedContext.graphMetadata).toEqual(
      expect.objectContaining({
        dependencies: expect.arrayContaining([
          { sourceId: "A", targetId: "B" },
        ]),
        resourceConstraints: expect.arrayContaining([
          { resourceName: "file", limit: 10, unit: "count" },
        ]),
      })
    );
  });

  it("should handle empty graph metadata gracefully", async () => {
    const mockContext = {
      originalContext: "empty context",
    } as any;
    const mockGraphMetadata: GraphMetadata = {
      dependencies: [],
      resourceConstraints: [],
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV152();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      mockGraphMetadata
    );

    expect(enrichedContext).toHaveProperty("graphMetadata");
    expect(enrichedContext.graphMetadata).toEqual({
      dependencies: [],
      resourceConstraints: [],
    });
  });

  it("should return the original context if graph metadata is null or undefined", async () => {
    const mockContext = {
      originalContext: "context to check",
    } as any;

    const enricher = new StructuredToolOutputValidationContextEnricherV152();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      undefined
    );

    expect(enrichedContext).toHaveProperty("graphMetadata");
    expect(enrichedContext.graphMetadata).toEqual({
      dependencies: [],
      resourceConstraints: [],
    });
  });
});