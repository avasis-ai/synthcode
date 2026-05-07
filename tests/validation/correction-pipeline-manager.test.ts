import { describe, it, expect } from "vitest"
import { CorrectionPipelineManager } from "../src/validation/correction-pipeline-manager.js"

describe("CorrectionPipelineManager", () => {
  it("should initialize correctly", () => {
    const manager = new CorrectionPipelineManager()
    expect(manager).toBeInstanceOf(CorrectionPipelineManager)
  })

  it("should process a simple list of messages", async () => {
    const manager = new CorrectionPipelineManager()
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: ["Hi there!"] },
    ]
    const result = await manager.processMessages(messages)
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "user", content: "Hello" }),
      expect.objectContaining({ role: "assistant", content: ["Hi there!"] }),
    ]))
  })

  it("should handle a mix of message types including tool results", async () => {
    const manager = new CorrectionPipelineManager()
    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "tool", tool_use_id: "t1", content: "Sunny" },
      { role: "assistant", content: ["It's sunny today!"] },
    ]
    const result = await manager.processMessages(messages)
    expect(result).toHaveLength(3)
    expect(result[0].role).toBe("user")
    expect(result[1].role).toBe("tool")
    expect(result[2].role).toBe("assistant")
  })
})