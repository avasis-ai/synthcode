import { describe, it, expect, vi } from "vitest";
import { AdaptiveRecoveryEngine } from "../src/recovery/adaptive-recovery-engine";

describe("AdaptiveRecoveryEngine", () => {
  it("should initialize with a valid policy graph", async () => {
    const mockPolicy: any = {
      RateLimit: [
        async (context: any) => {
          if (context.attemptCount < 2) {
            return { success: false, result: null, nextFailure: { type: "RateLimit", message: "Still rate limited", originalAttempt: null, attemptCount: context.attemptCount + 1 } };
          }
          return { success: true, result: "Success after retries" };
        }
      ]
    };
    const engine = new AdaptiveRecoveryEngine(mockPolicy);
    expect(engine).toBeInstanceOf(AdaptiveRecoveryEngine);
  });

  it("should execute the correct recovery steps for a given failure type", async () => {
    const mockPolicy: any = {
      RateLimit: [
        async (context: any) => {
          if (context.attemptCount < 1) {
            return { success: false, result: null, nextFailure: { type: "RateLimit", message: "Retry 1", originalAttempt: null, attemptCount: context.attemptCount + 1 } };
          }
          return { success: true, result: "Success on second attempt" };
        }
      ]
    };
    const engine = new AdaptiveRecoveryEngine(mockPolicy);
    const initialContext = { type: "RateLimit", message: "Initial failure", originalAttempt: {}, attemptCount: 0 };

    // Simulate the first failure (should trigger the first step)
    let context = initialContext;
    let result = await engine.executeRecovery(context);

    // Check if the first step failed and provided a next context
    expect(result.success).toBe(false);
    expect(result.nextFailure?.type).toBe("RateLimit");
    expect(result.nextFailure?.attemptCount).toBe(1);

    // Simulate the second failure (should trigger the second step and succeed)
    context = result.nextFailure;
    result = await engine.executeRecovery(context);

    // Check if the second step succeeded
    expect(result.success).toBe(true);
    expect(result.result).toBe("Success on second attempt");
  });

  it("should handle unknown failure types gracefully", async () => {
    const mockPolicy: any = {};
    const engine = new AdaptiveRecoveryEngine(mockPolicy);
    const unknownContext = { type: "UnknownFailure", message: "Unexpected error", originalAttempt: {}, attemptCount: 0 };

    const result = await engine.executeRecovery(unknownContext);

    // Expect immediate failure and no recovery action taken
    expect(result.success).toBe(false);
    expect(result.result).toBeNull();
    expect(result.nextFailure).toBeUndefined();
  });
});