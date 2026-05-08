import { describe, it, expect, vi } from "vitest";
import { HypothesisDrivenResearchLoopManager } from "../src/research/hypothesis-driven-research-loop-manager.js";

describe("HypothesisDrivenResearchLoopManager", () => {
  it("should initialize correctly and manage the research loop state", async () => {
    const manager = new HypothesisDrivenResearchLoopManager();
    expect(manager).toBeDefined();
    expect(manager.current_hypothesis).toBeNull();
    expect(manager.history).toEqual([]);
  });

  it("should update the research loop state when a new hypothesis is set", async () => {
    const manager = new HypothesisDrivenResearchLoopManager();
    const hypothesis = "The best way to learn quantum physics is through interactive simulations.";
    await manager.set_hypothesis(hypothesis);
    expect(manager.current_hypothesis).toBe(hypothesis);
  });

  it("should append messages to the history correctly throughout the research cycle", async () => {
    const manager = new HypothesisDrivenResearchLoopManager();
    const initialMessage: any = { role: "user", content: "Start research." };
    await manager.add_message(initialMessage);
    expect(manager.history).toHaveLength(1);

    const assistantMessage: any = { role: "assistant", content: [] };
    await manager.add_message(assistantMessage);
    expect(manager.history).toHaveLength(2);
  });
});