import { describe, it, expect, vi } from "vitest"
import { AsynchronousFeedbackManager } from "../../../src/feedback/asynchronous-feedback-manager.js"

describe("AsynchronousFeedbackManager", () => {
    it("should initialize correctly with a list of messages", async () => {
        const messages = [
            { role: "user", content: "Hello" },
            { role: "assistant", content: ["Hi there"] },
        ]
        const manager = new AsynchronousFeedbackManager(messages)
        expect(manager).toBeDefined()
    })

    it("should add a user message and update the internal state", async () => {
        const manager = new AsynchronousFeedbackManager([])
        const userMessage = { role: "user", content: "What is the capital of France?" }
        await manager.addMessage(userMessage)
        const messages = manager.getMessages()
        expect(messages).toHaveLength(1)
        expect(messages[0].role).toBe("user")
        expect(messages[0].content).toBe("What is the capital of France?")
    })

    it("should add a tool result message and maintain message history", async () => {
        const manager = new AsynchronousFeedbackManager([])
        const userMessage = { role: "user", content: "What is the weather?" }
        await manager.addMessage(userMessage)
        const toolResult = { role: "tool", tool_use_id: "tool_123", content: "Sunny and 25C" }
        await manager.addMessage(toolResult)
        const messages = manager.getMessages()
        expect(messages).toHaveLength(2)
        expect(messages[0].role).toBe("user")
        expect(messages[1].role).toBe("tool")
        expect(messages[1].tool_use_id).toBe("tool_123")
    })
})