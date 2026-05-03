import { describe, it, expect } from "vitest";
import { ContextualObservationStreamer } from "../src/context/contextual-observation-streamer";

describe("ContextualObservationStreamer", () => {
  it("should initialize with an internal EventEmitter", () => {
    const streamer = new ContextualObservationStreamer();
    // We can't directly check the private field, but we can check if the getter returns an EventEmitter
    const emitter = streamer.getObservationEmitter();
    expect(emitter).toBeInstanceOf(EventEmitter);
  });

  it("should allow emitting observations via the internal emitter", () => {
    const streamer = new ContextualObservationStreamer();
    const mockListener = vi.fn();
    const emitter = streamer.getObservationEmitter();

    emitter.on("observation", mockListener);

    const observation: any = {
      type: "tool_output",
      payload: "test output",
      source: "test_tool",
      timestamp: Date.now(),
    };

    emitter.emit("observation", observation);

    expect(mockListener).toHaveBeenCalledWith(observation);
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it("should correctly pass through emitted observations", () => {
    const streamer = new ContextualObservationStreamer();
    const mockListener = vi.fn();
    const emitter = streamer.getObservationEmitter();

    emitter.on("observation", mockListener);

    const observation: any = {
      type: "state_change",
      payload: { count: 1 },
      source: "state_manager",
      timestamp: Date.now(),
    };

    emitter.emit("observation", observation);

    expect(mockListener).toHaveBeenCalledWith(observation);
  });
});