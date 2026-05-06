export type QuotaType = "daily" | "hourly" | "total";

export interface QuotaDefinition {
  limit: number;
  timeWindowMs: number;
}

export interface QuotaUsage {
  currentUsage: number;
  lastResetTimestamp: number;
}

export interface QuotaStore {
  [quotaType: string]: QuotaUsage;
}

export class QuotaManager {
  private store: QuotaStore;
  private definitions: Record<QuotaType, QuotaDefinition>;

  constructor(definitions: Record<QuotaType, QuotaDefinition>) {
    this.definitions = definitions;
    this.store = {} as QuotaStore;
  }

  private initializeQuota(quotaType: QuotaType): void {
    if (!this.store[quotaType]) {
      this.store[quotaType] = {
        currentUsage: 0,
        lastResetTimestamp: Date.now(),
      };
    }
  }

  private getQuota(quotaType: QuotaType): QuotaUsage {
    this.initializeQuota(quotaType);
    return this.store[quotaType];
  }

  private resetQuotaIfExpired(quotaType: QuotaType): void {
    const definition = this.definitions[quotaType];
    if (!definition) {
      return;
    }

    const usage = this.getQuota(quotaType);
    const timeElapsed = Date.now() - usage.lastResetTimestamp;

    if (timeElapsed >= definition.timeWindowMs) {
      this.store[quotaType] = {
        currentUsage: 0,
        lastResetTimestamp: Date.now(),
      };
    }
  }

  public checkQuota(quotaType: QuotaType, amount: number): { allowed: boolean; remaining: number; message: string } {
    if (amount <= 0) {
      return { allowed: true, remaining: Infinity, message: "No usage amount provided." };
    }

    this.resetQuotaIfExpired(quotaType);

    const definition = this.definitions[quotaType];
    const usage = this.getQuota(quotaType);

    if (!definition) {
      return { allowed: false, remaining: 0, message: `Unknown quota type: ${quotaType}` };
    }

    const remaining = definition.limit - usage.currentUsage;

    if (remaining >= amount) {
      return { allowed: true, remaining: remaining - amount, message: "Quota available." };
    } else {
      return { allowed: false, remaining: remaining, message: `Quota exhausted. Limit: ${definition.limit}` };
    }
  }

  public consumeQuota(quotaType: QuotaType, amount: number): { success: boolean; remaining: number; message: string } {
    if (amount <= 0) {
      return { success: true, remaining: Infinity, message: "No usage amount provided." };
    }

    this.resetQuotaIfExpired(quotaType);

    const definition = this.definitions[quotaType];
    const usage = this.getQuota(quotaType);

    if (!definition) {
      return { success: false, remaining: 0, message: `Unknown quota type: ${quotaType}` };
    }

    const remaining = definition.limit - usage.currentUsage;

    if (remaining >= amount) {
      this.store[quotaType] = {
        currentUsage: usage.currentUsage + amount,
        lastResetTimestamp: Date.now(),
      };
      return { success: true, remaining: remaining - amount, message: "Quota consumed successfully." };
    } else {
      return { success: false, remaining: remaining, message: `Quota exceeded. Limit: ${definition.limit}` };
    }
  }
}

export { QuotaManager };