import { describe, it, expect, vi } from "vitest";
import { ServiceDegradationPolicyManager } from "../src/policy/service-degradation-policy-manager";

describe("ServiceDegradationPolicyManager", () => {
  it("should initialize correctly with a policy and service call", async () => {
    const mockPolicy = {
      threshold: 0.8,
      windowSize: 5,
    };
    const mockServiceCall = vi.fn(async () => ({
      result: "success",
      metrics: {
        latencyMs: 100,
        errorRate: 0.1,
        cost: 5,
        resourceUsage: 0.5,
      },
    }));

    const manager = new ServiceDegradationPolicyManager(mockPolicy, mockServiceCall);
    expect(manager).toBeDefined();
  });

  it("should determine degradation status based on service metrics", async () => {
    const mockPolicy = {
      threshold: 0.7,
      windowSize: 3,
    };
    const mockServiceCall = vi.fn();
    const manager = new ServiceDegradationPolicyManager(mockPolicy, mockServiceCall);

    // Simulate a degraded state (e.g., high error rate)
    mockServiceCall.mockResolvedValueOnce({
      result: "data",
      metrics: {
        latencyMs: 500,
        errorRate: 0.9, // Above threshold
        cost: 10,
        resourceUsage: 0.9,
      },
    });

    const status = await manager.checkStatus();
    expect(status).toBe("DEGRADED");
  });

  it("should return normal status when metrics are within policy thresholds", async () => {
    const mockPolicy = {
      threshold: 0.8,
      windowSize: 5,
    };
    const mockServiceCall = vi.fn();
    const manager = new ServiceDegradationPolicyManager(mockPolicy, mockServiceCall);

    // Simulate a normal state
    mockServiceCall.mockResolvedValueOnce({
      result: "data",
      metrics: {
        latencyMs: 100,
        errorRate: 0.1, // Below threshold
        cost: 1,
        resourceUsage: 0.2,
      },
    });

    const status = await manager.checkStatus();
    expect(status).toBe("NORMAL");
  });
});