export type ResourceId = string;
export type ReservationId = string;
export type Priority = number;

export interface TimeWindow {
  start: Date;
  end: Date;
}

export interface Reservation {
  id: ReservationId;
  resourceId: ResourceId;
  window: TimeWindow;
  priority: Priority;
  createdAt: Date;
}

export class TemporalResourceReservationManager {
  private reservations: Map<ReservationId, Reservation> = new Map();

  constructor() {}

  private isOverlapping(windowA: TimeWindow, windowB: TimeWindow): boolean {
    const startA = windowA.start.getTime();
    const endA = windowA.end.getTime();
    const startB = windowB.start.getTime();
    const endB = windowB.end.getTime();

    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  private findConflicts(resourceId: ResourceId, newWindow: TimeWindow): Reservation[] {
    const conflicts: Reservation[] = [];
    for (const reservation of this.reservations.values()) {
      if (reservation.resourceId === resourceId && this.isOverlapping(reservation.window, newWindow)) {
        conflicts.push(reservation);
      }
    }
    return conflicts;
  }

  public checkConflict(resourceId: ResourceId, start: Date, end: Date): { conflict: boolean; conflictingReservations: Reservation[] } {
    const newWindow: TimeWindow = { start: start, end: end };
    const conflicts = this.findConflicts(resourceId, newWindow);
    return { conflict: conflicts.length > 0, conflictingReservations: conflicts };
  }

  public reserve(
    resourceId: ResourceId,
    start: Date,
    end: Date,
    priority: Priority
  ): { success: boolean; reservationId: ReservationId; message: string } {
    const newWindow: TimeWindow = { start: start, end: end };
    const conflicts = this.findConflicts(resourceId, newWindow);

    if (conflicts.length === 0) {
      const newReservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newReservation: Reservation = {
        id: newReservationId,
        resourceId: resourceId,
        window: newWindow,
        priority: priority,
        createdAt: new Date(),
      };
      this.reservations.set(newReservationId, newReservation);
      return { success: true, reservationId: newReservationId, message: "Reservation successful." };
    }

    // Conflict Resolution Logic: Check if the new reservation wins against all conflicts
    const winningConflict = conflicts.reduce((best: Reservation, current: Reservation) => {
      // Rule 1: Higher priority wins
      if (current.priority > best.priority) {
        return current;
      }
      // Rule 2: If priorities are equal, the earliest created reservation wins (or the existing one)
      if (current.priority === best.priority && current.createdAt < best.createdAt) {
        return current;
      }
      return best;
    }, conflicts[0] || null);

    if (winningConflict) {
      // If the new reservation has higher priority than the strongest existing conflict, it wins.
      if (priority > winningConflict.priority) {
        const newReservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newReservation: Reservation = {
          id: newReservationId,
          resourceId: resourceId,
          window: newWindow,
          priority: priority,
          createdAt: new Date(),
        };
        this.reservations.set(newReservationId, newReservation);
        return { success: true, reservationId: newReservationId, message: "Reservation successful (overriding lower priority conflict)." };
      }
    }

    return { success: false, reservationId: "", message: `Conflict detected. Cannot reserve resource ${resourceId}. Highest priority conflict found.` };
  }

  public cancelReservation(reservationId: ReservationId): { success: boolean; message: string } {
    if (this.reservations.has(reservationId)) {
      this.reservations.delete(reservationId);
      return { success: true, message: `Reservation ${reservationId} cancelled successfully.` };
    }
    return { success: false, message: `Reservation ${reservationId} not found.` };
  }

  public getReservations(resourceId: ResourceId): Reservation[] {
    const results: Reservation[] = [];
    for (const reservation of this.reservations.values()) {
      if (reservation.resourceId === resourceId) {
        results.push(reservation);
      }
    }
    return results;
  }
}

export { TemporalResourceReservationManager };