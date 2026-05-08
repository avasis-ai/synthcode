export interface UsageRecord {
  timestamp: number;
  amount: number;
}

export class ResourceDepletionManager {
  private initialCapacity: number;
  private usageHistory: UsageRecord[] = [];
  private projectedUsage: number = 0;
  private readonly CRITICAL_THRESHOLD: number;

  constructor(initialCapacity: number, criticalThresholdPercentage: number = 0.1) {
    this.initialCapacity = initialCapacity;
    this.CRITICAL_THRESHOLD = initialCapacity * criticalThresholdPercentage;
  }

  logUsage(amount: number): void {
    const record: UsageRecord = {
      timestamp: Date.now(),
      amount: amount,
    };
    this.usageHistory.push(record);
  }

  logProjectedUsage(amount: number): void {
    this.projectedUsage += amount;
  }

  getCurrentCapacity(): number {
    const totalConsumed = this.usageHistory.reduce((sum, record) => sum + record.amount, 0);
    const currentCapacity = this.initialCapacity - totalConsumed - this.projectedUsage;
    return Math.max(0, currentCapacity);
  }

  getAverageConsumptionRate(): { rate: number; unit: string } {
    if (this.usageHistory.length < 2) {
      return { rate: 0, unit: "units/time" };
    }

    const firstRecord = this.usageHistory[0];
    const lastRecord = this.usageHistory[this.usageHistory.length - 1];

    const totalConsumed = this.usageHistory.reduce((sum, record) => sum + record.amount, 0);
    const timeElapsedMs = lastRecord.timestamp - firstRecord.timestamp;

    if (timeElapsedMs === 0) {
      return { rate: 0, unit: "units/time" };
    }

    // Rate in units per millisecond
    const ratePerMs = totalConsumed / timeElapsedMs;

    // Convert to units per hour for readability (optional, but good practice)
    const ratePerHour = ratePerMs * 1000 * 60;

    return { rate: ratePerHour, unit: "units/hour" };
  }

  predictRemainingTime(): {
    timeRemaining: number;
    unit: string;
    isCritical: boolean;
  } {
    const currentCapacity = this.getCurrentCapacity();
    const rateInfo = this.getAverageConsumptionRate();

    if (rateInfo.rate <= 0) {
      return { timeRemaining: Infinity, unit: "hours", isCritical: false };
    }

    const remainingUsableCapacity = currentCapacity - this.CRITICAL_THRESHOLD;

    if (remainingUsableCapacity <= 0) {
      return { timeRemaining: 0, unit: "hours", isCritical: true };
    }

    // Time remaining = Remaining Capacity / Consumption Rate
    const timeRemainingHours = remainingUsableCapacity / rateInfo.rate;

    return {
      timeRemaining: timeRemainingHours,
      unit: "hours",
      isCritical: timeRemainingHours < 1,
    };
  }
}