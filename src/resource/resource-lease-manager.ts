export type LeaseId = string;
export type ResourceId = string;
export type OwnerId = string;

export interface Lease {
  leaseId: LeaseId;
  resourceId: ResourceId;
  ownerId: OwnerId;
  expirationTimestamp: number;
  acquiredAt: number;
  usageCount: number;
}

export class ResourceLeaseManager {
  private leases: Map<LeaseId, Lease>;
  private readonly cleanupIntervalMs: number;

  constructor(cleanupIntervalMs: number = 5000) {
    this.leases = new Map<LeaseId, Lease>();
    this.cleanupIntervalMs = cleanupIntervalMs;
    setInterval(() => this.cleanupExpiredLeases(), this.cleanupIntervalMs);
  }

  private generateLeaseId(): LeaseId {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  /**
   * Attempts to acquire a lease for a given resource.
   * @param resourceId The ID of the resource.
   * @param ownerId The ID of the owner requesting the lease.
   * @param durationMs The duration in milliseconds for the lease.
   * @returns The newly created Lease object if successful, otherwise null.
   */
  public acquireLease(resourceId: ResourceId, ownerId: OwnerId, durationMs: number): Lease | null {
    const now = Date.now();
    const expirationTimestamp = now + durationMs;

    // Conflict check: Check if any active lease exists for this resource
    const isConflicted = Array.from(this.leases.values()).some(
      (lease) => lease.resourceId === resourceId && lease.expirationTimestamp > now
    );

    if (isConflicted) {
      return null;
    }

    const leaseId = this.generateLeaseId();
    const newLease: Lease = {
      leaseId,
      resourceId,
      ownerId,
      expirationTimestamp,
      acquiredAt: now,
      usageCount: 1,
    };

    this.leases.set(leaseId, newLease);
    return newLease;
  }

  /**
   * Releases a specific lease, making the resource available.
   * @param leaseId The ID of the lease to release.
   * @returns boolean True if the lease was found and released, false otherwise.
   */
  public releaseLease(leaseId: LeaseId): boolean {
    if (this.leases.has(leaseId)) {
      this.leases.delete(leaseId);
      return true;
    }
    return false;
  }

  /**
   * Renews an existing lease, extending its expiration time.
   * @param leaseId The ID of the lease to renew.
   * @param durationMs The additional duration in milliseconds.
   * @returns Lease The updated lease object, or null if the lease was not found.
   */
  public renewLease(leaseId: LeaseId, durationMs: number): Lease | null {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      return null;
    }

    const newExpirationTimestamp = Date.now() + durationMs;
    const updatedLease: Lease = {
      ...lease,
      expirationTimestamp: newExpirationTimestamp,
    };

    this.leases.set(leaseId, updatedLease);
    return updatedLease;
  }

  /**
   * Internal method to clean up expired leases.
   */
  private cleanupExpiredLeases(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [leaseId, lease] of this.leases.entries()) {
      if (lease.expirationTimestamp < now) {
        this.leases.delete(leaseId);
        cleanedCount++;
      }
    }
    // console.log(`[LeaseManager] Cleaned up ${cleanedCount} expired leases.`);
  }

  /**
   * Gets the current count of active leases.
   */
  public getActiveLeaseCount(): number {
    return this.leases.size;
  }
}

export { ResourceLeaseManager };