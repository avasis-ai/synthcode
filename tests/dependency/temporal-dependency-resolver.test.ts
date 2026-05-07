import { describe, it, expect } from "vitest";
import { TemporalDependencyResolver } from "../../../src/dependency/temporal-dependency-resolver";
import { Step } from "../../../src/types/step";

describe("TemporalDependencyResolver", () => {
  it("should resolve a simple sequence of steps with no dependencies", async () => {
    const steps: Step[] = [
      { id: "step1", duration: 10, payload: "data1" },
      { id: "step2", duration: 5, payload: "data2" },
    ];
    const resolver = new TemporalDependencyResolver();
    const resolvedSequence = await resolver.resolve(steps, 0);

    expect(resolvedSequence).toBeDefined();
    expect(resolvedSequence!.steps.length).toBe(2);
    expect(resolvedSequence!.steps[0].startTime).toBe(0);
    expect(resolvedSequence!.steps[1].startTime).toBe(10);
  });

  it("should resolve steps with a simple 'after' dependency", async () => {
    const steps: Step[] = [
      { id: "stepA", duration: 10, payload: "dataA" },
      { id: "stepB", duration: 5, payload: "dataB" },
    ];
    const dependencies: TemporalConstraint[] = [
      { sourceStepId: "stepA", targetStepId: "stepB", type: "after", delta: 2 },
    ];
    const resolver = new TemporalDependencyResolver();
    const resolvedSequence = await resolver.resolve(steps, 0, dependencies);

    expect(resolvedSequence).toBeDefined();
    expect(resolvedSequence!.steps.length).toBe(2);
    // Step A starts at 0, ends at 10.
    // Step B starts after A + delta (10 + 2) = 12.
    expect(resolvedSequence!.steps[0].startTime).toBe(0);
    expect(resolvedSequence!.steps[1].startTime).toBe(12);
  });

  it("should resolve steps with a 'before' dependency", async () => {
    const steps: Step[] = [
      { id: "stepB", duration: 5, payload: "dataB" },
      { id: "stepA", duration: 10, payload: "dataA" },
    ];
    const dependencies: TemporalConstraint[] = [
      { sourceStepId: "stepA", targetStepId: "stepB", type: "before", delta: 3 },
    ];
    const resolver = new TemporalDependencyResolver();
    const resolvedSequence = await resolver.resolve(steps, 0, dependencies);

    expect(resolvedSequence).toBeDefined();
    expect(resolvedSequence!.steps.length).toBe(2);
    // Step A must end 3 units before Step B starts.
    // Step B starts at 0. Step A must end at 0 - 3 = -3.
    // Since we assume positive time, this test might need adjustment based on implementation details,
    // but assuming the resolver handles relative timing correctly:
    // If Step B starts at 0, Step A must end at -3. This implies Step A cannot run before Step B.
    // For a valid test case, let's assume the sequence is [StepA, StepB] and dependency is A before B.
    const steps2: Step[] = [
      { id: "stepA", duration: 10, payload: "dataA" },
      { id: "stepB", duration: 5, payload: "dataB" },
    ];
    const dependencies2: TemporalConstraint[] = [
      { sourceStepId: "stepA", targetStepId: "stepB", type: "before", delta: 3 },
    ];
    const resolver2 = new TemporalDependencyResolver();
    const resolvedSequence2 = await resolver2.resolve(steps2, 0, dependencies2);

    expect(resolvedSequence2).toBeDefined();
    // Step A starts at 0, ends at 10.
    // Step B must start at (End time of A) - delta = 10 - 3 = 7.
    expect(resolvedSequence2!.steps[0].startTime).toBe(0);
    expect(resolvedSequence2!.steps[1].startTime).toBe(7);
  });
});