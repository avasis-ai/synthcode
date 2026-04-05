import { describe, it, expect } from "vitest";
import { ToolCallObservationBus } from "../src/observation/tool-call-observation-bus";

describe("ToolCallObservationBus", () => {
  it("should be a singleton instance", () => {
    const bus1 = ToolCallObservationBus.getInstance();
    const bus2 = ToolCallObservationBus.getInstance();
    expect(bus1).toBe(bus2);
  });

  it("should emit an event when an observation is published", (done) => {
    const mockListener = vi.fn();
    const bus = ToolCallObservationBus.getInstance();
    bus.on("observation", mockListener);

    const mockObservation: any = {
      toolName: "testTool",
      step: "step1",
      severity: "INFO",
      data: { key: "value" },
      timestamp: Date.now(),
    };

    bus.publishObservation(mockObservation);

    // Use setTimeout to allow event emission to complete in async context
    setTimeout(() => {
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith(mockObservation);
      bus.removeListener("observation", mockListener);
      done();
    }, 0);
  });

  it("should handle different severity levels", (done) => {
    const mockListener = vi.fn();
    const bus = ToolCallObservationBus.getInstance();
    bus.on("observation", mockListener);

    const errorObservation: any = {
      toolName: "errorTool",
      step: "fail",
      severity: "ERROR",
      data: {},
      timestamp: Date.now(),
    };

    const warningObservation: any = {
      toolName: "warnTool",
      step: "warning",
      severity: "WARNING",
      data: {},
      timestamp: Date.now(),
    };

    bus.publishObservation(errorObservation);
    bus.publishObservation(warningObservation);

    setTimeout(() => {
      expect(mockListener).toHaveBeenCalledTimes(2);
      expect(mockListener).toHaveBeenCalledWith(errorObservation);
      expect(mockListener).toHaveBeenCalledWith(warningObservation);
      bus.removeListener("observation", mockListener);
      done();
    }, 0);
  });
});