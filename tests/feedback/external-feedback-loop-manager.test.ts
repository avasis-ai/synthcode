import { describe, it, expect, vi } from "vitest"
import { ExternalFeedbackLoopManager } from "../../../src/feedback/external-feedback-loop-manager.js"

describe("ExternalFeedbackLoopManager", () => {
  it("should initialize correctly and process a simple feedback message", async () => {
    const manager = new ExternalFeedbackLoopManager()
    const feedbackMessage = {
      role: "user",
      content: "This is a test message for feedback."
    }
    await manager.processFeedback(feedbackMessage)
    expect(manager.getFeedbackHistory()).toHaveLength(1)
    expect(manager.getFeedbackHistory()[0].role).toBe("user")
    expect(manager.getFeedbackHistory()[0].content).toBe("This is a test message for feedback.")
  })

  it("should append multiple feedback messages to the history", async () => {
    const manager = new ExternalFeedbackLoopManager()
    const message1 = {
      role: "user",
      content: "First piece of feedback."
    }
    const message2 = {
      role: "user",
      content: "Second piece of feedback."
    }
    await manager.processFeedback(message1)
    await manager.processFeedback(message2)
    const history = manager.getFeedbackHistory()
    expect(history).toHaveLength(2)
    expect(history[0].content).toBe("First piece of feedback.")
    expect(history[1].content).toBe("Second piece of feedback.")
  })

  it("should handle an empty feedback message gracefully", async () => {
    const manager = new ExternalFeedbackLoopManager()
    const emptyMessage = {
      role: "user",
      content: ""
    }
    await manager.processFeedback(emptyMessage)
    const history = manager.getFeedbackHistory()
    expect(history).toHaveLength(1)
    expect(history[0].content).toBe("")
  })
})