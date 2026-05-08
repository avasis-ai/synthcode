import { describe, it, expect, vi } from "vitest";
import { SuspensionLifecycleManager } from "../suspension/suspension-lifecycle-manager";

describe("SuspensionLifecycleManager", () => {
  it("should initialize correctly and manage the suspension state", () => {
    const manager = new SuspensionLifecycleManager();
    expect(manager.isSuspended()).toBe(false);
    expect(manager.getSuspensionContext()).toBeNull();

    // Simulate suspension
    const contextSnapshot = {
      currentStep: "Goal Definition",
      goals: [{ goalId: "g1", description: "Find user's location", requiredInput: "Location API Key" }],
      pendingResources: [{ resourceId: "r1", type: "API", details: { endpoint: "/location" } }],
    };
    manager.suspend(contextSnapshot);

    expect(manager.isSuspended()).toBe(true);
    expect(manager.getSuspensionContext()).toEqual(contextSnapshot);
  });

  it("should handle resuming the process and clearing the suspension state", () => {
    const manager = new SuspensionLifecycleManager();
    const initialContextSnapshot = {
      currentStep: "Goal Definition",
      goals: [{ goalId: "g1", description: "Find user's location", requiredInput: "Location API Key" }],
      pendingResources: [{ resourceId: "r1", type: "API", details: { endpoint: "/location" } }],
    };
    manager.suspend(initialContextSnapshot);

    // Resume
    manager.resume();

    expect(manager.isSuspended()).toBe(false);
    expect(manager.getSuspensionContext()).toBeNull();
  });

  it("should update the suspension context when new information is available", () => {
    const manager = new SuspensionLifecycleManager();
    const initialContextSnapshot = {
      currentStep: "Goal Definition",
      goals: [{ goalId: "g1", description: "Find user's location", requiredInput: "Location API Key" }],
      pendingResources: [{ resourceId: "r1", type: "API", details: { endpoint: "/location" } }],
    };
    manager.suspend(initialContextSnapshot);

    // Update context
    const updatedContextSnapshot = {
      currentStep: "Tool Execution",
      goals: [{ goalId: "g1", description: "Find user's location", requiredInput: "Location API Key" }],
      pendingResources: [{ resourceId: "r1", type: "API", details: { endpoint: "/location" } }, { resourceId: "r2", type: "Data", details: { source: "user_input" } }],
    };
    manager.updateContext(updatedContextSnapshot);

    expect(manager.isSuspended()).toBe(true);
    expect(manager.getSuspensionContext()).toEqual(updatedContextSnapshot);
  });
});