import { describe, it, expect } from "vitest";
import { ContextualDecayRule } from "../src/context/contextual-memory-decay-scheduler-v7";

describe("ContextualDecayRule", () => {
  it("should calculate a high decay factor for recent, user-generated context", () => {
    const rule: ContextualDecayRule = {
      calculateDecayFactor: (timeElapsedSeconds: number, metadata: { relevanceScore: number; sourceType: "user" | "assistant" | "tool" }) => {
        if (metadata.sourceType === "user" && timeElapsedSeconds < 60) {
          return 0.1; // Low decay for recent user input
        }
        return 0.5;
      },
    };
    const decay = rule.calculateDecayFactor(30, { relevanceScore: 0.9, sourceType: "user" });
    expect(decay).toBeCloseTo(0.1);
  });

  it("should calculate a moderate decay factor for older, assistant-generated context", () => {
    const rule: ContextualDecayRule = {
      calculateDecayFactor: (timeElapsedSeconds: number, metadata: { relevanceScore: number; sourceType: "user" | "assistant" | "tool" }) => {
        if (metadata.sourceType === "assistant" && timeElapsedSeconds > 120) {
          return 0.3; // Moderate decay for older assistant responses
        }
        return 0.7;
      },
    };
    const decay = rule.calculateDecayFactor(150, { relevanceScore: 0.7, sourceType: "assistant" });
    expect(decay).toBeCloseTo(0.3);
  });

  it("should calculate a high decay factor for tool-generated context regardless of time", () => {
    const rule: ContextualDecayRule = {
      calculateDecayFactor: (timeElapsedSeconds: number, metadata: { relevanceScore: number; sourceType: "user" | "assistant" | "tool" }) => {
        if (metadata.sourceType === "tool") {
          return 0.9; // High decay for tool outputs to encourage re-evaluation
        }
        return 0.5;
      },
    };
    const decay = rule.calculateDecayFactor(5, { relevanceScore: 1.0, sourceType: "tool" });
    expect(decay).toBeCloseTo(0.9);
  });
});