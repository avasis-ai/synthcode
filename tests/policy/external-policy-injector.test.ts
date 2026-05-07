import { describe, it, expect, vi } from "vitest";
import { ExternalPolicy, PolicyScope, PolicySource } from "../src/policy/external-policy-injector";

describe("ExternalPolicyInjector", () => {
  it("should correctly initialize with default values and handle basic policy creation", () => {
    const injector = new ExternalPolicyInjector();
    expect(injector.policies).toBeInstanceOf(Array);
    expect(injector.policies.length).toBe(0);

    const policy: ExternalPolicy = {
      source: PolicySource.external_system,
      scope: PolicyScope.global,
      durationMs: 3600000,
      isActive: true,
      rules: [{ key: "rate_limit", value: 10, description: "Global rate limit" }],
      reason: "Standard operational policy",
    };

    const result = injector.injectPolicy(policy);
    expect(result).toBe(true);
    expect(injector.policies).toHaveLength(1);
    expect(injector.policies[0]).toEqual(policy);
  });

  it("should update the policy status and handle policy expiration checks", () => {
    const injector = new ExternalPolicyInjector();
    const initialPolicy: ExternalPolicy = {
      source: PolicySource.maintenance,
      scope: PolicyScope.session,
      durationMs: 1000,
      isActive: true,
      rules: [],
      reason: "Maintenance window",
    };

    injector.injectPolicy(initialPolicy);

    // Simulate time passing (e.g., 1500ms)
    vi.useFakeTimers();
    vi.advanceTimersByTime(1500);

    // Check if the policy is marked inactive after expiration
    const expiredPolicy = injector.getPolicy(initialPolicy.source, PolicyScope.session);
    expect(expiredPolicy).toBeDefined();
    expect(expiredPolicy!.isActive).toBe(false);

    vi.useRealTimers();
  });

  it("should handle multiple policies and correctly retrieve a specific policy", () => {
    const injector = new ExternalPolicyInjector();
    const policy1: ExternalPolicy = {
      source: PolicySource.external_system,
      scope: PolicyScope.global,
      durationMs: 0,
      isActive: true,
      rules: [],
      reason: "Policy A",
    };
    const policy2: ExternalPolicy = {
      source: PolicySource.emergency,
      scope: PolicyScope.tool,
      durationMs: 0,
      isActive: true,
      rules: [],
      reason: "Policy B",
    };

    injector.injectPolicy(policy1);
    injector.injectPolicy(policy2);

    const retrievedPolicy1 = injector.getPolicy(PolicySource.external_system, PolicyScope.global);
    const retrievedPolicy2 = injector.getPolicy(PolicySource.emergency, PolicyScope.tool);

    expect(retrievedPolicy1).toEqual(policy1);
    expect(retrievedPolicy2).toEqual(policy2);
  });
});