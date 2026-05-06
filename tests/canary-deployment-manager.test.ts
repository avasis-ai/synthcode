import { describe, it, expect, vi } from "vitest";
import { CanaryDeploymentManager } from "../src/canary-deployment-manager";

describe("CanaryDeploymentManager", () => {
  it("should initialize correctly with required context", () => {
    const mockContext = {
      requestId: "test-request-id",
      userContext: {
        userId: "user-123",
        planId: "plan-abc",
      },
    };
    const manager = new CanaryDeploymentManager(mockContext);
    expect(manager).toBeDefined();
    expect(manager.context.requestId).toBe("test-request-id");
  });

  it("should correctly calculate the canary percentage based on user context", () => {
    const mockContext = {
      requestId: "test-request-id",
      userContext: {
        userId: "user-canary-eligible",
        planId: "plan-premium",
      },
    };
    const manager = new CanaryDeploymentManager(mockContext);
    // Assuming the logic checks for specific user/plan combinations
    expect(manager.getCanaryPercentage()).toBe(10);
  });

  it("should default to 0% canary when user context is not eligible", () => {
    const mockContext = {
      requestId: "test-request-id",
      userContext: {
        userId: "user-standard",
        planId: "plan-basic",
      },
    };
    const manager = new CanaryDeploymentManager(mockContext);
    expect(manager.getCanaryPercentage()).toBe(0);
  });
});