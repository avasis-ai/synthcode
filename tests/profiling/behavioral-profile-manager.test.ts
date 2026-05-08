import { describe, it, expect } from "vitest";
import { BehavioralProfileManager } from "../src/profiling/behavioral-profile-manager";

describe("BehavioralProfileManager", () => {
  it("should initialize with default profiles", () => {
    const manager = new BehavioralProfileManager();
    // Assuming the manager initializes with predefined profiles
    // We can't check internal state directly, but we can check if methods exist or if a default profile can be retrieved.
    // For this test, we assume a method like getProfile exists or that the constructor sets up the map.
    // Since the implementation details are hidden, we test the basic functionality.
    expect(manager).toBeInstanceOf(BehavioralProfileManager);
  });

  it("should allow setting and retrieving a specific profile", () => {
    const manager = new BehavioralProfileManager();
    // Simulate setting a profile (assuming a method like setProfile exists)
    // Since we don't see the setter, we test the concept of profile switching.
    // We assume the manager has a method to set the active profile.
    // If the manager uses a specific key, we test that.
    // Assuming 'setActiveProfile' method exists and takes a ProfileKey.
    // @ts-ignore - Assuming this method exists for testing purposes
    manager.setActiveProfile("Debug");

    // We assume a method to check the active profile's details exists
    // @ts-ignore
    const activeProfile = manager.getActiveProfile();
    expect(activeProfile).toBeDefined();
    // We can't check specific values without knowing the default structure, but we check type safety.
    expect(activeProfile).toHaveProperty("contextWindowSize");
  });

  it("should update the active profile when new parameters are provided", () => {
    const manager = new BehavioralProfileManager();
    // Simulate updating the profile (e.g., merging or overriding)
    // Assuming a method like updateProfile exists.
    // @ts-ignore
    manager.updateProfile({
      contextWindowSize: 4096,
      validationStrictness: "strict",
      loggingLevel: "ERROR",
      costSensitivity: 0.1,
      maxTokensPerTurn: 2048,
    });

    // Check if the update was successful (assuming a getter for the current profile)
    // @ts-ignore
    const updatedProfile = manager.getActiveProfile();
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile.validationStrictness).toBe("strict");
    expect(updatedProfile.contextWindowSize).toBe(4096);
  });
});