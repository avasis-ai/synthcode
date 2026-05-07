import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ReservationId = string;

interface Reservation {
  id: ReservationId;
  capability: string;
  expirationTime: Date;
  context: Record<string, unknown>;
}

export class CapabilityReservationManager {
  private reservations: Map<ReservationId, Reservation>;

  constructor() {
    this.reservations = new Map<ReservationId, Reservation>();
  }

  reserve(capability: string, requiredDurationMs: number, context: Record<string, unknown>): ReservationId {
    const reservationId: ReservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expirationTime = new Date(Date.now() + requiredDurationMs);

    const reservation: Reservation = {
      id: reservationId,
      capability: capability,
      expirationTime: expirationTime,
      context: context,
    };

    this.reservations.set(reservationId, reservation);
    return reservationId;
  }

  release(reservationId: ReservationId): boolean {
    if (this.reservations.has(reservationId)) {
      this.reservations.delete(reservationId);
      return true;
    }
    return false;
  }

  isReservationValid(reservationId: ReservationId): boolean {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return false;
    }
    return reservation.expirationTime > new Date();
  }

  getReservationDetails(reservationId: ReservationId): Reservation | undefined {
    return this.reservations.get(reservationId);
  }

  listActiveReservations(): Reservation[] {
    const activeReservations: Reservation[] = [];
    for (const reservation of this.reservations.values()) {
      if (reservation.expirationTime > new Date()) {
        activeReservations.push(reservation);
      }
    }
    return activeReservations;
  }
}