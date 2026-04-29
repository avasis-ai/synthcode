import { describe, it, expect } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV146,
} from "../src/validation/structured-tool-call-validator-context-enricher-v146";

describe("StructuredToolCallValidatorContextEnricherV146", () => {
  it("should correctly enrich context with default values when inputs are minimal", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV146();
    const context = {
      messages: [],
      resourceMetrics: {
        cpuUsageMs: 0,
        memoryUsageBytes: 0,
        networkLatencyMs: 0,
      },
      temporalConstraints: {
        startTime: 0,
        deadlineMs: 0,
      },
    };
    const enrichedContext = enricher.enrich(context);

    expect(enrichedContext).toEqual({
      messages: context.messages,
      resourceMetrics: context.resourceMetrics,
      temporalConstraints: context.temporalConstraints,
    });
  });

  it("should correctly merge provided resource metrics", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV146();
    const inputContext = {
      messages: [],
      resourceMetrics: {
        cpuUsageMs: 100,
        memoryUsageBytes: 2048,
        networkLatencyMs: 50,
      },
      temporalConstraints: {
        startTime: 1678886400000,
        deadlineMs: 1678886410000,
      },
    };
    const enrichedContext = enricher.enrich(inputContext);

    expect(enrichedContext.resourceMetrics.cpuUsageMs).toBe(100);
    expect(enrichedContext.resourceMetrics.memoryUsageBytes).toBe(2048);
    expect(enrichedContext.resourceMetrics.networkLatencyMs).toBe(50);
  });

  it("should correctly merge provided temporal constraints", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV146();
    const inputContext = {
      messages: [],
      resourceMetrics: {
        cpuUsageMs: 0,
        memoryUsageBytes: 0,
        networkLatencyMs: 0,
      },
      temporalConstraints: {
        startTime: 1700000000000,
        deadlineMs: 1700000000000 + 3600000,
      },
    };
    const enrichedContext = enricher.enrich(inputContext);

    expect(enrichedContext.temporalConstraints.startTime).toBe(1700000000000);
    expect(enrichedContext.temporalConstraints.deadlineMs).toBe(1700000000000 + 3600000);
  });
});