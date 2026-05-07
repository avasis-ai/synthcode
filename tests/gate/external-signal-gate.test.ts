import { describe, it, expect } from "vitest"
import { ExternalSignalGate } from "../src/gate/external-signal-gate"

describe("ExternalSignalGate", () => {
  it("should correctly process a simple user message", () => {
    const gate = new ExternalSignalGate()
    const message = { role: "user", content: "Hello world" }
    const result = gate.processMessage(message)
    expect(result).toEqual({
      type: "text",
      text: "Hello world",
    })
  })

  it("should correctly process an assistant message with content array", () => {
    const gate = new ExternalSignalGate()
    const message = { role: "assistant", content: ["Some content"] }
    const result = gate.processMessage(message)
    expect(result).toEqual({
      type: "text",
      text: "Some content",
    })
  })

  it("should handle tool result messages including errors", () => {
    const gate = new ExternalSignalGate()
    const message = {
      role: "tool",
      tool_use_id: "test-id",
      content: "Tool output",
      is_error: true,
    }
    const result = gate.processMessage(message)
    expect(result).toEqual({
      type: "tool_result",
      tool_use_id: "test-id",
      content: "Tool output",
      is_error: true,
    })
  })
})