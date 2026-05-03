import { describe, it, expect } from "vitest";
import { RelevanceDecayCalculator } from "../src/context/contextual-memory-retrieval-with-relevance-decay";

describe("RelevanceDecayCalculator", () => {
  it("should calculate a factor of 1.0 when time difference is 0", () => {
    const mockDecayRule: any = {
      calculateFactor: (timeDifferenceMs: number) => {
        if (timeDifferenceMs === 0) return 1.0;
        return 0.5;
      },
    };
    const calculator = new RelevanceDecayCalculator(mockDecayRule);
    const factor = calculator.calculateDecayFactor(0);
    expect(factor).toBe(1.0);
  });

  it("should calculate a decaying factor for a non-zero time difference", () => {
    const mockDecayRule: any = {
      calculateFactor: (timeDifferenceMs: number) => {
        if (timeDifferenceMs > 0) return 0.2;
        return 1.0;
      },
    };
    const calculator = new RelevanceDecayCalculator(mockDecayRule);
    const factor = calculator.calculateDecayFactor(1000);
    expect(factor).toBe(0.2);
  });

  it("should correctly use the provided decay rule for factor calculation", () => {
    const mockDecayRule: any = {
      calculateFactor: (timeDifferenceMs: number) => {
        if (timeDifferenceMs === 5000) return 0.1;
        return 0.9;
      },
    };
    const calculator = new RelevanceDecayCalculator(mockDecayRule);
    const factor = calculator.calculateDecayFactor(5000);
    expect(factor).toBe(0.1);
  });
});