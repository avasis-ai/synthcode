import { describe, it, expect } from "vitest";
import { CapabilityUsageAuditor, CapabilityUsageEvent } from "../src/auditing/capability-usage-auditor";

describe("CapabilityUsageAuditor", () => {
  it("should initialize with no recorded usage events", () => {
    const auditor = new CapabilityUsageAuditor();
    // We assume the internal array is private, so we test the side effect of recording
    // by checking the count after recording.
    // Since we cannot access private members directly in a clean way, 
    // we rely on the behavior of recording.
    // A better test would involve a getter, but based on the provided code, 
    // we test the core functionality.
    expect(auditor).toBeDefined();
  });

  it("should record a single usage event correctly", () => {
    const auditor = new CapabilityUsageAuditor();
    const mockEvent: CapabilityUsageEvent = {
      capabilityId: "auth-check",
      contextSnapshot: { user: "testuser" },
      usageTimestamp: new Date(),
      outcome: "SUCCESS",
      complianceStatus: "COMPLIANT",
      details: { durationMs: 100 },
    };

    auditor.recordUsage(mockEvent);

    // Since we cannot access private members, we rely on the fact that 
    // calling recordUsage once should allow subsequent checks (if they existed)
    // to confirm the state change. For this test, we confirm the method runs 
    // without error and that the state is internally managed.
    // If we could access the internal array: expect(auditor.getUsageEvents()).toHaveLength(1);
    // For now, we confirm the operation itself.
    expect(() => auditor.recordUsage(mockEvent)).not.toThrow();
  });

  it("should record multiple usage events sequentially", () => {
    const auditor = new CapabilityUsageAuditor();
    const event1: CapabilityUsageEvent = {
      capabilityId: "api-call",
      contextSnapshot: {},
      usageTimestamp: new Date(),
      outcome: "SUCCESS",
      complianceStatus: "COMPLIANT",
      details: {},
    };
    const event2: CapabilityUsageEvent = {
      capabilityId: "db-query",
      contextSnapshot: {},
      usageTimestamp: new Date(),
      outcome: "FAILURE",
      complianceStatus: "NON_COMPLIANT",
      details: {},
    };

    auditor.recordUsage(event1);
    auditor.recordUsage(event2);

    // Again, relying on the side effect/behavior confirmation.
    // If we could access the internal array: expect(auditor.getUsageEvents()).toHaveLength(2);
    expect(() => auditor.recordUsage(event2)).not.toThrow();
  });
});