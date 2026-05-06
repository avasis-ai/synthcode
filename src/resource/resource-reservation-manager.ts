export interface Reservation {
    resourceId: string;
    owner: string;
    startTime: Date;
    endTime: Date;
}

export class ResourceReservationManager {
    private reservations: Reservation[] = [];

    constructor() {}

    private isOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
        return start1 < end2 && end1 > start2;
    }

    public bookResource(resourceId: string, owner: string, startTime: Date, endTime: Date): { success: boolean; message: string } {
        if (startTime >= endTime) {
            return { success: false, message: "Start time must be before end time." };
        }

        const conflict = this.reservations.some(reservation =>
            reservation.resourceId === resourceId &&
            this.isOverlap(startTime, endTime, reservation.startTime, reservation.endTime)
        );

        if (conflict) {
            return { success: false, message: `Resource ${resourceId} is already booked during this time.` };
        }

        const newReservation: Reservation = {
            resourceId,
            owner,
            startTime,
            endTime
        };

        this.reservations.push(newReservation);
        return { success: true, message: `Resource ${resourceId} successfully reserved by ${owner}.` };
    }

    public releaseResource(resourceId: string, owner: string, startTime: Date, endTime: Date): { success: boolean; message: string } {
        const reservationIndex = this.reservations.findIndex(r =>
            r.resourceId === resourceId &&
            r.owner === owner &&
            this.isOverlap(startTime, endTime, r.startTime, r.endTime)
        );

        if (reservationIndex === -1) {
            return { success: false, message: "No active reservation found matching the provided criteria." };
        }

        this.reservations.splice(reservationIndex, 1);
        return { success: true, message: `Resource ${resourceId} reservation released successfully.` };
    }

    public queryAvailability(resourceId: string, startTime: Date, endTime: Date): { available: boolean; conflicts: Reservation[] } {
        if (startTime >= endTime) {
            return { available: false, conflicts: [] };
        }

        const conflicts = this.reservations.filter(reservation =>
            reservation.resourceId === resourceId &&
            this.isOverlap(startTime, endTime, reservation.startTime, reservation.endTime)
        );

        return {
            available: conflicts.length === 0,
            conflicts: conflicts
        };
    }

    public getReservations(resourceId: string): Reservation[] {
        return this.reservations.filter(r => r.resourceId === resourceId);
    }
}

export { ResourceReservationManager };