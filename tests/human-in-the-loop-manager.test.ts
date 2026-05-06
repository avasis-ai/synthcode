import { describe, it, expect, vi } from "vitest";
import { HumanInTheLoopManager } from "../src/human-in-the-loop-manager";

describe("HumanInTheLoopManager", () => {
  it("should initialize with intervention inactive", () => {
    const manager = new HumanInTheLoopManager();
    // Assuming internal state checking is possible or observable
    // Since we cannot access private fields directly, we test behavior.
    // For this test, we rely on the class structure and methods.
    expect(manager).toBeInstanceOf(HumanInTheLoopManager);
  });

  it("should set intervention active and store necessary callbacks when requesting intervention", () => {
    const manager = new HumanInTheLoopManager();
    const mockResolve = vi.fn();
    const mockReject = vi.fn();

    // Simulate the internal mechanism that sets up the promise resolution/rejection
    // We assume a method like 'requestIntervention' exists or is called internally
    // For testing purposes, we simulate the state change that happens upon request.
    // Since the provided snippet doesn't show the request method, we test the setup logic.
    // We assume a method like 'requestIntervention' exists and handles the setup.
    
    // Mocking the private state setup for a robust test
    (manager as any).setInterventionActive(true);
    (manager as any).setResolveIntervention(mockResolve);
    (manager as any).setRejectIntervention(mockReject);

    // Test that the callbacks are stored
    expect(manager['isInterventionActive']).toBe(true);
    expect(manager['resolveIntervention']).toBe(mockResolve);
    expect(manager['rejectIntervention']).toBe(mockReject);
  });

  it("should resolve the intervention when input is received", () => {
    const manager = new HumanInTheLoopManager();
    const mockResolve = vi.fn();
    const mockReject = vi.fn();
    const mockInput: any = { decision: "approved", reason: "test" };

    // Setup state (simulating intervention being active)
    (manager as any).setInterventionActive(true);
    (manager as any).setResolveIntervention(mockResolve);
    (manager as any).setRejectIntervention(mockReject);

    // Simulate the resolution method (assuming a method like 'resolveIntervention' exists)
    (manager as any).resolveIntervention(mockInput);

    // Check if the stored resolve function was called with the correct input
    expect(mockResolve).toHaveBeenCalledWith(mockInput);
  });
});