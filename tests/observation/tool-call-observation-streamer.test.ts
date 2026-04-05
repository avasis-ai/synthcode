import { describe, it, expect } from "vitest";
import { ToolCallObservationStreamer } from "../src/observation/tool-call-observation-streamer";

describe("ToolCallObservationStreamer", () => {
  it("should emit an observation when emit is called", () => {
    const streamer = new ToolCallObservationStreamer();
    const mockListener = vi.fn();
    streamer.on("data", mockListener);

    const observation: any = {
      type: "observation",
      data: "test data",
    };

    streamer.emit(observation);

    expect(mockListener).toHaveBeenCalledWith(observation.data);
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it("should allow multiple listeners to receive the observation", () => {
    const streamer = new ToolCallObservationStreamer();
    const mockListener1 = vi.fn();
    const mockListener2 = vi.fn();

    streamer.on("data", mockListener1);
    streamer.on("data", mockListener2);

    const observation: any = {
      type: "observation",
      data: "multi-test data",
    };

    streamer.emit(observation);

    expect(mockListener1).toHaveBeenCalledWith("multi-test data");
    expect(mockListener2).toHaveBeenCalledWith("multi-test data");
    expect(mockListener1).toHaveBeenCalledTimes(1);
    expect(mockListener2).toHaveBeenCalledTimes(1);
  });

  it("should clear all listeners when removeAllListeners is called", () => {
    const streamer = new ToolCallObservationStreamer();
    const mockListener = vi.fn();
    streamer.on("data", mockListener);

    streamer.removeAllListeners();

    const observation: any = {
      type: "observation",
      data: "after clear",
    };

    streamer.emit(observation);

    expect(mockListener).not.toHaveBeenCalled();
  });
});