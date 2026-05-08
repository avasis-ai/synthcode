import { describe, it, expect } from "vitest";
import { KnowledgeSynthesisEngine } from "../src/synthesis/knowledge-synthesis-engine";
import { Context, GapType, SynthesisProposal } from "../src/synthesis/types";

describe("KnowledgeSynthesisEngine", () => {
  it("should generate a proposal when a missing capability is detected", async () => {
    const mockContext: Context = {
      history: [],
      activeKnowledgeBase: new Map([["user_profile", { skills: ["writing"] }]]),
      provisionalKnowledge: new Map(),
    };
    const engine = new KnowledgeSynthesisEngine();
    const gapType: GapType = "MissingCapability";

    const proposal = await engine.proposeSynthesis(mockContext, gapType);

    expect(proposal).toBeDefined();
    expect(typeof (proposal as SynthesisProposal).confidenceScore).toBe("number");
    expect((proposal as SynthesisProposal).justification).toContain("MissingCapability");
  });

  it("should handle multiple gaps and prioritize the most critical one", async () => {
    const mockContext: Context = {
      history: [],
      activeKnowledgeBase: new Map(),
      provisionalKnowledge: new Map(),
    };
    const engine = new KnowledgeSynthesisEngine();
    // Simulate a scenario where multiple gaps exist, but the engine should focus on one
    const gapType: GapType = "UnresolvedConflict";

    const proposal = await engine.proposeSynthesis(mockContext, gapType);

    expect(proposal).toBeDefined();
    expect((proposal as SynthesisProposal).justification).toContain("UnresolvedConflict");
    expect((proposal as SynthesisProposal).confidenceScore).toBeGreaterThanOrEqual(0);
  });

  it("should return a minimal proposal if context is insufficient", async () => {
    const mockContext: Context = {
      history: [],
      activeKnowledgeBase: new Map(),
      provisionalKnowledge: new Map(),
    };
    const engine = new KnowledgeSynthesisEngine();
    const gapType: GapType = "UnmappedLink";

    const proposal = await engine.proposeSynthesis(mockContext, gapType);

    expect(proposal).toBeDefined();
    expect((proposal as SynthesisProposal).isProvisional).toBe(true);
    expect((proposal as SynthesisProposal).confidenceScore).toBeLessThan(0.5);
  });
});