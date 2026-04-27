import { describe, it, expect, vi } from "vitest";
import { State } from "../src/history/stateful-tool-invocation-history";

describe("State", () => {
  it("should initialize correctly", async () => {
    const mockStore = {
      get: vi.fn<any>(),
      set: vi.fn<any>(),
      delete: vi.fn<any>(),
    } as any;
    const state = new State(mockStore);
    expect(state).toBeInstanceOf(State);
  });

  it("should record a new invocation history entry", async () => {
    const mockStore = {
      get: vi.fn<any>(),
      set: vi.fn<any>(),
      delete: vi.fn<any>(),
    } as any;
    const state = new State(mockStore);

    const record = {
      workflowId: "wf-123",
      stepId: "step-a",
      toolName: "tool-x",
      inputs: { param1: "value1" },
      output: "some output",
      status: "SUCCESS",
      timestamp: Date.now(),
      metadata: { source: "test" },
    };

    await state.recordInvocation(record);

    expect(mockStore.set).toHaveBeenCalledTimes(1);
    const callArgs = mockStore.set.mock.calls[0];
    expect(callArgs[0]).toBe("invocationHistory");
    expect(callArgs[1]).toEqual(expect.objectContaining({
      [record.stepId]: {
        toolName: record.toolName,
        inputs: record.inputs,
        output: record.output,
        status: record.status,
        timestamp: record.timestamp,
        metadata: record.metadata,
      },
    }));
  });

  it("should update an existing invocation history entry", async () => {
    const mockStore = {
      get: vi.fn<any>(),
      set: vi.fn<any>(),
      delete: vi.fn<any>(),
    } as any;
    const state = new State(mockStore);

    const initialRecord = {
      workflowId: "wf-123",
      stepId: "step-a",
      toolName: "tool-x",
      inputs: { param1: "value1" },
      output: "initial output",
      status: "IN_PROGRESS",
      timestamp: Date.now() - 1000,
      metadata: { source: "test" },
    };

    // Simulate initial state setup (optional, but good for testing updates)
    await state.recordInvocation(initialRecord);
    mockStore.set.mockClear();

    const updatedRecord = {
      workflowId: "wf-123",
      stepId: "step-a",
      toolName: "tool-x",
      inputs: { param1: "value1" },
      output: "final output",
      status: "SUCCESS",
      timestamp: Date.now(),
      metadata: { source: "test", final: true },
    };

    await state.recordInvocation(updatedRecord);

    expect(mockStore.set).toHaveBeenCalledTimes(1);
    const callArgs = mockStore.set.mock.calls[0];
    expect(callArgs[1]).toEqual(expect.objectContaining({
      [updatedRecord.stepId]: {
        toolName: updatedRecord.toolName,
        inputs: updatedRecord.inputs,
        output: updatedRecord.output,
        status: updatedRecord.status,
        timestamp: updatedRecord.timestamp,
        metadata: updatedRecord.metadata,
      },
    }));
  });
});