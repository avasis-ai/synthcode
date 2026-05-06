import { describe, it, expect } from "vitest";
import { validateTemporalResourceFlow } from "../src/validation/temporal-resource-flow-validator";

describe("validateTemporalResourceFlow", () => {
  it("should return true for a valid resource flow", async () => {
    const flow: FlowStep[] = [
      {
        name: "step1",
        requirements: { quota: 10, memoryMB: 100, computeTimeSeconds: 5 },
        timeWindow: { minWaitSeconds: 0, maxDeadlineSeconds: 3600 },
        requiredCapabilities: ["cap1"],
      },
      {
        name: "step2",
        requirements: { quota: 5, memoryMB: 50, computeTimeSeconds: 2 },
        timeWindow: { minWaitSeconds: 1, maxDeadlineSeconds: 7200 },
        requiredCapabilities: ["cap2"],
      },
    ];
    const context: ResourceContext = {
      currentTimeSeconds: 0,
      availableResources: { quota: 20, memoryMB: 200, computeTimeSeconds: 10 },
      history: [],
    };
    await expect(validateTemporalResourceFlow(flow, context)).resolves.toBe(true);
  });

  it("should return false if a step requires more quota than available", async () => {
    const flow: FlowStep[] = [
      {
        name: "step1",
        requirements: { quota: 30, memoryMB: 100, computeTimeSeconds: 5 },
        timeWindow: { minWaitSeconds: 0, maxDeadlineSeconds: 3600 },
        requiredCapabilities: ["cap1"],
      },
    ];
    const context: ResourceContext = {
      currentTimeSeconds: 0,
      availableResources: { quota: 20, memoryMB: 200, computeTimeSeconds: 10 },
      history: [],
    };
    await expect(validateTemporalResourceFlow(flow, context)).resolves.toBe(false);
  });

  it("should return false if the time window is invalid (e.g., minWait > maxDeadline)", async () => {
    const flow: FlowStep[] = [
      {
        name: "step1",
        requirements: { quota: 10, memoryMB: 100, computeTimeSeconds: 5 },
        timeWindow: { minWaitSeconds: 50, maxDeadlineSeconds: 10 },
        requiredCapabilities: ["cap1"],
      },
    ];
    const context: ResourceContext = {
      currentTimeSeconds: 0,
      availableResources: { quota: 20, memoryMB: 200, computeTimeSeconds: 10 },
      history: [],
    };
    await expect(validateTemporalResourceFlow(flow, context)).resolves.toBe(false);
  });
});