import { describe, it, expect } from "vitest"
import { EnvironmentalContextStreamProcessor, EnvironmentalEvent } from "../src/environmental/environmental-context-stream-processor.js"

describe("EnvironmentalContextStreamProcessor", () => {
  it("should initialize correctly and process a single event", () => {
    const processor = new EnvironmentalContextStreamProcessor()
    const event: EnvironmentalEvent = {
      source: "sensorA",
      type: "temperature",
      severity: "medium",
      timestamp: Date.now(),
      payload: { value: 25, unit: "C" }
    }
    processor.processEvent(event)
    expect(processor.getProcessedEvents().length).toBe(1)
  })

  it("should accumulate multiple events and calculate context", () => {
    const processor = new EnvironmentalContextStreamProcessor()
    const event1: EnvironmentalEvent = {
      source: "sensorA",
      type: "temperature",
      severity: "medium",
      timestamp: Date.now() - 1000,
      payload: { value: 25, unit: "C" }
    }
    const event2: EnvironmentalEvent = {
      source: "sensorB",
      type: "pressure",
      severity: "high",
      timestamp: Date.now(),
      payload: { value: 101.3, unit: "kPa" }
    }
    processor.processEvent(event1)
    processor.processEvent(event2)
    const processedEvents = processor.getProcessedEvents()
    expect(processedEvents.length).toBe(2)
    expect(processedEvents[1].severity).toBe("high")
  })

  it("should handle events with critical severity and update context", () => {
    const processor = new EnvironmentalContextStreamProcessor()
    const event: EnvironmentalEvent = {
      source: "sensorC",
      type: "vibration",
      severity: "critical",
      timestamp: Date.now(),
      payload: { reading: 5.5, unit: "g" }
    }
    processor.processEvent(event)
    const processedEvents = processor.getProcessedEvents()
    expect(processedEvents.length).toBe(1)
    expect(processedEvents[0].severity).toBe("critical")
  })
})