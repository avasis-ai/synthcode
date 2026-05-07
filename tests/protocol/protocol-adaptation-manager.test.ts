import { describe, it, expect } from "vitest"
import { ProtocolAdaptationManager } from "../../../src/protocol/protocol-adaptation-manager.js"

describe("ProtocolAdaptationManager", () => {
  it("should correctly adapt a simple user message to a list of content blocks", async () => {
    const manager = new ProtocolAdaptationManager()
    const userMessage = { role: "user", content: "Hello world" }
    const adaptedContent = await manager.adaptUserMessage(userMessage)

    expect(adaptedContent).toEqual([
      { type: "text", text: "Hello world" },
    ])
  })

  it("should correctly adapt an assistant message with multiple content blocks", async () => {
    const manager = new ProtocolAdaptationManager()
    const assistantMessage = {
      role: "assistant",
      content: [
        { type: "text", text: "Some text" },
        { type: "tool", tool_use_id: "tool1", content: "Tool output" },
      ],
    }
    const adaptedContent = await manager.adaptAssistantMessage(assistantMessage)

    expect(adaptedContent).toEqual([
      { type: "text", text: "Some text" },
      { type: "tool", tool_use_id: "tool1", content: "Tool output" },
    ])
  })

  it("should handle tool result messages correctly", async () => {
    const manager = new ProtocolAdaptationManager()
    const toolResultMessage = {
      role: "tool",
      tool_use_id: "tool1",
      content: "Success result",
      is_error: false,
    }
    const adaptedContent = await manager.adaptToolResultMessage(toolResultMessage)

    expect(adaptedContent).toEqual({
      role: "tool",
      tool_use_id: "tool1",
      content: "Success result",
      is_error: false,
    })
  })
})