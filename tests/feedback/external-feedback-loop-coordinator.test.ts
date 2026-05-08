import { describe, it, expect, vi } from "vitest"
import { ExternalFeedbackLoopCoordinator } from "../../../src/feedback/external-feedback-loop-coordinator.js"

describe("ExternalFeedbackLoopCoordinator", () => {
  it("should initialize correctly and handle basic feedback processing", () => {
    const coordinator = new ExternalFeedbackLoopCoordinator()
    expect(coordinator).toBeDefined()

    const mockFeedback: any = {
      source: "user_review",
      timestamp: Date.now(),
      raw_data: {
        feedback_text: "The tool call was incorrect.",
      },
      severity: "high",
      suggested_action: "modify_tool_call",
    }

    // Mock the internal method that processes feedback
    vi.spyOn(coordinator, "processFeedback").mockResolvedValue(true)

    // Process the feedback
    coordinator.handleFeedback(mockFeedback)

    // Check if the internal processing method was called
    expect(coordinator.processFeedback).toHaveBeenCalledWith(mockFeedback)
  })

  it("should emit an event when critical feedback is received", () => {
    const coordinator = new ExternalFeedbackLoopCoordinator()
    const mockFeedback: any = {
      source: "system_alert",
      timestamp: Date.now(),
      raw_data: {
        error_code: "E101",
      },
      severity: "critical",
      suggested_action: "reorder_steps",
    }

    const eventEmitter = vi.fn()
    coordinator.on("critical_feedback", eventEmitter)

    // Trigger the handler
    coordinator.handleFeedback(mockFeedback)

    // Check if the event emitter was called
    expect(eventEmitter).toHaveBeenCalledTimes(1)
  })

  it("should handle low severity feedback without emitting critical events", () => {
    const coordinator = new ExternalFeedbackLoopCoordinator()
    const mockFeedback: any = {
      source: "user_comment",
      timestamp: Date.now(),
      raw_data: {
        comment: "Minor improvement needed.",
      },
      severity: "low",
      suggested_action: "refine_prompt",
    }

    const eventEmitter = vi.fn()
    coordinator.on("critical_feedback", eventEmitter)

    // Trigger the handler
    coordinator.handleFeedback(mockFeedback)

    // Check if the event emitter was NOT called
    expect(eventEmitter).not.toHaveBeenCalled()
  })
})