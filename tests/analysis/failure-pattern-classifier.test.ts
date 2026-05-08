import { describe, it, expect } from "vitest"
import { FailurePatternClassifier } from "../../../src/analysis/failure-pattern-classifier.js"

describe("FailurePatternClassifier", () => {
  it("should correctly classify a simple failure pattern", async () => {
    const classifier = new FailurePatternClassifier()
    const messages = [
      { role: "user", content: "The user requested a list of products." },
      { role: "assistant", content: [{ type: "text", text: "Here is the list." }] },
      { role: "tool", tool_use_id: "tool_1", content: "Error: Database connection failed.", is_error: true }
    ]
    const pattern = await classifier.classify(messages)
    expect(pattern).toBe("database_connection_failure")
  })

  it("should handle mixed failure types and classify correctly", async () => {
    const classifier = new FailurePatternClassifier()
    const messages = [
      { role: "user", content: "Please process the data." },
      { role: "assistant", content: [{ type: "text", text: "Processing started." }] },
      { role: "tool", tool_use_id: "tool_2", content: "API rate limit exceeded.", is_error: true }
    ]
    const pattern = await classifier.classify(messages)
    expect(pattern).toBe("rate_limit_exceeded")
  })

  it("should return null or a default pattern when no clear failure is detected", async () => {
    const classifier = new FailurePatternClassifier()
    const messages = [
      { role: "user", content: "Hello, how are you?" },
      { role: "assistant", content: [{ type: "text", text: "I am doing well, thank you." }] }
    ]
    const pattern = await classifier.classify(messages)
    expect(pattern).toBeNull()
  })
})