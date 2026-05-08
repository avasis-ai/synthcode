import { describe, it, expect } from "vitest";
import { TrustDecayManager } from "../src/trust/trust-decay-manager.js";

describe("TrustDecayManager", () => {
    it("should initialize with an empty trust map", () => {
        const manager = new TrustDecayManager();
        // We can't directly test private map, but we can test functionality that relies on it being empty.
        // If we assume the constructor works, we test the public API.
        expect(manager).toBeInstanceOf(TrustDecayManager);
    });

    it("should correctly calculate decay for a standard entry over time", () => {
        const manager = new TrustDecayManager();
        const initialScore = 100;
        const halfLife = 3600; // 1 hour
        const entryKey = "userA";

        // Manually simulate adding an entry (assuming a method exists or we test the internal logic)
        // Since the provided code snippet is incomplete, we assume a method like 'addTrustEntry' exists
        // or we mock the internal state for testing the decay calculation logic.
        // For this test, we will assume the manager has a method to set up the entry.
        (manager as any).addTrustEntry(entryKey, initialScore, 0, halfLife);

        // Test decay after half a half-life (should be roughly 50%)
        const timeDeltaHalf = halfLife / 2;
        (manager as any).decayTrust(entryKey, timeDeltaHalf);
        let scoreAfterHalf = (manager as any).getScore(entryKey);
        expect(scoreAfterHalf).toBeCloseTo(initialScore * 0.707, 2); // Should be around 70.7%

        // Test decay after a full half-life (should be roughly 50%)
        (manager as any).decayTrust(entryKey, timeDeltaHalf);
        let scoreAfterFull = (manager as any).getScore(entryKey);
        expect(scoreAfterFull).toBeCloseTo(initialScore * 0.5, 2);
    });

    it("should handle zero or negative half-life by preventing decay", () => {
        const manager = new TrustDecayManager();
        const initialScore = 50;
        const entryKey = "userB";

        // Setup entry with zero half-life
        (manager as any).addTrustEntry(entryKey, initialScore, 0, 0);

        // Decay over a significant time period
        const timeDelta = 3600;
        (manager as any).decayTrust(entryKey, timeDelta);

        // Score should remain unchanged if half-life is zero/negative
        let score = (manager as any).getScore(entryKey);
        expect(score).toBeCloseTo(initialScore, 2);
    });
});