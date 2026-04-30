import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV163AdvancedAdvanced,
} from "../src/validation/structured-tool-output-validation-context-enricher-v163-advanced-advanced";
import {Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock} from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricherV163AdvancedAdvanced", () => {
  it("should enrich context when all context sources provide data", async () => {
    const mockFetchContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromFetch: "fetched_data",
    });
    const mockGetSourceName = () => "mock_source";

    const enricher = new StructuredToolOutputValidationContextEnricherV163AdvancedAdvanced({
      fetchContext: mockFetchContext,
      temporalContextSource: {
        fetchContext: mockFetchContext,
        getSourceName: mockGetSourceName,
      },
      resourceContextSource: {
        fetchContext: mockFetchContext,
        getSourceName: mockGetSourceName,
      },
      knowledgeGraphContextSource: {
        fetchContext: mockFetchContext,
        getSourceName: mockGetSourceName,
      },
    });

    const baseContext: Record<string, unknown> = {
      initial: "base_info",
    };

    const enrichedContext = await enricher.enrichContext(baseContext);

    expect(enrichedContext).toHaveProperty("contextFromFetch", "fetched_data");
    expect(enrichedContext).toHaveProperty("contextFromTemporal", "fetched_data");
    expect(enrichedContext).toHaveProperty("contextFromResource", "fetched_data");
    expect(enrichedContext).toHaveProperty("contextFromKnowledgeGraph", "fetched_data");
    expect(enrichedContext).toHaveProperty("initial", "base_info");
  });

  it("should handle missing context sources gracefully", async () => {
    const mockFetchContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromFetch: "fetched_data",
    });

    const enricher = new StructuredToolOutputValidationContextEnricherV163AdvancedAdvanced({
      fetchContext: mockFetchContext,
      temporalContextSource: undefined as any,
      resourceContextSource: undefined as any,
      knowledgeGraphContextSource: undefined as any,
    });

    const baseContext: Record<string, unknown> = {
      initial: "base_info",
    };

    const enrichedContext = await enricher.enrichContext(baseContext);

    expect(enrichedContext).toHaveProperty("contextFromFetch", "fetched_data");
    expect(enrichedContext).toHaveProperty("initial", "base_info");
    expect(enrichedContext).not.toHaveProperty("contextFromTemporal");
    expect(enrichedContext).not.toHaveProperty("contextFromResource");
    expect(enrichedContext).not.toHaveProperty("contextFromKnowledgeGraph");
  });

  it("should merge context from multiple sources correctly", async () => {
    const mockFetchContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromFetch: "fetched_data",
    });
    const mockTemporalContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromTemporal: "temporal_data",
    });
    const mockResourceContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromResource: "resource_data",
    });
    const mockKnowledgeGraphContext = async (baseContext: Record<string, unknown>): Promise<Record<string, unknown>> => ({
      ...baseContext,
      contextFromKnowledgeGraph: "kg_data",
    });

    const enricher = new StructuredToolOutputValidationContextEnricherV163AdvancedAdvanced({
      fetchContext: mockFetchContext,
      temporalContextSource: {
        fetchContext: mockTemporalContext,
        getSourceName: () => "temporal",
      },
      resourceContextSource: {
        fetchContext: mockResourceContext,
        getSourceName: () => "resource",
      },
      knowledgeGraphContextSource: {
        fetchContext: mockKnowledgeGraphContext,
        getSourceName: () => "kg",
      },
    });

    const baseContext: Record<string, unknown> = {
      initial: "base_info",
      sharedKey: "shared_base",
    };

    const enrichedContext = await enricher.enrichContext(baseContext);

    expect(enrichedContext).toHaveProperty("initial", "base_info");
    expect(enrichedContext).toHaveProperty("sharedKey", "shared_base");
    expect(enrichedContext).toHaveProperty("contextFromFetch", "fetched_data");
    expect(enrichedContext).toHaveProperty("contextFromTemporal", "temporal_data");
    expect(enrichedContext).toHaveProperty("contextFromResource", "resource_data");
    expect(enrichedContext).toHaveProperty("contextFromKnowledgeGraph", "kg_data");
  });
});