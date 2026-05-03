import { describe, it, expect } from "vitest";
import { StructuredObservationStreamer } from "../src/observation/structured-observation-streamer";

describe("StructuredObservationStreamer", () => {
  it("should initialize with an empty observations array", () => {
    const streamer = new StructuredObservationStreamer();
    // Assuming there's a way to check private state or a getter for testing purposes.
    // For this example, we'll assume a method or direct access is possible for testing.
    // If not, this test might need adjustment based on the actual class API.
    // For now, we'll rely on the assumption that the internal array starts empty.
    // A better implementation might expose a getter or a method to check the count.
    expect((structuredObservationStreamer as any).observations.length).toBe(0);
  });

  it("should add a valid observation to the internal array", () => {
    const streamer = new StructuredObservationStreamer();
    const mockObservation: any = {
      type: "tool_output",
      schema: { name: "tool_output" },
      payload: { result: "success" },
      source: "mock_source",
      timestamp: Date.now(),
    };
    (structuredObservationStreamer as any).addObservation(mockObservation);
    expect((structuredObservationStreamer as any).observations.length).toBe(1);
    expect((structuredObservationStreamer as any).observations[0]).toEqual(mockObservation);
  });

  it("should handle multiple observations correctly", () => {
    const streamer = new StructuredObservationStreamer();
    const obs1: any = { type: "tool_output", schema: {}, payload: {}, source: "s1", timestamp: 1 };
    const obs2: any = { type: "tool_error", schema: {}, payload: {}, source: "s2", timestamp: 2 };

    (structuredObservationStreamer as any).addObservation(obs1);
    (structuredObservationStreamer as any).addObservation(obs2);

    expect((structuredObservationStreamer as any).observations.length).toBe(2);
    expect((structuredObservationStreamer as any).observations[0]).toEqual(obs1);
    expect((structuredObservationStreamer as any).observations[1]).toEqual(obs2);
  });
});