import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export enum DecayCurve {
  Exponential,
  Linear,
}

export interface ContextualMemoryEntry {
  content: ContentBlock[];
  timestamp: number;
  initialWeight: number;
  currentWeight: number;
}

export class ContextualMemoryDecayScheduler {
  private memoryStore: Map<string, ContextualMemoryEntry>;
  private decayCurve: DecayCurve;

  constructor(memoryStore: Map<string, ContextualMemoryEntry>, decayCurve: DecayCurve) {
    this.memoryStore = memoryStore;
    this.decayCurve = decayCurve;
  }

  private calculateDecayFactor(timeElapsedSeconds: number, curve: DecayCurve): number {
    switch (curve) {
      case DecayCurve.Exponential:
        // Decay factor: e^(-lambda * t). Using a fixed lambda for simplicity.
        const lambda = 0.05;
        return Math.exp(-lambda * timeElapsedSeconds);
      case DecayCurve.Linear:
        // Decay factor: 1 - (rate * t). Rate must be < 1/t_max.
        const rate = 0.01;
        return Math.max(0, 1 - rate * timeElapsedSeconds);
      default:
        return 1.0;
    }
  }

  public scheduleDecay(entry: ContextualMemoryEntry, curve: DecayCurve): void {
    const timeElapsedSeconds = Math.floor((Date.now() - entry.timestamp) / 1000);
    let decayFactor: number;

    if (curve !== this.decayCurve) {
      // In a real system, we might handle this mismatch, but for this scope,
      // we assume the scheduler's configured curve is used or the passed curve is used.
      // We will use the passed curve for the calculation as per method signature.
      decayFactor = this.calculateDecayFactor(timeElapsedSeconds, curve);
    } else {
      decayFactor = this.calculateDecayFactor(timeElapsedSeconds, curve);
    }

    const newWeight = entry.initialWeight * decayFactor;
    entry.currentWeight = Math.max(0, newWeight);
  }

  public pruneStaleEntries(threshold: number): number {
    let prunedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryStore.entries()) {
      // Re-calculate decay using the scheduler's configured curve for pruning check
      this.scheduleDecay(entry, this.decayCurve);

      if (entry.currentWeight < threshold) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.memoryStore.delete(key);
      prunedCount++;
    });

    return prunedCount;
  }
}