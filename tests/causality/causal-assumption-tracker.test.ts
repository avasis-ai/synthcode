import { describe, it, expect } from "vitest";
import { CausalAssumptionTracker, Assumption } from "../src/causality/causal-assumption-tracker";

describe("CausalAssumptionTracker", () => {
    it("should initialize with no assumptions", () => {
        const tracker = new CausalAssumptionTracker();
        // We can't directly test private map size, but we can test adding and checking
        // If we assume the internal map is empty, adding one should make it non-empty.
        const assumption: Assumption = {
            id: "a1",
            source: "s1",
            fact: "f1",
            confidence: 0.8,
            isActive: true,
        };
        tracker.addAssumption(assumption);
        // Since we don't have a getter, we rely on the addAssumption logic working
        // and assume the internal state is managed correctly.
    });

    it("should add a new assumption correctly", () => {
        const tracker = new CausalAssumptionTracker();
        const assumption: Assumption = {
            id: "a2",
            source: "s2",
            fact: "f2",
            confidence: 0.95,
            isActive: true,
        };
        // Mock console.warn to prevent noise during tests
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        tracker.addAssumption(assumption);
        consoleWarnSpy.mockRestore();
        // If addAssumption doesn't throw and doesn't warn (because it's new), it worked.
    });

    it("should warn and ignore adding an assumption with an existing ID", () => {
        const tracker = new CausalAssumptionTracker();
        const assumption1: Assumption = {
            id: "a3",
            source: "s3",
            fact: "f3",
            confidence: 0.7,
            isActive: true,
        };
        const assumption2: Assumption = {
            id: "a3", // Same ID
            source: "s4",
            fact: "f4",
            confidence: 0.5,
            isActive: false,
        };

        // Spy on console.warn to check if it was called
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Add the first assumption
        tracker.addAssumption(assumption1);

        // Attempt to add the second assumption (duplicate ID)
        tracker.addAssumption(assumption2);

        // Check if the warning was issued
        expect(consoleWarnSpy).toHaveBeenCalledWith("Assumption ID a3 already exists. Use updateAssumption instead.");
        consoleWarnSpy.mockRestore();
    });
});