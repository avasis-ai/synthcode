import { describe, it, expect } from "vitest"
import {
  AgentRoleConflictResolver,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../../../src/conflict/agent-role-conflict-resolver"

describe("AgentRoleConflictResolver", () => {
  it("should resolve conflict when the last message is from the user", async () => {
    const messages: [UserMessage, AssistantMessage, UserMessage] = [
      { role: "user", content: "Hi" },
      { role: "assistant", content: ["Hello there!"] },
      { role: "user", content: "How are you?" },
    ]
    const resolver = new AgentRoleConflictResolver()
    const resolvedMessages = await resolver.resolve(messages)

    expect(resolvedMessages).toHaveLength(3)
    expect(resolvedMessages[0].role).toBe("user")
    expect(resolvedMessages[1].role).toBe("assistant")
    expect(resolvedMessages[2].role).toBe("user")
  })

  it("should resolve conflict when the last message is from the assistant", async () => {
    const messages: [UserMessage, AssistantMessage, AssistantMessage] = [
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: ["Paris"] },
      { role: "assistant", content: ["It is Paris."] },
    ]
    const resolver = new AgentRoleConflictResolver()
    const resolvedMessages = await resolver.resolve(messages)

    expect(resolvedMessages).toHaveLength(3)
    expect(resolvedMessages[0].role).toBe("user")
    expect(resolvedMessages[1].role).toBe("assistant")
    expect(resolvedMessages[2].role).toBe("assistant")
  })

  it("should handle an empty message list gracefully", async () => {
    const messages: [] = []
    const resolver = new AgentRoleConflictResolver()
    const resolvedMessages = await resolver.resolve(messages)

    expect(resolvedMessages).toHaveLength(0)
  })
})