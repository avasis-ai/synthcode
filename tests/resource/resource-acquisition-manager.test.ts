import { describe, it, expect } from "vitest"
import { ResourceAcquisitionManager, ResourceConflictError } from "../src/resource/resource-acquisition-manager"

describe("ResourceAcquisitionManager", () => {
    it("should successfully acquire a lock for a resource if none exists", () => {
        const manager = new ResourceAcquisitionManager()
        const resourceId = "testResource"
        const contextId = "contextA"
        const acquireTime = Date.now()
        const lockDuration = 1000

        // Mock the internal state or assume the method handles the logic
        // Since the full implementation isn't provided, we assume the method signature
        // is `acquireLock(resourceId: ResourceId, contextId: ContextId, durationMs: number): boolean`
        // and that a successful acquisition returns true or the lock object.
        // We will test the expected behavior based on the class structure.

        // Assuming the method signature is:
        // acquireLock(resourceId: ResourceId, contextId: ContextId, durationMs: number): boolean
        // For testing purposes, we'll assume a successful acquisition sets the lock.
        const acquired = (manager as any).acquireLock(resourceId, contextId, lockDuration)
        expect(acquired).toBe(true)
    })

    it("should throw ResourceConflictError if another context holds the lock", () => {
        const manager = new ResourceAcquisitionManager()
        const resourceId = "lockedResource"
        const contextIdA = "contextA"
        const contextIdB = "contextB"
        const lockDuration = 1000

        // 1. Acquire lock with Context A (simulating successful first acquisition)
        (manager as any).acquireLock(resourceId, contextIdA, lockDuration)

        // 2. Attempt to acquire lock with Context B
        expect(() => {
            (manager as any).acquireLock(resourceId, contextIdB, lockDuration)
        }).toThrow(ResourceConflictError)
        expect(() => {
            (manager as any).acquireLock(resourceId, contextIdB, lockDuration)
        }).toThrow("ResourceConflictError")
    })

    it("should allow re-acquisition if the original lock has expired (or if the manager handles expiration)", () => {
        const manager = new ResourceAcquisitionManager()
        const resourceId = "expiringResource"
        const contextId = "contextA"
        const lockDuration = 100 // Short duration for testing expiration

        // 1. Acquire lock
        (manager as any).acquireLock(resourceId, contextId, lockDuration)

        // 2. Simulate time passing (making the lock expire)
        // Since we cannot directly control time in a simple test, we rely on the manager's
        // internal cleanup or assume a method exists to force expiration/re-acquisition.
        // For this test, we assume the manager has a way to handle expired locks,
        // allowing a new acquisition attempt.

        // If the manager has a cleanup/expire method, we would call it here.
        // If not, we assume the second acquisition attempt after a delay succeeds.
        // We mock the internal state to simulate expiration for a robust test.
        (manager as any)._forceExpireLock(resourceId)

        // 3. Attempt to acquire lock again (should succeed)
        const acquired = (manager as any).acquireLock(resourceId, contextId, lockDuration)
        expect(acquired).toBe(true)
    })
})