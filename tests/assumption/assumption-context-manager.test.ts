import { describe, it, expect, beforeEach } from "vitest";
import { AssumptionContextManager } from "../src/assumption/assumption-context-manager";

describe("AssumptionContextManager", () => {
  let manager: AssumptionContextManager;

  beforeEach(() => {
    manager = new AssumptionContextManager();
  });

  it("should initialize correctly and emit event on assumption added", async () => {
    const mockAssumption: Assumption = {
      id: "a1",
      source: "test",
      confidence: 0.9,
      expiration: new Date(),
      requiredSteps: ["step1"],
      isVerified: false,
      verificationHistory: [],
    };
    const eventSpy = vitest.fn();
    manager.on("assumptionAdded", eventSpy);

    await manager.addAssumption(mockAssumption);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(mockAssumption);
  });

  it("should update assumption verification status and emit event", async () => {
    const mockAssumption: Assumption = {
      id: "a2",
      source: "test",
      confidence: 0.8,
      expiration: new Date(),
      requiredSteps: ["stepA", "stepB"],
      isVerified: false,
      verificationHistory: [],
    };

    const eventSpy = vitest.fn();
    manager.on("assumptionUpdated", eventSpy);

    // Simulate verification for the first step
    await manager.verifyAssumption(mockAssumption.id, "stepA", true, "Success details");

    // Check if the assumption status was updated
    const updatedAssumption = await manager.getAssumption(mockAssumption.id);
    expect(updatedAssumption?.verificationHistory.length).toBe(1);
    expect(updatedAssumption?.verificationHistory[0].result).toBe(true);

    // Simulate verification for the second step
    await manager.verifyAssumption(mockAssumption.id, "stepB", false, "Failure details");

    // Check if the assumption status was updated again
    const finalAssumption = await manager.getAssumption(mockAssumption.id);
    expect(finalAssumption?.verificationHistory.length).toBe(2);
    expect(finalAssumption?.isVerified).toBe(false); // Still not fully verified
    expect(eventSpy).toHaveBeenCalledTimes(2); // Two updates happened
  });

  it("should handle non-existent assumption ID gracefully", async () => {
    const nonExistentId = "non-existent-id";
    
    // Test getting non-existent assumption
    const assumption = await manager.getAssumption(nonExistentId);
    expect(assumption).toBeUndefined();

    // Test verifying non-existent assumption
    await expect(manager.verifyAssumption(nonExistentId, "step", true, "details")).rejects.toThrow(
      "Assumption not found"
    );
  });
});