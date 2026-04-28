import { SemanticContextStore } from "./semantic-context-store";

export interface DecayParameters {
  initialDecayRate: number;
  recencyWeight: number;
  interactionFrequencyWeight: number;
  threshold: number;
}

export interface SemanticContextEntry {
  id: string;
  content: any;
  lastAccessed: number;
  interactionCount: number;
}

export type ContextDecayEvent = {
  contextId: string;
  score: number;
  reason: "pruned" | "downweighted";
};

export class DecayScheduler {
  private store: SemanticContextStore;
  private params: DecayParameters;

  constructor(store: SemanticContextStore, params: DecayParameters) {
    this.store = store;
    this.params = params;
  }

  private calculateDecayScore(entry: SemanticContextEntry, currentTime: number): number {
    const { initialDecayRate, recencyWeight, interactionFrequencyWeight } = this.params;

    const timeSinceAccess = currentTime - entry.lastAccessed;
    const recencyDecay = Math.exp(-initialDecayRate * timeSinceAccess);

    const frequencyDecay = Math.pow(1.0 / Math.max(1, entry.interactionCount), 0.1);

    // Score calculation: Higher score means more relevant/important
    const score = (
      recencyDecay * recencyWeight +
      frequencyDecay * interactionFrequencyWeight
    );

    return score;
  }

  public async scheduleDecayCycle(): Promise<ContextDecayEvent[]> {
    const currentTime = Date.now();
    const entries = this.store.getAllEntries();
    const events: ContextDecayEvent[] = [];

    for (const entry of entries) {
      const score = this.calculateDecayScore(entry, currentTime);

      if (score < this.params.threshold) {
        // Simulate pruning logic
        this.store.prune(entry.id);
        events.push({
          contextId: entry.id,
          score: score,
          reason: "pruned",
        });
      } else {
        // Simulate down-weighting logic (e.g., updating metadata)
        // For this implementation, we just log the event type.
        // In a real system, this would update a weight field in the store.
        // events.push({ contextId: entry.id, score: score, reason: "downweighted" });
      }
    }

    return events;
  }
}