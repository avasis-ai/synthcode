import { describe, it, expect } from "vitest"
import { ContextualSemanticDriftDetector } from "../src/drift/contextual-semantic-drift-detector"

describe("ContextualSemanticDriftDetector", () => {
  it("should detect semantic drift when the distance exceeds the threshold", () => {
    // Arrange: Initialize detector with a low threshold to ensure drift is detected
    const detector = new ContextualSemanticDriftDetector(0.5)
    
    // Mocking the internal state/methods for testing purposes
    // We assume the detector has a method to check for drift given a new message
    // Since the actual implementation details are hidden, we test the public interface
    // Assuming a method like 'detectDrift' exists or can be tested via constructor/setup
    
    // Mocking the internal state setup for a successful initial context
    // We simulate the detector having processed an initial context
    (detector as any).setInitialContextVector([0.1, 0.2, 0.3])
    
    // Simulate a significantly different new message vector (high drift)
    const newMessageVector = [0.9, 0.1, 0.8]
    
    // Act: Detect drift
    const report = (detector as any).detectDrift(new Message("New message content", newMessageVector))

    // Assert
    expect(report.isDrifting).toBe(true)
    expect(report.distance).toBeGreaterThan(0.7) // Should be significantly higher than the 0.5 threshold
  })

  it("should not detect semantic drift when the distance is below the threshold", () => {
    // Arrange: Initialize detector with a moderate threshold
    const detector = new ContextualSemanticDriftDetector(0.7)
    
    // Mocking the internal state/methods
    (detector as any).setInitialContextVector([0.5, 0.5, 0.5])
    
    // Simulate a very similar new message vector (low drift)
    const newMessageVector = [0.55, 0.48, 0.52]
    
    // Act: Detect drift
    const report = (detector as any).detectDrift(new Message("Similar message content", newMessageVector))

    // Assert
    expect(report.isDrifting).toBe(false)
    expect(report.distance).toBeLessThan(0.7)
  })

  it("should handle initialization correctly with default threshold", () => {
    // Arrange: Use default threshold (0.7)
    const detector = new ContextualSemanticDriftDetector()
    
    // Assert: Check if the internal threshold is set correctly (assuming it's accessible or testable)
    expect((detector as any).driftThreshold).toBe(0.7)
  })
})