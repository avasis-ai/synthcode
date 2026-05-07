import { describe, it, expect } from "vitest"
import { ContextualContextBooster } from "../contextual-context-booster.js"

describe("ContextualContextBooster", () => {
    it("should correctly boost context when only user messages are present", () => {
        const booster = new ContextualContextBooster()
        const messages = [
            { role: "user", content: "Hello, what is the capital of France?" },
            { role: "user", content: "And what about Germany?" },
        ]
        const boostedContext = booster.boost(messages)
        expect(boostedContext).toContain("Hello, what is the capital of France?")
        expect(boostedContext).toContain("And what about Germany?")
    })

    it("should correctly boost context when a mix of roles are present", () => {
        const booster = new ContextualContextBooster()
        const messages = [
            { role: "user", content: "Initial query." },
            { role: "assistant", content: [] }, // Simplified for test
            { role: "tool", tool_use_id: "tool1", content: "Result for tool 1.", is_error: false },
            { role: "user", content: "Follow up query." },
        ]
        const boostedContext = booster.boost(messages)
        expect(boostedContext).toContain("Initial query.")
        expect(boostedContext).toContain("Result for tool 1.")
        expect(boostedContext).toContain("Follow up query.")
    })

    it("should handle an empty message history gracefully", () => {
        const booster = new ContextualContextBooster()
        const messages: any[] = []
        const boostedContext = booster.boost(messages)
        expect(boostedContext).toEqual([])
    })
})