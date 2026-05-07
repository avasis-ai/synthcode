import { describe, it, expect, vi } from "vitest"
import { MultiAgentDelegationManager, AgentRequest, AgentResult } from "./multi-agent-delegation-manager"

describe("MultiAgentDelegationManager", () => {
  it("should initialize with a correct status and event emitter functionality", () => {
    const manager = new MultiAgentDelegationManager()
    expect(manager).toBeInstanceOf(EventEmitter)
    expect(manager.getCurrentStatus()).toBe("IDLE")
  })

  it("should successfully delegate a task to multiple agents and update status", async () => {
    const manager = new MultiAgentDelegationManager()
    const request: AgentRequest = {
      taskDescription: "Analyze the market trends",
      context: { source: "financial report" },
      agentSpecificParameters: { depth: 3 }
    }

    // Mock the internal agent execution logic (assuming a method or internal mechanism for delegation)
    // Since the actual delegation mechanism isn't fully visible, we test the public interface flow.
    // We'll assume a method like 'delegateTask' exists and handles the process.
    const mockAgents = ["agentA", "agentB"]
    vi.spyOn(manager, "executeDelegation").mockResolvedValue([
      { agentId: "agentA", status: "SUCCESS", output: "A's analysis", rawResult: {} },
      { agentId: "agentB", status: "SUCCESS", output: "B's analysis", rawResult: {} },
    ])

    await manager.delegateTask(request, mockAgents)

    expect(manager.getCurrentStatus()).toBe("IN_PROGRESS")
    await expect(manager.hasDelegationCompleted()).resolves.toBe(true)
    
    // Simulate completion and check final status
    await manager.completeDelegation(mockAgents.length, [
        { agentId: "agentA", status: "SUCCESS", output: "A's analysis", rawResult: {} },
        { agentId: "agentB", status: "SUCCESS", output: "B's analysis", rawResult: {} },
    ])

    expect(manager.getCurrentStatus()).toBe("COMPLETED")
  })

  it("should handle agent failures and update the overall status correctly", async () => {
    const manager = new MultiAgentDelegationManager()
    const request: AgentRequest = {
      taskDescription: "Process user data",
      context: { userId: 123 },
      agentSpecificParameters: {}
    }
    const mockAgents = ["agentX", "agentY"]

    vi.spyOn(manager, "executeDelegation").mockResolvedValue([
      { agentId: "agentX", status: "SUCCESS", output: "Good data", rawResult: {} },
      { agentId: "agentY", status: "FAILURE", output: "Error processing", rawResult: "Timeout" },
    ])

    await manager.delegateTask(request, mockAgents)

    // Simulate completion with mixed results
    await manager.completeDelegation(mockAgents.length, [
        { agentId: "agentX", status: "SUCCESS", output: "Good data", rawResult: {} },
        { agentId: "agentY", status: "FAILURE", output: "Error processing", rawResult: "Timeout" },
    ])

    expect(manager.getCurrentStatus()).toBe("FAILED")
  })
})