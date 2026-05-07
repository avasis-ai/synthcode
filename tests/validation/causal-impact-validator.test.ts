import { describe, it, expect } from "vitest";
import { CausalImpactValidator } from "../src/validation/causal-impact-validator";

describe("CausalImpactValidator", () => {
  it("should validate a simple linear causal chain", async () => {
    const validator = new CausalImpactValidator();
    const contextGraph = {
      nodes: new Map([
        ["A", { id: "A", type: "action", data: { name: "Action A" }, dependencies: [] }],
        ["B", { id: "B", type: "action", data: { name: "Action B" }, dependencies: ["A"] }],
        ["C", { id: "C", type: "action", data: { name: "Action C" }, dependencies: ["B"] }],
      ]),
      edges: new Set([
        ["A", "B"],
        ["B", "C"],
      ]),
    };
    const result = await validator.validate("C", contextGraph);
    expect(result).toBe(true);
  });

  it("should fail validation if a dependency is missing from the graph", async () => {
    const validator = new CausalImpactValidator();
    const contextGraph = {
      nodes: new Map([
        ["A", { id: "A", type: "action", data: { name: "Action A" }, dependencies: [] }],
        ["B", { id: "B", type: "action", data: { name: "Action B" }, dependencies: ["Z"] }], // Z is missing
      ]),
      edges: new Set([
        ["A", "B"],
      ]),
    };
    const result = await validator.validate("B", contextGraph);
    expect(result).toBe(false);
  });

  it("should handle disconnected components correctly", async () => {
    const validator = new CausalImpactValidator();
    const contextGraph = {
      nodes: new Map([
        ["A", { id: "A", type: "action", data: { name: "Action A" }, dependencies: [] }],
        ["B", { id: "B", type: "action", data: { name: "Action B" }, dependencies: ["A"] }],
        ["D", { id: "D", type: "action", data: { name: "Action D" }, dependencies: [] }], // Disconnected
      ]),
      edges: new Set([
        ["A", "B"],
      ]),
    };
    // Validating B should still pass even if D exists but is irrelevant
    const result = await validator.validate("B", contextGraph);
    expect(result).toBe(true);
  });
});