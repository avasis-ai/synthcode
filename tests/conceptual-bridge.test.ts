import { describe, it, expect } from "vitest";
import { ConceptualBridge, BridgeRule } from "../src/conceptual-bridge.js";

describe("ConceptualBridge", () => {
  it("should correctly apply a single simple mapping rule", () => {
    const rules: BridgeRule[] = [
      {
        sourceToTarget: {
          "old term": "new term",
        },
        relationshipType: "synonym",
      },
    ];
    const bridge = new ConceptualBridge(rules);
    const input = "This text mentions the old term.";
    const expected = "This text mentions the new term.";
    expect(bridge.applyMapping(input)).toBe(expected);
  });

  it("should handle multiple distinct mapping rules", () => {
    const rules: BridgeRule[] = [
      {
        sourceToTarget: {
          "apple": "fruit",
        },
        relationshipType: "category",
      },
      {
        sourceToTarget: {
          "car": "automobile",
        },
        relationshipType: "synonym",
      },
    ];
    const bridge = new ConceptualBridge(rules);
    const input = "I bought an apple and a car.";
    // Assuming the implementation replaces all occurrences
    const expected = "I bought a fruit and an automobile.";
    expect(bridge.applyMapping(input)).toBe(expected);
  });

  it("should return the original text if no mapping rules apply", () => {
    const rules: BridgeRule[] = [
      {
        sourceToTarget: {
          "nonexistent": "replacement",
        },
        relationshipType: "test",
      },
    ];
    const bridge = new ConceptualBridge(rules);
    const input = "This text has no concepts to bridge.";
    expect(bridge.applyMapping(input)).toBe(input);
  });
});