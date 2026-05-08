export type Reservation = {
  reservationId: string;
  serviceId: string;
  requiredAmount: number;
  expirationTimestamp: number;
};

export class ExternalCapacityReservationManager {
  private reservations: Map<string, Reservation>;
  private capacityLimits: Map<string, number>;

  constructor() {
    this.reservations = new Map<string, Reservation>();
    this.capacityLimits = new Map<string, number>();
  }

  setCapacityLimit(serviceId: string, limit: number): void {
    this.capacityLimits.set(serviceId, limit);
  }

  /**
   * Attempts to reserve capacity for a given service.
   * @param serviceId The ID of the external service.
   * @param requiredAmount The amount of capacity needed.
   * @param durationSeconds How long the reservation should last.
   * @returns The reservation object if successful, otherwise null.
   */
  reserveCapacity(serviceId: string, requiredAmount: number, durationSeconds: number): Reservation | null {
    const currentLimit = this.capacityLimits.get(serviceId);

    if (currentLimit === undefined) {
      console.error(`Capacity limit not set for service: ${serviceId}`);
      return null;
    }

    const totalReserved = Array.from(this.reservations.values())
      .filter(r => r.serviceId === serviceId && r.expirationTimestamp > Date.now())
      .reduce((sum, r) => sum + r.requiredAmount, 0);

    if (totalReserved + requiredAmount > currentLimit) {
      return null;
    }

    const reservationId = crypto.randomUUID();
    const expirationTimestamp = Date.now() + durationSeconds * 1000;

    const newReservation: Reservation = {
      reservationId,
      serviceId,
      requiredAmount,
      expirationTimestamp,
    };

    this.reservations.set(reservationId, newReservation);
    return newReservation;
  }

  /**
   * Releases a previously made reservation.
   * @param reservationId The ID of the reservation to release.
   * @returns boolean True if the reservation was found and released, false otherwise.
   */
  releaseCapacity(reservationId: string): boolean {
    if (this.reservations.has(reservationId)) {
      this.reservations.delete(reservationId);
      return true;
    }
    return false;
  }

  /**
   * Cleans up expired reservations.
   * This should be called periodically or before critical operations.
   */
  cleanupExpiredReservations(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, reservation] of this.reservations.entries()) {
      if (reservation.expirationTimestamp < now) {
        this.reservations.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Checks if a reservation is currently active and valid.
   */
  isReservationActive(reservationId: string): boolean {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return false;
    }
    return reservation.expirationTimestamp > Date.now();
  }
}

export { ExternalCapacityReservationManager };