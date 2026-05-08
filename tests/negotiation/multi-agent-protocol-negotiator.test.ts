import { describe, it, expect } from "vitest";
import { MultiAgentProtocolNegotiator } from "../src/negotiation/multi-agent-protocol-negotiator";

describe("MultiAgentProtocolNegotiator", () => {
  it("should initialize correctly with a list of agents and protocols", () => {
    const agent1 = {
      id: "agent-a",
      capabilities: ["search", "planning"],
      goals: ["find information"],
      history: [],
    };
    const agent2 = {
      id: "agent-b",
      capabilities: ["nlp", "generation"],
      goals: ["create content"],
      history: [],
    };
    const protocols = [
      {
        name: "ProtocolX",
        description: "A standard communication protocol.",
        requiredCapabilities: ["search"],
        compatibilityScore: 0.8,
      },
      {
        name: "ProtocolY",
        description: "Advanced data exchange.",
        requiredCapabilities: ["nlp", "planning"],
        compatibilityScore: 0.9,
      },
    ];

    const negotiator = new MultiAgentProtocolNegotiator([agent1, agent2], protocols);
    expect(negotiator).toBeDefined();
    expect(negotiator.agents.length).toBe(2);
    expect(negotiator.protocols.length).toBe(2);
  });

  it("should select the best protocol based on capability overlap and compatibility score", () => {
    const agent1 = {
      id: "agent-a",
      capabilities: ["search", "planning"],
      goals: ["find information"],
      history: [],
    };
    const agent2 = {
      id: "agent-b",
      capabilities: ["nlp", "planning"],
      goals: ["create content"],
      history: [],
    };
    const protocols = [
      {
        name: "ProtocolA",
        description: "Requires search and nlp.",
        requiredCapabilities: ["search", "nlp"],
        compatibilityScore: 0.7,
      },
      {
        name: "ProtocolB",
        description: "Requires planning only.",
        requiredCapabilities: ["planning"],
        compatibilityScore: 0.95,
      },
    ];

    const negotiator = new MultiAgentProtocolNegotiator([agent1, agent2], protocols);
    // ProtocolB requires only 'planning', which both agents have.
    // ProtocolA requires 'search' (agent1) and 'nlp' (agent2).
    // The negotiator should prioritize the highest score with sufficient coverage.
    // In this simplified test, we assume the best score/coverage combination is found.
    // Since ProtocolB has a high score and is covered by both, it should be selected.
    const bestProtocol = negotiator.selectBestProtocol();
    expect(bestProtocol?.name).toBe("ProtocolB");
  });

  it("should handle cases where no protocol meets the minimum capability requirements", () => {
    const agent1 = {
      id: "agent-a",
      capabilities: ["search"],
      goals: ["find information"],
      history: [],
    };
    const agent2 = {
      id: "agent-b",
      capabilities: ["generation"],
      goals: ["create content"],
      history: [],
    };
    const protocols = [
      {
        name: "ProtocolMissing",
        description: "Requires planning and nlp.",
        requiredCapabilities: ["planning", "nlp"],
        compatibilityScore: 0.9,
      },
    ];

    const negotiator = new MultiAgentProtocolNegotiator([agent1, agent2], protocols);
    const bestProtocol = negotiator.selectBestProtocol();
    expect(bestProtocol).toBeUndefined();
  });
});