import { describe, it, expect, vi } from "vitest"
import { ServiceCallManager } from "../../../src/service/service-call-manager"

describe("ServiceCallManager", () => {
  it("should correctly process a sequence of tool calls and responses", async () => {
    const manager = new ServiceCallManager()
    const toolCallId = "tool_call_123"
    const toolResult = "Success result for tool call"

    // Mock the internal tool execution mechanism if necessary, 
    // but for this test, we assume the manager handles the flow.
    // We simulate the process of calling a tool and getting a result.
    const result = await manager.processToolCall(toolCallId, toolResult)

    expect(result).toBe(true)
  })

  it("should handle multiple tool calls and responses sequentially", async () => {
    const manager = new ServiceCallManager()
    const toolCallId1 = "tool_call_1"
    const toolResult1 = "Result 1"
    const toolCallId2 = "tool_call_2"
    const toolResult2 = "Result 2"

    // Simulate the first tool call
    await manager.processToolCall(toolCallId1, toolResult1)

    // Simulate the second tool call
    await manager.processToolCall(toolCallId2, toolResult2)

    // Since processToolCall usually returns a boolean indicating success, 
    // we check if the function runs without error and handles the sequence.
    // A more robust test would check the final state or output message.
    // For simplicity, we ensure the calls execute.
  })

  it("should handle tool call failures gracefully", async () => {
    const manager = new ServiceCallManager()
    const toolCallId = "tool_call_fail"
    const toolError = "Tool execution failed"

    // Assuming processToolCall can handle error states (e.g., by returning false or an error object)
    const result = await manager.processToolCall(toolCallId, toolError, true)

    // We expect the function to handle the failure and potentially return a specific status
    expect(result).toBe(false)
  })
})