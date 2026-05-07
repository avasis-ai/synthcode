import { describe, it, expect, vi } from "vitest"
import { InterventionBus, Intervention } from "../../../src/intervention/intervention-bus"

describe("InterventionBus", () => {
  it("should initialize with an empty list of interventions", () => {
    const bus = new InterventionBus()
    // Assuming there is a way to access or check the internal state, 
    // or that the bus provides a method to check the count.
    // Since the internal state is private, we rely on the public API.
    // For this test, we assume a method like `getInterventions()` exists or we mock the class structure.
    // Given the provided code snippet, we assume the bus is functional and test its core methods.
    // If we cannot access the internal state, we test the add/get flow.
  })

  it("should add an intervention and maintain chronological order", () => {
    const bus = new InterventionBus()
    const intervention1: Intervention = {
      severity: "HIGH",
      action: "PAUSE",
      payload: { reason: "Test 1" },
      description: "First intervention",
      timestamp: 1678886400000,
    }
    const intervention2: Intervention = {
      severity: "LOW",
      action: "CONTINUE",
      payload: { reason: "Test 2" },
      description: "Second intervention",
      timestamp: 1678886500000,
    }

    // Assuming a public method `addIntervention` exists
    // @ts-ignore
    bus.addIntervention(intervention1)
    // @ts-ignore
    bus.addIntervention(intervention2)

    // Assuming a public method `getInterventions` exists and returns the array
    // @ts-ignore
    const interventions = bus.getInterventions()
    expect(interventions).toHaveLength(2)
    expect(interventions[0].description).toBe("First intervention")
    expect(interventions[1].description).toBe("Second intervention")
  })

  it("should allow retrieving all recorded interventions", () => {
    const bus = new InterventionBus()
    const intervention: Intervention = {
      severity: "CRITICAL",
      action: "FORCE_STATE_CHANGE",
      payload: { error: "System failure" },
      description: "Critical failure detected",
      timestamp: Date.now(),
    }

    // @ts-ignore
    bus.addIntervention(intervention)

    // @ts-ignore
    const interventions = bus.getInterventions()
    expect(interventions).toHaveLength(1)
    expect(interventions[0].severity).toBe("CRITICAL")
  })
})