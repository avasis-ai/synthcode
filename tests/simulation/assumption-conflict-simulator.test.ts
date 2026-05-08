import { describe, it, expect } from "vitest"
import {
  AssumptionConflictSimulator,
  Message,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
  ContentBlock,
} from "../src/simulation/assumption-conflict-simulator"

describe("AssumptionConflictSimulator", () => {
  it("should initialize correctly with an empty message history", () => {
    const simulator = new AssumptionConflictSimulator()
    expect(simulator.history).toEqual([])
  })

  it("should process a simple message and update history", () => {
    const simulator = new AssumptionConflictSimulator()
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "text", text: "Hello world" },
      ],
    }
    simulator.processMessage(userMessage)
    expect(simulator.history).toHaveLength(1)
    expect(simulator.history[0]).toEqual(userMessage)
  })

  it("should handle multiple message types and update history correctly", () => {
    const simulator = new AssumptionConflictSimulator()
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "text", text: "What is the capital of France?" },
      ],
    }
    simulator.processMessage(userMessage)

    const assistantMessage: Message = {
      role: "assistant",
      content: [
        { type: "text", text: "The capital of France is Paris." },
      ],
    }
    simulator.processMessage(assistantMessage)

    expect(simulator.history).toHaveLength(2)
    expect(simulator.history[1]).toEqual(assistantMessage)
  })
})