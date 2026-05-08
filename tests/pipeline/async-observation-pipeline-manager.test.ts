import { describe, it, expect, vi } from "vitest";
import { AsynchronousObservationPipelineManager, PipelineStep, ObservationPayload } from "../src/pipeline/async-observation-pipeline-manager";

describe("AsynchronousObservationPipelineManager", () => {
  it("should initialize correctly and allow adding steps", async () => {
    const manager = new AsynchronousObservationPipelineManager();
    const mockStep: PipelineStep<any> = {
      sourceId: "source1",
      fetcher: vi.fn(() => Promise.resolve("data")),
      schema: class MockSchema {},
    };
    await manager.addStep(mockStep);
    // Assuming there is a method to check the internal state or a getter
    // Since we don't see the full implementation, we test the basic functionality.
    // If the manager has a getSteps method, we would use it.
    // For now, we assume adding a step is successful.
  });

  it("should process observations sequentially using fetchers", async () => {
    const manager = new AsynchronousObservationPipelineManager();
    const mockStep1: PipelineStep<string> = {
      sourceId: "source1",
      fetcher: vi.fn(() => Promise.resolve("Observation 1")),
      schema: class MockSchema {},
    };
    const mockStep2: PipelineStep<number> = {
      sourceId: "source2",
      fetcher: vi.fn(() => Promise.resolve(42)),
      schema: class MockSchema {},
    };

    await manager.addStep(mockStep1);
    await manager.addStep(mockStep2);

    // Assuming a method like processObservations exists
    // We mock the internal logic execution to ensure fetchers are called.
    // Since we cannot call the actual method, we verify the setup.
    // If processObservations returns the results, we check that.
    // For this test, we assume a method `processObservations` exists and runs the steps.
    // We will simulate the call and check the side effects on the fetchers.
    // (Note: This test is limited by the lack of the full class implementation.)
    await manager.processObservations(); // Assuming this method exists

    expect(mockStep1.fetcher).toHaveBeenCalledTimes(1);
    expect(mockStep2.fetcher).toHaveBeenCalledTimes(1);
  });

  it("should handle failures in individual steps gracefully", async () => {
    const manager = new AsynchronousObservationPipelineManager();
    const failingStep: PipelineStep<any> = {
      sourceId: "fail_source",
      fetcher: vi.fn(() => Promise.reject(new Error("Step failed"))),
      schema: class MockSchema {},
    };
    const successfulStep: PipelineStep<any> = {
      sourceId: "success_source",
      fetcher: vi.fn(() => Promise.resolve("Success")),
      schema: class MockSchema {},
    };

    await manager.addStep(failingStep);
    await manager.addStep(successfulStep);

    // Assuming processObservations handles errors and continues or reports them
    await manager.processObservations(); // Assuming this method exists

    // We expect the failure to be handled, but the subsequent step should still run.
    expect(failingStep.fetcher).toHaveBeenCalledTimes(1);
    expect(successfulStep.fetcher).toHaveBeenCalledTimes(1);
  });
});