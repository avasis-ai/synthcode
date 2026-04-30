import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV161 } from "../src/validation/structured-tool-output-validation-context-enricher-v161";

describe("StructuredToolOutputValidationContextEnricherV161", () => {
  it("should enrich context with basic operational metrics when provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV161();
    const context = {
      baseContext: {
        messages: [],
      },
      operationalContext: {
        resourceMetrics: {
          cpuUsagePercent: 50.5,
          memoryUsageBytes: 1024 * 1024 * 50,
        },
        temporalContext: {
          timeSinceLastActionMs: 1500,
          timestamp: Date.now(),
        },
      },
    };
    const enrichedContext = await enricher.enrichContext(context);
    expect(enrichedContext.operationalContext).toBeDefined();
    expect(enrichedContext.operationalContext?.resourceMetrics?.cpuUsagePercent).toBe(50.5);
    expect(enrichedContext.operationalContext?.temporalContext?.timeSinceLastActionMs).toBe(1500);
  });

  it("should handle empty message history correctly", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV161();
    const context = {
      baseContext: {
        messages: [],
      },
      operationalContext: {
        resourceMetrics: {
          cpuUsagePercent: 10.0,
          memoryUsageBytes: 1024 * 1024 * 10,
        },
        temporalContext: {
          timeSinceLastActionMs: 0,
          timestamp: Date.now(),
        },
      },
    };
    const enrichedContext = await enricher.enrichContext(context);
    expect(enrichedContext.baseContext.messages).toEqual([]);
    expect(enrichedContext.operationalContext).toBeDefined();
  });

  it("should correctly merge existing context with new operational data", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV161();
    const initialContext = {
      baseContext: {
        messages: [{ role: "user", content: "Hello" }],
      },
      operationalContext: {
        resourceMetrics: {
          cpuUsagePercent: 20.0,
          memoryUsageBytes: 1024 * 1024 * 20,
        },
        temporalContext: {
          timeSinceLastActionMs: 500,
          timestamp: Date.now() - 500,
        },
      },
    };
    const newOperationalData = {
      resourceMetrics: {
        cpuUsagePercent: 25.0,
        memoryUsageBytes: 1024 * 1024 * 25,
      },
      temporalContext: {
        timeSinceLastActionMs: 100,
        timestamp: Date.now(),
      },
    };
    const context = {
      baseContext: initialContext.baseContext,
      operationalContext: {
        resourceMetrics: initialContext.operationalContext.resourceMetrics,
        temporalContext: initialContext.operationalContext.temporalContext,
      },
    };
    // Mocking the enricher to simulate merging logic if necessary, but testing the structure update
    // Assuming the enricher merges the new data into the existing structure
    const enrichedContext = await enricher.enrichContext({
        baseContext: initialContext.baseContext,
        operationalContext: {
            resourceMetrics: initialContext.operationalContext.resourceMetrics,
            temporalContext: initialContext.operationalContext.temporalContext,
        }
    }, newOperationalData);

    expect(enrichedContext.operationalContext?.resourceMetrics?.cpuUsagePercent).toBe(25.0);
    expect(enrichedContext.operationalContext?.temporalContext?.timeSinceLastActionMs).toBe(100);
    expect(enrichedContext.baseContext.messages).toEqual(initialContext.baseContext.messages);
  });
});