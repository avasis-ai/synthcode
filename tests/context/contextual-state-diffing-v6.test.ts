import { describe, it, expect } from "vitest";
import {
  ContextualDiffingV6,
  ContextualMetadata,
  ContextualDiffType,
} from "../src/context/contextual-state-diffing-v6";

describe("ContextualDiffingV6", () => {
  it("should detect structural changes between two states", () => {
    const metadata: ContextualMetadata = {
      timeWindowMs: 1000,
      resourceUsageDelta: { cpuUsage: 0.1, memoryUsageBytes: 1024 },
    };
    const diff = ContextualDiffingV6.diff(
      { state: { content: "Initial content" } },
      { state: { content: "Updated content" } },
      metadata
    );
    expect(diff.type).toBe("StructuralChange");
  });

  it("should detect temporal shifts when time window is small", () => {
    const metadata: ContextualMetadata = {
      timeWindowMs: 50,
      resourceUsageDelta: { cpuUsage: 0.05, memoryUsageBytes: 512 },
    };
    const diff = ContextualDiffingV6.diff(
      { state: { content: "Stable state" } },
      { state: { content: "Slightly different state" } },
      metadata
    );
    expect(diff.type).toBe("TemporalShift");
  });

  it("should report no change if states are identical and metadata is nominal", () => {
    const metadata: ContextualMetadata = {
      timeWindowMs: 5000,
      resourceUsageDelta: { cpuUsage: 0.0, memoryUsageBytes: 0 },
    };
    const diff = ContextualDiffingV6.diff(
      { state: { content: "Unchanged state" } },
      { state: { content: "Unchanged state" } },
      metadata
    );
    expect(diff.type).toBe("NoChange");
  });
});