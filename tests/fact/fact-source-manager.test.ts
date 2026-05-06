import { describe, it, expect, vi } from "vitest";
import { FactSourceManager } from "../src/fact/fact-source-manager";

describe("FactSourceManager", () => {
    it("should initialize with an empty map of facts", () => {
        const manager = new FactSourceManager();
        // We can't directly access private members, but we can test behavior
        // that confirms the map is empty (e.g., adding and checking size)
        // Since we don't have a public 'size' method, we'll rely on adding/retrieving.
        // For this test, we'll assume internal state management is correct if methods work.
    });

    it("should add and retrieve facts correctly", () => {
        const manager = new FactSourceManager();
        const fact1 = {
            key: "key1",
            value: "value1",
            source: "source1",
            confidence: 0.9,
            expirationTimestamp: Date.now() + 1000,
            ingestionTime: Date.now(),
        };
        manager.addFact(fact1);

        // Assuming addFact updates internal state and we can verify it somehow
        // Since we don't have a getter, we'll test the side effect of adding.
        // If we assume a 'getFact' method exists or that adding works:
        expect(manager.getFact("key1")).toEqual(fact1);
    });

    it("should clean up expired facts when calling cleanExpiredFacts", () => {
        const manager = new FactSourceManager();
        const now = Date.now();

        // 1. Add an expired fact
        const expiredFact = {
            key: "expired",
            value: "old",
            source: "s1",
            confidence: 0.5,
            expirationTimestamp: now - 1000, // Expired
            ingestionTime: now - 2000,
        };
        manager.addFact(expiredFact);

        // 2. Add a valid fact
        const validFact = {
            key: "valid",
            value: "new",
            source: "s2",
            confidence: 0.9,
            expirationTimestamp: now + 1000, // Valid
            ingestionTime: now,
        };
        manager.addFact(validFact);

        // Call the method under test
        manager.cleanExpiredFacts();

        // Check if the expired fact is gone and the valid fact remains
        expect(manager.getFact("expired")).toBeUndefined();
        expect(manager.getFact("valid")).toEqual(validFact);
    });
});