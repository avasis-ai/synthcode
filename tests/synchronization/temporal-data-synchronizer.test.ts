import { describe, it, expect } from "vitest"
import { TemporalDataSynchronizer } from "../src/synchronization/temporal-data-synchronizer"

describe("TemporalDataSynchronizer", () => {
    it("should correctly synchronize records and resolve conflicts using the provided resolver", async () => {
        const mockRecords: DataRecord[] = [
            { timestamp: 1678886400000, source: "A", payload: { id: "item1", value: 10 } },
            { timestamp: 1678886400000, source: "B", payload: { id: "item1", value: 20 } }, // Conflict
            { timestamp: 1678886500000, source: "A", payload: { id: "item2", value: 30 } },
            { timestamp: 1678886500000, source: "C", payload: { id: "item2", value: 40 } }, // Conflict
        ]

        // Resolver that always picks the value from the source "A"
        const resolver: ConflictResolver = (key, records) => {
            const sourceA = records.find(r => r.source === "A")?.payload;
            if (sourceA) return { resolvedValue: sourceA.value };
            return null;
        }

        const synchronizer = new TemporalDataSynchronizer(resolver)
        const synchronizedData = synchronizer.synchronize(mockRecords)

        expect(synchronizedData).toHaveLength(2)
        // Check if the conflict for item1 was resolved using the resolver logic (source A)
        const item1 = synchronizedData.find(r => r.payload.id === "item1")
        expect(item1?.payload.resolvedValue).toBe(10)
        // Check if the conflict for item2 was resolved using the resolver logic (source A/C - but resolver only checks A)
        const item2 = synchronizedData.find(r => r.payload.id === "item2")
        expect(item2?.payload.resolvedValue).toBeUndefined() // Since the resolver only checks for source A, and item2 has no source A record
    })

    it("should handle records with no conflicts gracefully", async () => {
        const mockRecords: DataRecord[] = [
            { timestamp: 1678886400000, source: "A", payload: { id: "item1", value: 10 } },
            { timestamp: 1678886500000, source: "B", payload: { id: "item2", value: 30 } },
            { timestamp: 1678886600000, source: "C", payload: { id: "item3", value: 40 } },
        ]

        // A resolver that simply returns the payload of the first record found
        const resolver: ConflictResolver = (key, records) => records[0].payload;

        const synchronizer = new TemporalDataSynchronizer(resolver)
        const synchronizedData = synchronizer.synchronize(mockRecords)

        expect(synchronizedData).toHaveLength(3)
        expect(synchronizedData.map(r => r.payload.id)).toEqual(["item1", "item2", "item3"])
    })

    it("should return an empty array when given an empty list of records", async () => {
        const mockRecords: DataRecord[] = []
        const resolver: ConflictResolver = (key, records) => null

        const synchronizer = new TemporalDataSynchronizer(resolver)
        const synchronizedData = synchronizer.synchronize(mockRecords)

        expect(synchronizedData).toEqual([])
    })
})