import { describe, it, expect, beforeEach } from "vitest";
import { GlobalQuotaManager, QuotaDefinition, QuotaKey } from "../src/quota/global-quota-manager";

describe("GlobalQuotaManager", () => {
  let manager: GlobalQuotaManager;
  const initialDefinitions: QuotaDefinition[] = [
    { key: "LLM_TOKENS", limit: 1000, unit: "tokens" },
    { key: "API_CALLS", limit: 50, unit: "calls" },
  ];

  beforeEach(() => {
    manager = new GlobalQuotaManager(initialDefinitions);
  });

  it("should initialize the quota store correctly with provided definitions", () => {
    // Accessing internal state for testing purposes (assuming a getter or direct access is possible/necessary)
    // Since we cannot modify the class, we rely on the public interface if available, or assume internal state check is sufficient.
    // For this test, we assume the constructor correctly sets up the initial state.
    // We'll simulate checking the initial state by calling a method that relies on it (like getQuotaInfo).
    expect(manager.getQuotaInfo("LLM_TOKENS")).toEqual({
      currentUsed: 0,
      limit: 1000,
      unit: "tokens",
    });
    expect(manager.getQuotaInfo("API_CALLS")).toEqual({
      currentUsed: 0,
      limit: 50,
      unit: "calls",
    });
  });

  it("should increment the used quota when consumeQuota is called", () => {
    const initialTokens = manager.getQuotaInfo("LLM_TOKENS").currentUsed;
    manager.consumeQuota("LLM_TOKENS", 150);
    expect(manager.getQuotaInfo("LLM_TOKENS").currentUsed).toBe(initialTokens + 150);
  });

  it("should throw an error when attempting to consume quota exceeding the limit", () => {
    // Set the quota close to the limit first
    manager.consumeQuota("API_CALLS", 49);

    // Attempt to consume more than remaining
    expect(() => {
      manager.consumeQuota("API_CALLS", 2);
    }).toThrow("Exceeded quota limit for API_CALLS");

    // Verify the quota was not changed after the failed attempt
    expect(manager.getQuotaInfo("API_CALLS").currentUsed).toBe(49);
  });
});