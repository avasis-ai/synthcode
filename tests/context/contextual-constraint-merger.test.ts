import { describe, it, expect } from "vitest";
import { ContextualConstraintMerger } from "../src/context/contextual-constraint-merger";

describe("ContextualConstraintMerger", () => {
  it("should merge constraints correctly using 'priority-wins' strategy", () => {
    const merger = new ContextualConstraintMerger("priority-wins");
    const constraints: any[] = [
      { type: "resource", source: "A", priority: 10, details: { resource: "X" } },
      { type: "resource", source: "B", priority: 20, details: { resource: "Y" } },
      { type: "resource", source: "C", priority: 15, details: { resource: "X" } },
    ];
    const merged = merger.merge(constraints);

    expect(merged.length).toBe(2);
    // Expect the highest priority constraint for resource "X" (priority 15 from C)
    expect(merged).toContainEqual(expect.objectContaining({ type: "resource", source: "C", priority: 15, details: { resource: "X" } }));
    // Expect the highest priority constraint for resource "Y" (priority 20 from B)
    expect(merged).toContainEqual(expect.objectContaining({ type: "resource", source: "B", priority: 20, details: { resource: "Y" } }));
  });

  it("should merge constraints correctly using 'most-restrictive-wins' strategy", () => {
    const merger = new ContextualConstraintMerger("most-restrictive-wins");
    const constraints: any[] = [
      { type: "capability", source: "A", priority: 10, details: { can_use: ["tool1"] } },
      { type: "capability", source: "B", priority: 10, details: { can_use: ["tool2"] } },
      { type: "capability", source: "C", priority: 10, details: { can_use: ["tool1", "tool2"] } }, // Most restrictive/inclusive
    ];
    const merged = merger.merge(constraints);

    expect(merged.length).toBe(1);
    // In this simplified test, we check if the resulting constraint reflects the union/most restrictive nature
    expect(merged[0].details.can_use).toEqual(["tool1", "tool2"]);
  });

  it("should merge constraints correctly using 'latest-source-wins' strategy", () => {
    const merger = new ContextualConstraintMerger("latest-source-wins");
    const constraints: any[] = [
      { type: "temporal", source: "Source1", priority: 10, details: { start: "T1" } },
      { type: "temporal", source: "Source2", priority: 5, details: { start: "T2" } }, // Latest source wins
      { type: "temporal", source: "Source3", priority: 15, details: { start: "T3" } }, // Latest source wins
    ];
    const merged = merger.merge(constraints);

    expect(merged.length).toBe(1);
    // Assuming the last source processed (Source3) dictates the final state for the same type
    expect(merged[0].source).toBe("Source3");
    expect(merged[0].details.start).toBe("T3");
  });
});