import { describe, it, expect } from "vitest";
import { DecayRule } from "../src/context/contextual-memory-decay-scheduler-v5";

describe("DecayRule", () => {
  it("should calculate a higher weight for recent messages", () => {
    const rule: DecayRule = (contextType, metadata, ageSeconds) => {
      if (contextType === "user" && ageSeconds < 60) {
        return 1.0;
      }
      return 0.5;
    };
    const weight = rule("user", {}, 10);
    expect(weight).toBe(1.0);
  });

  it("should calculate a lower weight for older messages", () => {
    const rule: DecayRule = (contextType, metadata, ageSeconds) => {
      if (contextType === "user" && ageSeconds > 300) {
        return 0.1;
      }
      return 0.8;
    };
    const weight = rule("user", {}, 400);
    expect(weight).toBe(0.1);
  });

  it("should return a default weight for different context types", () => {
    const rule: DecayRule = (contextType, metadata, ageSeconds) => {
      if (contextType === "assistant") {
        return 0.9;
      }
      return 0.5;
    };
    const weight = rule("tool", {}, 100);
    expect(weight).toBe(0.5);
  });
});