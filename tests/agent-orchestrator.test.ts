// tests/agent-orchestrator.test.ts
import { describe, it, expect } from "vitest"
import { AgentOrchestrator } from "../src/agent-orchestrator.js"

describe("Agent Orchestration", () => {
  it("should start and stop an agent loop", () => {
    const orchestrator = new AgentOrchestrator()
    orchestrator.start()
    expect(orchestrator.isRunning).toBe(true)
    orchestrator.stop()
    expect(orchestrator.isRunning).toBe(false)
  })

  it("should pause and resume an agent loop", () => {
    const orchestrator = new AgentOrchestrator()
    orchestrator.start()
    expect(orchestrator.isRunning).toBe(true)
    orchestrator.pause()
    expect(orchestrator.isRunning).toBe(false)
    orchestrator.resume()
    expect(orchestrator.isRunning).toBe(true)
  })

  it("should manage agent dependencies", () => {
    const orchestrator = new AgentOrchestrator()
    const agent1 = orchestrator.createAgent("agent1")
    const agent2 = orchestrator.createAgent("agent2")
    orchestrator.addDependency(agent1, agent2)
    orchestrator.start()
    expect(agent1.isRunning).toBe(true)
    expect(agent2.isRunning).toBe(true)
    orchestrator.stop()
    expect(agent1.isRunning).toBe(false)
    expect(agent2.isRunning).toBe(false)
  })
})