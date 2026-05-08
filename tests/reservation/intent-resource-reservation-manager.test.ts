import { describe, it, expect } from "vitest"
import { IntentResourceReservationManager, ResourceRequirement, IntentReservationContext, Reservation } from "../src/reservation/intent-resource-reservation-manager"

describe("IntentResourceReservationManager", () => {
  it("should calculate initial reservation details correctly for feasible intent", async () => {
    const manager = new IntentResourceReservationManager()
    const context: IntentReservationContext = {
      intent: "High Priority Task",
      requiredResources: [
        { key: "CPU", amount: 4, unit: "cores" },
        { key: "Memory", amount: 16, unit: "GB" },
      ],
    }

    const reservation: Reservation = await manager.calculateReservation(context)

    expect(reservation.isFeasible).toBe(true)
    expect(reservation.context.intent).toBe("High Priority Task")
    expect(reservation.reservedResources).toEqual({
      CPU: 4,
      Memory: 16,
    })
    expect(reservation.estimatedCost).toBeGreaterThan(0)
  })

  it("should mark reservation as infeasible if required resources exceed capacity", async () => {
    const manager = new IntentResourceReservationManager()
    const context: IntentReservationContext = {
      intent: "Overloaded Task",
      requiredResources: [
        { key: "CPU", amount: 100, unit: "cores" },
        { key: "Memory", amount: 200, unit: "GB" },
      ],
    }

    const reservation: Reservation = await manager.calculateReservation(context)

    expect(reservation.isFeasible).toBe(false)
    expect(reservation.reservedResources).toEqual({
      CPU: 100,
      Memory: 200,
    })
    expect(reservation.estimatedCost).toBe(0)
  })

  it("should handle empty resource requirements gracefully", async () => {
    const manager = new IntentResourceReservationManager()
    const context: IntentReservationContext = {
      intent: "Minimal Task",
      requiredResources: [],
    }

    const reservation: Reservation = await manager.calculateReservation(context)

    expect(reservation.isFeasible).toBe(true)
    expect(Object.keys(reservation.reservedResources).length).toBe(0)
    expect(reservation.estimatedCost).toBe(0)
  })
})