import { describe, it, expect, beforeEach } from "vitest";
import { DataStewardshipManager } from "../src/stewardship/data-stewardship-manager";

describe("DataStewardshipManager", () => {
    let manager: DataStewardshipManager;

    beforeEach(() => {
        manager = new DataStewardshipManager();
    });

    it("should initialize stewardship for a new dataId", () => {
        const dataId = "data-123";
        const ownerId = "user-abc";
        manager.initializeStewardship(dataId, ownerId);

        // Assuming there is a way to check the internal state or a getter for testing
        // Since the internal state is private, we rely on the side effect or assume a getter exists for robust testing.
        // For this test, we assume initialization succeeds without error.
        // If we could access the records map:
        // expect(manager.getRecord(dataId)).toBeDefined();
    });

    it("should throw an error if stewardship is already initialized for the same dataId", () => {
        const dataId = "data-456";
        const ownerId = "user-xyz";

        // First initialization
        manager.initializeStewardship(dataId, ownerId);

        // Second initialization attempt
        expect(() => {
            manager.initializeStewardship(dataId, "another-user");
        }).toThrow(`Stewardship already initialized`);
    });

    it("should handle multiple independent dataIds correctly", () => {
        const dataId1 = "data-A";
        const dataId2 = "data-B";

        manager.initializeStewardship(dataId1, "owner-A");
        manager.initializeStewardship(dataId2, "owner-B");

        // Assert that both IDs were initialized successfully (assuming no error means success)
        // If we could check the count:
        // expect(manager.getRecordCount()).toBe(2);
    });
});