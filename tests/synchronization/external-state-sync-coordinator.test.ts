import { describe, it, expect, vi } from "vitest"
import { ExternalStateSyncCoordinator } from "../../../src/synchronization/external-state-sync-coordinator.js"

describe("ExternalStateSyncCoordinator", () => {
    it("should initialize and synchronize state correctly from multiple sources", async () => {
        const mockSource1 = {
            id: "source1",
            getLatestState: vi.fn().mockResolvedValue({ a: 1, b: "s1" }),
            getConflictResolver: vi.fn().mockReturnValue((_, __, ___) => ({ ...{}, ...{ source1: true } }))
        }
        const mockSource2 = {
            id: "source2",
            getLatestState: vi.fn().mockResolvedValue({ b: "s2", c: 3 }),
            getConflictResolver: vi.fn().mockReturnValue((_, __, ___) => ({ ...{}, ...{ source2: true } }))
        }

        const coordinator = new ExternalStateSyncCoordinator([mockSource1, mockSource2])

        await coordinator.synchronize()

        expect(mockSource1.getLatestState).toHaveBeenCalledTimes(1)
        expect(mockSource2.getLatestState).toHaveBeenCalledTimes(1)

        const unifiedState = await coordinator.getUnifiedState()
        expect(unifiedState).toEqual({ a: 1, b: "s2", c: 3, source1: true, source2: true })
    })

    it("should handle conflict resolution when merging states", async () => {
        const mockSource1 = {
            id: "source1",
            getLatestState: vi.fn().mockResolvedValue({ value: "s1", count: 1 }),
            getConflictResolver: vi.fn().mockReturnValue((_, currentState, newState) => ({ ...currentState, ...newState, source1: true }))
        }
        const mockSource2 = {
            id: "source2",
            getLatestState: vi.fn().mockResolvedValue({ value: "s2", count: 2 }),
            getConflictResolver: vi.fn().mockReturnValue((_, currentState, newState) => ({ ...currentState, ...newState, source2: true }))
        }

        const coordinator = new ExternalStateSyncCoordinator([mockSource1, mockSource2])

        await coordinator.synchronize()

        const unifiedState = await coordinator.getUnifiedState()
        // The conflict resolver should merge the values, and the final state should reflect the merge logic
        expect(unifiedState.value).toBe("s2") // Assuming source2's resolver overwrites or is the last one applied
        expect(unifiedState.count).toBe(2)
        expect(Object.keys(unifiedState)).toHaveLength(4) // value, count, source1, source2
    })

    it("should return an empty state if no sources are provided", async () => {
        const coordinator = new ExternalStateSyncCoordinator([])

        await coordinator.synchronize()

        const unifiedState = await coordinator.getUnifiedState()
        expect(unifiedState).toEqual({})
    })
})