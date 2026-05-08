import { describe, it, expect } from "vitest";
import { ConsensusArbitrator, Opinion } from "../src/consensus/consensus-arbitrator";

describe("ConsensusArbitrator", () => {
  it("should initialize correctly", () => {
    const arbitrator = new ConsensusArbitrator();
    // Assuming there's a way to check internal state or methods that rely on initialization
    // Since we can't directly access private state, we test a basic operation.
    expect(arbitrator).toBeInstanceOf(ConsensusArbitrator);
  });

  it("should calculate consensus when all opinions agree", () => {
    const arbitrator = new ConsensusArbitrator();
    const opinions: Opinion[] = [
      { sourceId: "A", recommendation: "Strategy X", confidenceScore: 0.9 },
      { sourceId: "B", recommendation: "Strategy X", confidenceScore: 0.8 },
      { sourceId: "C", recommendation: "Strategy X", confidenceScore: 0.7 },
    ];
    // Assuming the arbitrator has a method like 'arbitrate' or 'process'
    // We mock the expected behavior based on the class structure.
    // Since the full implementation isn't provided, we assume a method exists.
    // Let's assume the method is `arbitrate(opinions: Opinion[]): ConsensusResult`
    // For testing purposes, we'll assume the method exists and works as expected.
    // If the method is `arbitrate`, we'll call it.
    // Since the provided snippet only shows the class structure, we must assume the method signature.
    // Let's assume the method is `arbitrate(opinions: Opinion[]): { consensus: string, justification: string }`
    const result = (arbitrator as any).arbitrate(opinions);
    expect(result.consensus).toBe("Strategy X");
    expect(result.justification).toContain("All opinions agree");
  });

  it("should report conflict when opinions disagree significantly", () => {
    const arbitrator = new ConsensusArbitrator();
    const opinions: Opinion[] = [
      { sourceId: "A", recommendation: "Strategy Alpha", confidenceScore: 0.9 },
      { sourceId: "B", recommendation: "Strategy Beta", confidenceScore: 0.9 },
      { sourceId: "C", recommendation: "Strategy Gamma", confidenceScore: 0.9 },
    ];
    // Assuming the arbitrator method handles conflict reporting
    const result = (arbitrator as any).arbitrate(opinions);
    expect(result.consensus).toBe("Conflict Detected");
    expect(result.justification).toContain("Multiple conflicting recommendations");
  });
});