import { describe, it, expect, vi } from "vitest"
import { HypothesisLoopManager } from "../../../src/hypothesis/hypothesis-loop-manager"

describe("HypothesisLoopManager", () => {
  it("should initialize correctly and manage the initial state", () => {
    const manager = new HypothesisLoopManager()
    expect(manager).toBeInstanceOf(HypothesisLoopManager)
    expect(manager.current_hypothesis).toBeNull()
  })

  it("should update the current hypothesis and state when provided", async () => {
    const manager = new HypothesisLoopManager()
    const hypothesis = {
      id: "h1",
      hypothesis: "The user prefers blue.",
      expected_outcome: "Blue items are purchased.",
      requi: "User interaction data"
    }
    await manager.set_hypothesis(hypothesis)
    expect(manager.current_hypothesis).toEqual(hypothesis)
  })

  it("should correctly process a full loop cycle (hypothesis -> tool call -> result)", async () => {
    const manager = new HypothesisLoopManager()
    const initialHypothesis = {
      id: "h1",
      hypothesis: "The user prefers blue.",
      expected_outcome: "Blue items are purchased.",
      requi: "User interaction data"
    }
    await manager.set_hypothesis(initialHypothesis)

    // Simulate tool call
    await manager.process_tool_call("tool_1", {
      result: "Blue items were purchased.",
      observation: "The user clicked on blue items."
    })

    // Check if the state updated
    expect(manager.current_hypothesis).toEqual(initialHypothesis)
    expect(manager.last_tool_call_result).toEqual({
      result: "Blue items were purchased.",
      observation: "The user clicked on blue items."
    })
  })
})