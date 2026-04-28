import { describe, it, expect } from "vitest";
import { StatefulDependencyTracker, DependencyState } from "../src/state/stateful-tool-dependency-tracker";

describe("StatefulDependencyTracker", () => {
  it("should initialize correctly", () => {
    const tracker = new StatefulDependencyTracker();
    expect(tracker).toBeInstanceOf(StatefulDependencyTracker);
  });

  it("should set a dependency state correctly", () => {
    const tracker = new StatefulDependencyTracker();
    const sourceId = "source-1";
    const targetId = "target-A";
    const initialLink: DependencyLink = {
      sourceId: sourceId,
      targetId: targetId,
      state: DependencyState.PENDING,
      timestamp: Date.now(),
    };
    tracker.setDependency(sourceId, targetId, initialLink);

    const retrievedLink = tracker.getDependency(sourceId, targetId);
    expect(retrievedLink).toEqual(initialLink);
  });

  it("should update dependency state and emit event", () => {
    const tracker = new StatefulDependencyTracker();
    const sourceId = "source-2";
    const targetId = "target-B";
    const initialLink: DependencyLink = {
      sourceId: sourceId,
      targetId: targetId,
      state: DependencyState.PENDING,
      timestamp: Date.now(),
    };
    tracker.setDependency(sourceId, targetId, initialLink);

    const mockListener = vi.fn();
    tracker.on("dependencyUpdated", mockListener);

    const resolvedLink: DependencyLink = {
      sourceId: sourceId,
      targetId: targetId,
      state: DependencyState.RESOLVED,
      timestamp: Date.now() + 1000,
    };
    tracker.updateDependency(sourceId, targetId, resolvedLink);

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: sourceId, targetId: targetId, state: DependencyState.RESOLVED })
    );
  });
});