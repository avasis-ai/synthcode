export type QuotaKey = "LLM_TOKENS" | "API_CALLS" | "COMPUTE_TIME_SECONDS";

export interface QuotaDefinition {
  key: QuotaKey;
  limit: number;
  unit: string;
}

export interface QuotaStore {
  [key: QuotaKey]: {
    currentUsed: number;
    limit: number;
    unit: string;
  };
}

export class GlobalQuotaManager {
  private store: Map<QuotaKey, { currentUsed: number; limit: number; unit: string }>;

  constructor(initialDefinitions: QuotaDefinition[]) {
    this.store = new Map();
    for (const definition of initialDefinitions) {
      this.store.set(definition.key, {
        currentUsed: 0,
        limit: definition.limit,
        unit: definition.unit,
      });
    }
  }

  private async persistState(): Promise<void> {
    // Simulate asynchronous database write operation
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  public async checkQuota(key: QuotaKey, amount: number): Promise<boolean> {
    const quota = this.store.get(key);
    if (!quota) {
      console.warn(`Quota key ${key} not defined.`);
      return false;
    }

    const remaining = quota.limit - quota.currentUsed;
    return remaining >= amount;
  }

  public async reserveQuota(key: QuotaKey, amount: number): Promise<boolean> {
    if (amount <= 0) {
      return true;
    }

    const canAfford = await this.checkQuota(key, amount);

    if (canAfford) {
      const quota = this.store.get(key)!;
      quota.currentUsed += amount;
      await this.persistState();
      return true;
    }

    return false;
  }

  public async releaseQuota(key: QuotaKey, amount: number): Promise<boolean> {
    if (amount <= 0) {
      return true;
    }

    const quota = this.store.get(key);
    if (!quota) {
      return false;
    }

    const newUsed = Math.max(0, quota.currentUsed - amount);
    quota.currentUsed = newUsed;
    await this.persistState();
    return true;
  }

  public getStatus(): Record<QuotaKey, { used: number; limit: number; unit: string }> {
    const status: Record<QuotaKey, { used: number; limit: number; unit: string }> = {};
    for (const [key, quota] of this.store.entries()) {
      status[key] = {
        used: quota.currentUsed,
        limit: quota.limit,
        unit: quota.unit,
      };
    }
    return status;
  }
}

export { GlobalQuotaManager };