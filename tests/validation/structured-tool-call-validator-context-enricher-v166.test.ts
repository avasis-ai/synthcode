import { describe, it, expect } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV166,
} from "../src/validation/structured-tool-call-validator-context-enricher-v166";

describe("StructuredToolCallValidatorContextEnricherV166", () => {
  it("should correctly enrich context with basic state information", async () => {
    const mockContext = {
      messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
      processState: {
        currentStep: "START",
        activeGuardrails: [{ name: "GuardA", isActive: true, severity: "LOW" }],
        resourceMetrics: {
          cpuUsagePercent: 10,
          memoryUsageBytes: 1024,
          apiCallCount: 1,
        },
      },
    };
    const enrichedContext = await StructuredToolCallValidatorContextEnricherV166.enrich(
      mockContext
    );

    expect(enrichedContext).toHaveProperty("processState");
    expect(enrichedContext.processState.currentStep).toBe("START");
    expect(enrichedContext.processState.resourceMetrics.apiCallCount).toBe(1);
  });

  it("should handle an empty message history gracefully", async () => {
    const mockContext = {
      messages: [],
      processState: {
        currentStep: "PLANNING",
        activeGuardrails: [],
        resourceMetrics: {
          cpuUsagePercent: 5,
          memoryUsageBytes: 512,
          apiCallCount: 0,
        },
      },
    };
    const enrichedContext = await StructuredToolCallValidatorContextEnricherV166.enrich(
      mockContext
    );

    expect(enrichedContext).toHaveProperty("messages");
    expect(enrichedContext.messages).toEqual([]);
    expect(enrichedContext.processState.currentStep).toBe("PLANNING");
  });

  it("should correctly update context when process state changes", async () => {
    const mockContext = {
      messages: [{ role: "assistant", content: [{ type: "text", text: "Thinking..." }] }],
      processState: {
        currentStep: "EXECUTION",
        activeGuardrails: [{ name: "GuardB", isActive: false, severity: "MEDIUM" }],
        resourceMetrics: {
          cpuUsagePercent: 50,
          memoryUsageBytes: 4096,
          apiCallCount: 5,
        },
      },
    };
    const enrichedContext = await StructuredToolCallValidatorContextEnricherV166.enrich(
      mockContext
    );

    expect(enrichedContext.processState.currentStep).toBe("EXECUTION");
    expect(enrichedContext.processState.activeGuardrails).toHaveLength(1);
    expect(enrichedContext.processState.resourceMetrics.cpuUsagePercent).toBe(50);
  });
});