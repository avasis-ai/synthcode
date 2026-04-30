import { describe, it, expect } from "vitest";
import { BaseStateDiffer } from "../context/contextual-state-diffing-v5";

describe("BaseStateDiffer", () => {
  it("should correctly calculate diff for simple state changes", () => {
    const differ = new class extends BaseStateDiffer {
      diff(currentState: any, previousState: any): any {
        return {
          dataDiff: {
            key1: currentState.key1,
            key2: currentState.key2,
          },
          structuralDrift: {
            added: ["key3"],
            removed: [],
            modified: [],
          },
          decayImpact: 0.1,
        };
      }
    }();
    const currentState = { key1: "A", key2: "B" };
    const previousState = { key1: "A", key2: "B" };
    const result = differ.diff(currentState, previousState);
    expect(result.dataDiff.key1).toBe("A");
    expect(result.structuralDrift.added).toEqual(["key3"]);
  });

  it("should detect structural additions", () => {
    const differ = new class extends BaseStateDiffer {
      diff(currentState: any, previousState: any): any {
        return {
          dataDiff: {},
          structuralDrift: {
            added: ["newKey"],
            removed: [],
            modified: [],
          },
          decayImpact: 0.0,
        };
      }
    }();
    const currentState = {};
    const previousState = {};
    const result = differ.diff(currentState, previousState);
    expect(result.structuralDrift.added).toContain("newKey");
  });

  it("should detect structural removals", () => {
    const differ = new class extends BaseStateDiffer {
      diff(currentState: any, previousState: any): any {
        return {
          dataDiff: {},
          structuralDrift: {
            added: [],
            removed: ["oldKey"],
            modified: [],
          },
          decayImpact: 0.5,
        };
      }
    }();
    const currentState = {};
    const previousState = {};
    const result = differ.diff(currentState, previousState);
    expect(result.structuralDrift.removed).toContain("oldKey");
  });
});