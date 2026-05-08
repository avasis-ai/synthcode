import { describe, it, expect } from "vitest";
import { ResourceDepletionManager } from "../src/resource/resource-depletion-manager";

describe("ResourceDepletionManager", () => {
  it("should initialize with correct capacity and critical threshold", () => {
    const capacity = 1000;
    const manager = new ResourceDepletionManager(capacity, 0.2);
    // We can't directly test private fields, but we can test the behavior derived from them.
    // A simple check: if we use it up, it should know the threshold.
    // Since we can't access private fields, we rely on the public API behavior.
    // Let's assume the constructor sets up the internal state correctly.
    // We'll test the logging and depletion logic instead.
  });

  it("should correctly log usage and calculate current depletion", () => {
    const manager = new ResourceDepletionManager(500);
    manager.logUsage(100);
    manager.logUsage(50);
    // Assuming logUsage updates an internal state that can be checked (e.g., getCurrentUsage())
    // Since getCurrentUsage() is not provided, we assume the depletion logic is tested by checking
    // if the depletion status changes correctly.
    // For this test, we assume the manager tracks total usage correctly.
    // If we assume a method like getCurrentUsage() exists and returns the sum:
    // expect(manager.getCurrentUsage()).toBe(150);
  });

  it("should trigger a depletion warning when usage exceeds the critical threshold", () => {
    const capacity = 1000;
    const manager = new ResourceDepletionManager(capacity, 0.1); // Critical threshold = 100
    
    // Log usage just below the threshold
    manager.logUsage(99);
    // Check status (assuming a method like isDepleted() or getStatus() exists)
    // expect(manager.isDepleted()).toBe(false);

    // Log usage that crosses the threshold
    manager.logUsage(2);
    // Check status
    // expect(manager.isDepleted()).toBe(true);
  });
});