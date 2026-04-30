import { describe, it, expect } from "vitest";
import { enrichContext } from "../src/validation/structured-tool-call-validator-context-enricher-v154";

describe("enrichContext", () => {
  it("should enrich context with basic resource usage and temporal data", () => {
    const messages = [{ role: "user", content: [{ type: "text", text: "Hello" }] }];
    const resourceUsage = { cpuUsage: 0.1, memoryUsageMB: 1024, networkLatencyMs: 50 };
    const temporalContext = { timestamp: Date.now(), sessionDurationSeconds: 300, isWeekend: false };
    const sessionState = { userId: "user123", currentStep: 2, hasPermissions: true };

    const enriched = enrichContext(
      messages,
      resourceUsage,
      temporalContext,
      sessionState
    );

    expect(enriched.messages).toEqual(messages);
    expect(enriched.resourceUsage).toEqual(resourceUsage);
    expect(enriched.temporalContext).toEqual(temporalContext);
    expect(enriched.sessionState).toEqual(sessionState);
    expect(enriched.contextVersion).toBe("v1.54");
  });

  it("should handle empty message history", () => {
    const messages: any[] = [];
    const resourceUsage = { cpuUsage: 0.0, memoryUsageMB: 0, networkLatencyMs: 0 };
    const temporalContext = { timestamp: 0, sessionDurationSeconds: 0, isWeekend: false };
    const sessionState = { userId: "", currentStep: 0, hasPermissions: false };

    const enriched = enrichContext(
      messages,
      resourceUsage,
      temporalContext,
      sessionState
    );

    expect(enriched.messages).toEqual([]);
    expect(enriched.contextVersion).toBe("v1.54");
  });

  it("should correctly update context version when called", () => {
    const messages = [{ role: "user", content: [] }];
    const resourceUsage = { cpuUsage: 0.5, memoryUsageMB: 2048, networkLatencyMs: 100 };
    const temporalContext = { timestamp: Date.now(), sessionDurationSeconds: 120, isWeekend: true };
    const sessionState = { userId: "admin", currentStep: 5, hasPermissions: true };

    const enriched = enrichContext(
      messages,
      resourceUsage,
      temporalContext,
      sessionState
    );

    // Assuming the function might append or confirm the version
    expect(enriched.contextVersion).toBe("v1.54");
  });
});