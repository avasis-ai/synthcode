import { describe, it, expect, vi } from "vitest";
import { MultiStageApprovalGate } from "../src/coordination/multi-stage-approval-gate";

describe("MultiStageApprovalGate", () => {
  it("should initialize correctly with a list of stages", () => {
    const stages = ["Stage 1", "Stage 2"];
    const gate = new MultiStageApprovalGate(stages);
    expect(gate).toBeInstanceOf(MultiStageApprovalGate);
    expect(gate.getStages()).toEqual(stages);
    expect(gate.getCurrentStageIndex()).toBe(0);
  });

  it("should advance to the next stage upon successful approval", async () => {
    const stages = ["Stage A", "Stage B", "Stage C"];
    const gate = new MultiStageApprovalGate(stages);

    // Simulate approval for Stage A
    await gate.approveStage(true);
    expect(gate.getCurrentStageIndex()).toBe(1);

    // Simulate approval for Stage B
    await gate.approveStage(true);
    expect(gate.getCurrentStageIndex()).toBe(2);
  });

  it("should remain on the current stage if approval fails or is skipped", async () => {
    const stages = ["Stage X", "Stage Y"];
    const gate = new MultiStageApprovalGate(stages);

    // Fail approval for Stage X
    await gate.approveStage(false);
    expect(gate.getCurrentStageIndex()).toBe(0);

    // Skip approval for Stage X
    await gate.approveStage(null);
    expect(gate.getCurrentStageIndex()).toBe(0);
  });
});