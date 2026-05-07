import { describe, it, expect } from "vitest";
import { ContextualObservationProcessor } from "../src/observation/contextual-observation-processor";

describe("ContextualObservationProcessor", () => {
  it("should correctly process a critical observation and suggest replanning", async () => {
    const processor = new ContextualObservationProcessor();
    const observation = {
      metadata: {
        source: "TestSource",
        timestamp: Date.now(),
        correlation_id: "corr-123",
      },
      severity: "CRITICAL",
      remediation_suggestion: "REPLAN",
      details: {
        error_message: "Critical failure detected",
        component: "AuthService",
      },
    };

    const result = await processor.processObservation(observation);

    expect(result.action).toBe("REPLAN");
    expect(result.target_step).toBe("AuthService");
    expect(result.message).toContain("Critical failure");
  });

  it("should handle a warning observation by suggesting parameter adjustment", async () => {
    const processor = new ContextualObservationProcessor();
    const observation = {
      metadata: {
        source: "TestSource",
        timestamp: Date.now(),
        correlation_id: "corr-456",
      },
      severity: "WARNING",
      remediation_suggestion: "ADJUST_PARAM",
      details: {
        warning_message: "Deprecated API used",
        parameter_name: "old_api_key",
      },
    };

    const result = await processor.processObservation(observation);

    expect(result.action).toBe("ADJUST_PARAM");
    expect(result.target_step).toBe("old_api_key");
    expect(result.message).toContain("Deprecated API");
  });

  it("should suggest skipping if the observation is informational and non-critical", async () => {
    const processor = new ContextualObservationProcessor();
    const observation = {
      metadata: {
        source: "TestSource",
        timestamp: Date.now(),
        correlation_id: "corr-789",
      },
      severity: "INFO",
      remediation_suggestion: "SKIP",
      details: {
        info_message: "Optional step completed successfully",
        step_name: "Cleanup",
      },
    };

    const result = await processor.processObservation(observation);

    expect(result.action).toBe("SKIP");
    expect(result.target_step).toBe("Cleanup");
    expect(result.message).toContain("Optional step");
  });
});