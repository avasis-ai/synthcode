import { describe, it, expect } from "vitest"
import { DataLineageTracker } from "../data/data-lineage-tracker.js"

describe("DataLineageTracker", () => {
  it("should initialize correctly with an empty history", () => {
    const tracker = new DataLineageTracker()
    expect(tracker.history).toEqual([])
  })

  it("should add user and assistant messages to the history", () => {
    const tracker = new DataLineageTracker()
    tracker.addMessage({ role: "user", content: "Hello" })
    tracker.addMessage({ role: "assistant", content: "Hi there" })
    expect(tracker.history.length).toBe(2)
    expect(tracker.history[0].role).toBe("user")
    expect(tracker.history[1].role).toBe("assistant")
  })

  it("should correctly add tool result messages to the history", () => {
    const tracker = new DataLineageTracker()
    tracker.addMessage({ role: "user", content: "What is the weather?" })
    tracker.addMessage({ role: "tool", tool_use_id: "tool_1", content: "Sunny" })
    expect(tracker.history.length).toBe(2)
    expect(tracker.history[0].role).toBe("user")
    expect(tracker.history[1].role).toBe("tool")
  })
})