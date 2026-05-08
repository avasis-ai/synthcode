export class ResourceConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ResourceConflictError";
    }
}

type ResourceId = string;
type ContextId = string;

interface ResourceLock {
    ownerContextId: ContextId;
    acquiredAt: number;
    expiresAt: number;
}

export class ResourceAcquisitionManager {
    private locks: Map<ResourceId, ResourceLock> = new Map();

    /**
     * Attempts to acquire a lock for a given resource.
     * @param resourceId The unique identifier of the resource.
     * @param contextId The ID of the current execution context attempting acquisition.
     * @param timeoutMs The maximum time (in milliseconds) to wait for the resource.
     * @returns True if the lock was acquired, false otherwise (or throws if timeout occurs).
     * @throws {ResourceConflictError} If the lock cannot be acquired within the timeout period.
     */
    acquire(resourceId: ResourceId, contextId: ContextId, timeoutMs: number): boolean {
        const startTime = Date.now();
        const endTime = startTime + timeoutMs;

        while (Date.now() < endTime) {
            const lock = this.locks.get(resourceId);

            // 1. Check for expired locks
            if (lock && lock.expiresAt < Date.now()) {
                console.warn(`Resource ${resourceId} found with expired lock. Releasing.`);
                this.locks.delete(resourceId);
                // Retry immediately after cleaning up
                continue;
            }

            // 2. Check for conflicts
            if (lock && lock.ownerContextId !== contextId) {
                // Resource is held by another context and is not expired
                const remainingWait = endTime - Date.now();
                if (remainingWait > 0) {
                    // Wait a short period before retrying
                    const waitTime = Math.min(50, remainingWait);
                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitTime);
                    continue;
                } else {
                    throw new ResourceConflictError(`Resource ${resourceId} is currently locked by context ${lock.ownerContextId} and acquisition timed out.`);
                }
            }

            // 3. Acquire the lock (either free or owned by self)
            if (!lock || lock.ownerContextId === contextId) {
                const newLock: ResourceLock = {
                    ownerContextId: contextId,
                    acquiredAt: Date.now(),
                    expiresAt: Date.now() + 5000, // Example: Lock expires in 5 seconds if not explicitly released
                };
                this.locks.set(resourceId, newLock);
                return true;
            }
        }

        throw new ResourceConflictError(`Failed to acquire resource ${resourceId} within ${timeoutMs}ms.`);
    }

    /**
     * Releases a lock held by the specified context.
     * @param resourceId The unique identifier of the resource.
     * @param contextId The ID of the context attempting release.
     * @returns True if the lock was successfully released, false if the lock was not held by the context.
     */
    release(resourceId: ResourceId, contextId: ContextId): boolean {
        const lock = this.locks.get(resourceId);

        if (!lock) {
            return false; // No lock exists
        }

        if (lock.ownerContextId !== contextId) {
            console.warn(`Context ${contextId} attempted to release resource ${resourceId} held by ${lock.ownerContextId}. Operation ignored.`);
            return false; // Not the owner
        }

        this.locks.delete(resourceId);
        return true;
    }

    /**
     * Cleans up all expired locks. Should be called periodically or before critical operations.
     */
    cleanupExpiredLocks(): number {
        const now = Date.now();
        let count = 0;
        for (const [resourceId, lock] of this.locks.entries()) {
            if (lock.expiresAt < now) {
                this.locks.delete(resourceId);
                count++;
            }
        }
        return count;
    }
}

export { ResourceAcquisitionManager, ResourceConflictError };