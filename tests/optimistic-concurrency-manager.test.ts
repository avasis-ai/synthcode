import { describe, it, expect, vi } from "vitest";
import { OptimisticConcurrencyManager } from "../src/state/optimistic-concurrency-manager";

describe("OptimisticConcurrencyManager", () => {
  it("should correctly manage optimistic updates and resolve conflicts", async () => {
    const manager = new OptimisticConcurrencyManager();
    const initialData = { count: 10, version: 1 };

    // Simulate an optimistic update
    await manager.setOptimisticState(initialData, { count: 12, version: 2 });
    expect(manager.getCurrentState()).toEqual({ count: 12, version: 2 });

    // Simulate a conflict (version mismatch)
    const conflictState = { count: 15, version: 3 };
    await manager.setOptimisticState(initialData, conflictState);
    expect(manager.getCurrentState()).toEqual(conflictState);

    // Simulate successful resolution (matching version)
    const resolvedState = { count: 12, version: 2 };
    await manager.resolveOptimisticState(initialData, resolvedState);
    expect(manager.getCurrentState()).toEqual(resolvedState);
  });

  it("should revert to the base state if resolution fails due to version mismatch", async () => {
    const manager = new OptimisticConcurrencyManager();
    const baseState = { count: 10, version: 1 };

    // Set optimistic state
    const optimisticState = { count: 12, version: 2 };
    await manager.setOptimisticState(baseState, optimisticState);
    expect(manager.getCurrentState()).toEqual(optimisticState);

    // Attempt to resolve with a conflicting state (version 3, but base is still version 1)
    const conflictingState = { count: 15, version: 3 };
    await manager.resolveOptimisticState(baseState, conflictingState);

    // Should revert to the last known good state (or the base state if no changes were applied)
    expect(manager.getCurrentState()).toEqual(optimisticState);
  });

  it("should handle multiple updates and correctly resolve the latest successful state", async () => {
    const manager = new OptimisticConcurrencyManager();
    const baseState = { count: 10, version: 1 };

    // Update 1 (Optimistic)
    const optimistic1 = { count: 11, version: 2 };
    await manager.setOptimisticState(baseState, optimistic1);
    expect(manager.getCurrentState()).toEqual(optimistic1);

    // Update 2 (Optimistic)
    const optimistic2 = { count: 12, version: 3 };
    await manager.setOptimisticState(baseState, optimistic2);
    expect(manager.getCurrentState()).toEqual(optimistic2);

    // Resolve Update 2 successfully
    const resolved2 = { count: 12, version: 3 };
    await manager.resolveOptimisticState(baseState, resolved2);
    expect(manager.getCurrentState()).toEqual(resolved2);

    // Attempt to resolve Update 1 (should fail/ignore as state is already resolved to version 3)
    const resolved1 = { count: 11, version: 2 };
    await manager.resolveOptimisticState(baseState, resolved1);
    expect(manager.getCurrentState()).toEqual(resolved2);
  });
});