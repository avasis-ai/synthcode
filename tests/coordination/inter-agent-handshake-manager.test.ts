import { describe, it, expect, vi } from "vitest"
import { HandshakeContext, Agent, ExecutionPlan } from "../src/coordination/inter-agent-handshake-manager"
import { InterAgentHandshakeManager } from "../src/coordination/inter-agent-handshake-manager"

describe("InterAgentHandshakeManager", () => {
    it("should initialize with correct context and agents", () => {
        const mockAgents: Agent[] = [
            { id: "agentA", capabilities: { c1: true }, protocolVersion: "1.0", onMessage: async () => ({ result: "A" }) },
            { id: "agentB", capabilities: { c2: true }, protocolVersion: "2.0", onMessage: async () => ({ result: "B" }) },
        ]
        const initialContext: HandshakeContext = {
            state: "PENDING",
            agents: mockAgents,
            agreedProtocol: {},
            expectedSequence: [],
        }
        const manager = new InterAgentHandshakeManager(initialContext)

        expect(manager).toBeDefined()
        expect(manager.getContext()).toEqual(initialContext)
    })

    it("should successfully transition state and plan steps when handshake is successful", async () => {
        const mockAgents: Agent[] = [
            { id: "agentA", capabilities: {}, protocolVersion: "1.0", onMessage: async () => ({ result: "A" }) },
            { id: "agentB", capabilities: {}, protocolVersion: "2.0", onMessage: async () => ({ result: "B" }) },
        ]
        const initialContext: HandshakeContext = {
            state: "PENDING",
            agents: mockAgents,
            agreedProtocol: { "data": "v1" },
            expectedSequence: ["step1", "step2"],
        }
        const manager = new InterAgentHandshakeManager(initialContext)

        // Mock the execution plan generation
        (manager as any).generateExecutionPlan = vi.fn(() => ({
            steps: [{ step: "step1", agentId: "agentA" }, { step: "step2", agentId: "agentB" }],
        }))

        const result = await (manager as any).executeHandshake()

        expect(result).toEqual({
            success: true,
            plan: {
                steps: [{ step: "step1", agentId: "agentA" }, { step: "step2", agentId: "agentB" }],
            },
            newState: "COMMITTED",
        })
    })

    it("should transition to FAILED state and record reason if any agent fails during handshake", async () => {
        const mockAgents: Agent[] = [
            { id: "agentA", capabilities: {}, protocolVersion: "1.0", onMessage: async () => ({ result: "A" }) },
            { id: "agentB", capabilities: {}, protocolVersion: "2.0", onMessage: async () => { throw new Error("Connection failed") } },
        ]
        const initialContext: HandshakeContext = {
            state: "PENDING",
            agents: mockAgents,
            agreedProtocol: {},
            expectedSequence: ["step1"],
        }
        const manager = new InterAgentHandshakeManager(initialContext)

        // Mock the execution plan generation to simulate failure during execution
        (manager as any).generateExecutionPlan = vi.fn(() => ({
            steps: [{ step: "step1", agentId: "agentA" }],
        }))

        // Simulate failure during execution
        const result = await (manager as any).executeHandshake()

        expect(result.success).toBe(false)
        expect(result.newState).toBe("FAILED")
        expect(result.failureReason).toContain("Connection failed")
    })
})