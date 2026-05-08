import { performance } from "node:perf_hooks";

interface TrustEntry {
    initialScore: number;
    currentScore: number;
    lastUpdated: number;
    decayRate: number;
    halfLifeSeconds: number;
}

class TrustDecayManager {
    private trustMap: Map<string, TrustEntry>;

    constructor() {
        this.trustMap = new Map<string, TrustEntry>();
    }

    private calculateDecay(entry: TrustEntry, timeDeltaSeconds: number): number {
        if (entry.halfLifeSeconds <= 0) {
            return entry.currentScore;
        }

        // Exponential decay formula: Score_new = Score_old * 2^(-t / T_half)
        const decayFactor = Math.pow(2, -timeDeltaSeconds / entry.halfLifeSeconds);
        return entry.currentScore * decayFactor;
    }

    public initializeEntry(sourceId: string, initialScore: number, decayRate: number, halfLifeSeconds: number): void {
        if (this.trustMap.has(sourceId)) {
            this.updateScore(sourceId, initialScore);
            return;
        }

        const entry: TrustEntry = {
            initialScore: initialScore,
            currentScore: initialScore,
            lastUpdated: performance.now() / 1000,
            decayRate: decayRate,
            halfLifeSeconds: halfLifeSeconds,
        };
        this.trustMap.set(sourceId, entry);
    }

    public updateScore(sourceId: string, newScore: number): void {
        const entry = this.trustMap.get(sourceId);
        if (!entry) {
            this.initializeEntry(sourceId, newScore, entry?.decayRate || 0.1, entry?.halfLifeSeconds || 3600);
            return;
        }

        // When manually updated, reset the decay timer and set the new score
        entry.currentScore = newScore;
        entry.lastUpdated = performance.now() / 1000;
        this.trustMap.set(sourceId, entry);
    }

    public getDecayedScore(sourceId: string): number {
        const entry = this.trustMap.get(sourceId);
        if (!entry) {
            return 0;
        }

        const currentTime = performance.now() / 1000;
        const timeDeltaSeconds = currentTime - entry.lastUpdated;

        const decayedScore = this.calculateDecay(entry, timeDeltaSeconds);

        // Update the entry with the decayed score and new timestamp
        entry.currentScore = decayedScore;
        entry.lastUpdated = currentTime;
        this.trustMap.set(sourceId, entry);

        return Math.max(0, decayedScore);
    }

    public getTrustEntry(sourceId: string): TrustEntry | undefined {
        return this.trustMap.get(sourceId);
    }
}

export { TrustDecayManager };