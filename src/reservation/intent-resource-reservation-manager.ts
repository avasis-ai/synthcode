export type ResourceKey = string;

export interface ResourceRequirement {
  key: ResourceKey;
  amount: number;
  unit: string;
}

export interface IntentReservationContext {
  intent: string;
  requiredResources: ResourceRequirement[];
}

export interface Reservation {
  reservationId: string;
  context: IntentReservationContext;
  reservedResources: Record<ResourceKey, number>;
  estimatedCost: number;
  isFeasible: boolean;
}

export class IntentResourceReservationManager {
  private reservations: Map<string, Reservation>;

  constructor() {
    this.reservations = new Map<string, Reservation>();
  }

  private generateReservationId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  public reserve(context: IntentReservationContext): Reservation {
    const reservationId = this.generateReservationId();
    let totalCost = 0;
    const reservedResources: Record<ResourceKey, number> = {};
    let isFeasible = true;

    for (const requirement of context.requiredResources) {
      const key = requirement.key;
      const amount = requirement.amount;

      // Simulate conflict checking and cost calculation
      if (key === "api_quota" && amount > 100) {
        console.warn(`Conflict detected for ${key}: Exceeds hard limit.`);
        isFeasible = false;
      }

      reservedResources[key] = amount;
      
      // Simple cost model: cost increases with amount
      totalCost += amount * 0.1;
    }

    const newReservation: Reservation = {
      reservationId,
      context,
      reservedResources,
      estimatedCost: parseFloat(totalCost.toFixed(2)),
      isFeasible,
    };

    this.reservations.set(reservationId, newReservation);
    return newReservation;
  }

  public release(reservationId: string): boolean {
    if (this.reservations.has(reservationId)) {
      this.reservations.delete(reservationId);
      return true;
    }
    return false;
  }

  public getReservationStatus(reservationId: string): Reservation | undefined {
    return this.reservations.get(reservationId);
  }
}

export { IntentResourceReservationManager };