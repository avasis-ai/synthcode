import { describe, it, expect } from "vitest"
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ToolUseBlock,
} from "../src/hypothesis/hypothesis-testing-framework"

describe("Hypothesis Testing Framework", () => {
  it("should correctly structure a simple user message", () => {
    const userMessage: UserMessage = { role: "user", content: "Hello world" }
    expect(userMessage).toEqual({ role: "user", content: "Hello world" })
  })

  it("should correctly structure an assistant message with content array", () => {
    const assistantMessage: AssistantMessage = { role: "assistant", content: ["Some content"] }
    expect(assistantMessage).toEqual({ role: "assistant", content: ["Some content"] })
  })

  it("should correctly structure a tool result message", () => {
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      tool_use_id: "test-id",
      content: "Tool output",
    }
    expect(toolResultMessage).toEqual({
      role: "tool",
      tool_use_id: "test-id",
      content: "Tool output",
    })
  })
})