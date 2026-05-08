import { describe, it, expect, vi } from "vitest";
import { ExecutionTraceRecorder } from "../src/tracing/execution-trace-recorder.js";

describe("ExecutionTraceRecorder", () => {
  it("should initialize with correct metadata and an empty event array", () => {
    const initialInput: any = {
      role: "user",
      content: "Hello",
    };
    const recorder = new ExecutionTraceRecorder(initialInput);

    expect(recorder.getTrace().events).toHaveLength(0);
    expect(recorder.getTrace().metadata.initialInput).toEqual(initialInput);
    expect(recorder.getTrace().metadata.startTime).toBeDefined();
    expect(recorder.getTrace().metadata.endTime).toBeNull();
  });

  it("should record a step start event and update metadata", () => {
    const initialInput: any = {
      role: "user",
      content: "Test step",
    };
    const recorder = new ExecutionTraceRecorder(initialInput);

    recorder.recordStepStart({ stepId: "step1" });

    const trace = recorder.getTrace();
    expect(trace.events).toHaveLength(1);
    expect(trace.events[0].type).toBe("step_start");
    expect(trace.events[0].payload).toEqual({ stepId: "step1" });
    expect(trace.metadata.endTime).toBeNull();
  });

  it("should record step end event and update metadata with end time", () => {
    const initialInput: any = {
      role: "user",
      content: "Test step",
    };
    const recorder = new ExecutionTraceRecorder(initialInput);

    // Simulate step start
    recorder.recordStepStart({ stepId: "step1" });

    // Simulate step end
    recorder.recordStepEnd({ stepId: "step1" });

    const trace = recorder.getTrace();
    expect(trace.events).toHaveLength(2);
    expect(trace.events[0].type).toBe("step_start");
    expect(trace.events[1].type).toBe("step_end");
    expect(trace.metadata.endTime).toBeDefined();
  });
});