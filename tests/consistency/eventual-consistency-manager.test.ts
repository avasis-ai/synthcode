import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventualConsistencyManager, WorkflowStep } from "../src/consistency/eventual-consistency-manager";

describe("EventualConsistencyManager", () => {
  let mockEventEmitter: any;
  let manager: EventualConsistencyManager;

  beforeEach(() => {
    mockEventEmitter = {
      emit: vi.fn(),
    };
    manager = new EventualConsistencyManager(mockEventEmitter);
  });

  it("should successfully execute all steps in a workflow and emit the final event", async () => {
    const mockStep1: WorkflowStep = {
      stepName: "Step1",
      action: vi.fn(() => Promise.resolve("data1")),
      expectedEventId: "event1",
      compensation: vi.fn(() => Promise.resolve()),
    };
    const mockStep2: WorkflowStep = {
      stepName: "Step2",
      action: vi.fn(() => Promise.resolve("data2")),
      expectedEventId: "event2",
      compensation: vi.fn(() => Promise.resolve()),
    };

    const workflow = { steps: [mockStep1, mockStep2] };

    await manager.executeWorkflow(workflow);

    expect(mockStep1.action).toHaveBeenCalledTimes(1);
    expect(mockStep2.action).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith("workflow:completed", expect.any(Object));
  });

  it("should execute compensation actions for all failed steps in reverse order", async () => {
    const mockStep1: WorkflowStep = {
      stepName: "Step1",
      action: vi.fn(() => Promise.resolve("data1")),
      expectedEventId: "event1",
      compensation: vi.fn(() => Promise.resolve()),
    };
    const mockStep2: WorkflowStep = {
      stepName: "Step2",
      action: vi.fn(() => Promise.reject(new Error("Step failed"))),
      expectedEventId: "event2",
      compensation: vi.fn(() => Promise.resolve()),
    };

    const workflow = { steps: [mockStep1, mockStep2] };

    await manager.executeWorkflow(workflow).catch(() => {});

    expect(mockStep1.compensation).toHaveBeenCalledTimes(1);
    expect(mockStep2.compensation).toHaveBeenCalledTimes(1);
    // Check that compensation was called in reverse order (Step 2 then Step 1)
    // Since vi.fn() tracks calls, we can check the call order if needed, but checking the count is sufficient for basic coverage.
    // For strict order checking, we would need to mock the internal execution loop.
    // Here we ensure both were called.
    expect(mockStep1.compensation).toHaveBeenCalledAfter(mockStep2.compensation);
    expect(mockEventEmitter.emit).not.toHaveBeenCalledWith("workflow:completed", expect.any(Object));
  });

  it("should handle workflows with only one step correctly", async () => {
    const mockStep1: WorkflowStep = {
      stepName: "Step1",
      action: vi.fn(() => Promise.resolve("data1")),
      expectedEventId: "event1",
      compensation: vi.fn(() => Promise.resolve()),
    };

    const workflow = { steps: [mockStep1] };

    await manager.executeWorkflow(workflow);

    expect(mockStep1.action).toHaveBeenCalledTimes(1);
    expect(mockStep1.compensation).toHaveBeenCalledTimes(0); // Compensation should only run on failure
    expect(mockEventEmitter.emit).toHaveBeenCalledWith("workflow:completed", expect.any(Object));
  });
});