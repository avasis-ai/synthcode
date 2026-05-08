import { describe, it, expect } from "vitest"
import { ContextualPolicyEnforcer } from "../src/policy/contextual-policy-enforcer"

describe("ContextualPolicyEnforcer", () => {
    it("should enforce basic content policy rules on user messages", async () => {
        const enforcer = new ContextualPolicyEnforcer()
        const userMessage = { role: "user", content: "Hello, how are you?" }
        const result = await enforcer.enforceUserMessage(userMessage)
        expect(result.isAllowed).toBe(true)
        expect(result.reason).toBeUndefined()
    })

    it("should block user messages containing prohibited keywords", async () => {
        const enforcer = new ContextualPolicyEnforcer()
        const userMessage = { role: "user", content: "I want to discuss illegal activities." }
        const result = await enforcer.enforceUserMessage(userMessage)
        expect(result.isAllowed).toBe(false)
        expect(result.reason).toContain("prohibited keywords")
    })

    it("should allow user messages that are neutral and safe", async () => {
        const enforcer = new ContextualPolicyEnforcer()
        const userMessage = { role: "user", content: "What is the capital of France?" }
        const result = await enforcer.enforceUserMessage(userMessage)
        expect(result.isAllowed).toBe(true)
        expect(result.reason).toBeUndefined()
    })
})