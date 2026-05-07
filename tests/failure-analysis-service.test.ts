import { describe, it, expect, vi } from "vitest";
import { FailureAnalysisService } from "../src/failure/failure-analysis-service";

describe("FailureAnalysisService", () => {
  it("should generate a basic remediation plan for a simple failure", async () => {
    const service = new FailureAnalysisService();
    const mockFailureReport = {
      error: new Error("Network timeout"),
      context: {
        lastAttempt: 3,
        serviceName: "PaymentGateway",
      },
      failedStep: "connect_to_gateway",
      attemptCount: 3,
    };

    const plan = await service.analyzeFailure(mockFailureReport);

    expect(plan).toBeDefined();
    expect(plan!.diagnosis).toContain("Network timeout");
    expect(plan!.confidenceScore).toBeGreaterThanOrEqual(0.5);
    expect(plan!.steps).toHaveLength(1);
    expect(plan!.steps[0].action).toBe("retry");
  });

  it("should suggest halting if the failure is critical and context suggests no recovery", async () => {
    const service = new FailureAnalysisService();
    const mockFailureReport = {
      error: new Error("Authentication failed: Invalid credentials"),
      context: {
        lastAttempt: 1,
        serviceName: "AuthService",
        credentialsProvided: false,
      },
      failedStep: "authenticate_user",
      attemptCount: 1,
    };

    const plan = await service.analyzeFailure(mockFailureReport);

    expect(plan).toBeDefined();
    expect(plan!.diagnosis).toContain("Authentication failed");
    expect(plan!.steps[0].action).toBe("halt");
    expect(plan!.steps[0].details).toContain("credentials");
  });

  it("should suggest scope adjustment if the failure is due to resource limits", async () => {
    const service = new FailureAnalysisService();
    const mockFailureReport = {
      error: new Error("Rate limit exceeded"),
      context: {
        lastAttempt: 5,
        serviceName: "DataIngestor",
        resourceLimitReached: true,
      },
      failedStep: "fetch_data",
      attemptCount: 5,
    };

    const plan = await service.analyzeFailure(mockFailureReport);

    expect(plan).toBeDefined();
    expect(plan!.diagnosis).toContain("Rate limit exceeded");
    expect(plan!.steps[0].action).toBe("scope_adjustment");
    expect(plan!.steps[0].details).toContain("reduce scope");
  });
});