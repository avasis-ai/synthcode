export type BudgetResourceType = "tokens" | "time" | "cost" | "complexity";

export interface BudgetConstraint {
  resourceType: BudgetResourceType;
  limit: number;
}

export interface BudgetState {
  [key: string]: number;
}

export class BudgetExceededError extends Error {
  constructor(message: string, public readonly violatedConstraints: { resourceType: BudgetResourceType; current: number; limit: number }[]) {
    super(message);
    super.setPrototypeOf(this, BudgetExceededError.prototype);
    Object.assign(this, BudgetExceededError.prototype);
  }
}

export class MultiResourceBudgetEnforcer {
  private readonly initialConstraints: BudgetConstraint[];
  private currentState: BudgetState;

  constructor(constraints: BudgetConstraint[]) {
    this.initialConstraints = constraints;
    this.currentState = this.initializeState(constraints);
  }

  private initializeState(constraints: BudgetConstraint[]): BudgetState {
    const state: Partial<Record<BudgetResourceType, number>> = {};
    for (const constraint of constraints) {
      state[constraint.resourceType] = constraint.limit;
    }
    return state as BudgetState;
  }

  /**
   * Checks if the proposed consumption violates any active budget constraint.
   * @param consumption A map of resource types and the amount consumed.
   * @returns True if the budget is sufficient, false otherwise.
   * @throws BudgetExceededError if any constraint is violated.
   */
  public checkBudget(consumption: Record<BudgetResourceType, number>): boolean {
    const violated: { resourceType: BudgetResourceType; current: number; limit: number }[] = [];

    for (const [resourceType, amount] of Object.entries(consumption)) {
      const type = resourceType as BudgetResourceType;
      const consumptionAmount = amount as number;

      const currentLimit = this.currentState[type] ?? 0;
      const remaining = currentLimit - consumptionAmount;

      if (remaining < 0) {
        violated.push({
          resourceType: type,
          current: currentLimit,
          limit: currentLimit, // Using current limit as the reference point for failure
        });
      }
    }

    if (violated.length > 0) {
      throw new BudgetExceededError(
        `Budget exceeded. Cannot consume resources.`,
        violated
      );
    }
    return true;
  }

  /**
   * Consumes the specified resources and updates the internal state.
   * Must be called only after successfully passing checkBudget.
   * @param consumption A map of resource types and the amount consumed.
   */
  public consumeBudget(consumption: Record<BudgetResourceType, number>): void {
    for (const [resourceType, amount] of Object.entries(consumption)) {
      const type = resourceType as BudgetResourceType;
      const consumptionAmount = amount as number;

      if (this.currentState[type] === undefined) {
        throw new Error(`Unknown resource type provided: ${type}`);
      }

      const current = this.currentState[type]!;
      if (current < consumptionAmount) {
        throw new Error(`Internal state error: Attempted to consume ${consumptionAmount} of ${type}, but only ${current} remains.`);
      }

      this.currentState[type] = current - consumptionAmount;
    }
  }

  /**
   * Retrieves a deep copy of the current budget state.
   */
  public getCurrentState(): BudgetState {
    return { ...this.currentState } as BudgetState;
  }
}

export { MultiResourceBudgetEnforcer, BudgetExceededError };