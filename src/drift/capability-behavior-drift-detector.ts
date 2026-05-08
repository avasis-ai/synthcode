import { Message, ToolResultMessage } from "./types.js";

interface FieldStats {
    count: number;
    sum: number;
    sumOfSquares: number;
    mean: number;
    stdDev: number;
}

interface BehavioralProfile {
    fieldStats: Record<string, FieldStats>;
    // Could include combination stats here, but keeping it simple for line count/complexity
}

interface BehavioralDriftReport {
    driftScore: number;
    isDrifting: boolean;
    details: Record<string, string>;
}

class BehavioralProfileStore {
    private profiles: Map<string, BehavioralProfile> = new Map();

    getProfile(capabilityId: string): BehavioralProfile | undefined {
        return this.profiles.get(capabilityId);
    }

    /**
     * Updates the profile with a new payload, aggregating statistics.
     * @param capabilityId The ID of the capability.
     * @param payload The new tool output payload.
     */
    updateProfile(capabilityId: string, payload: Record<string, unknown>): void {
        if (!this.profiles.has(capabilityId)) {
            this.profiles.set(capabilityId, { fieldStats: {} });
        }

        const profile = this.profiles.get(capabilityId)!;

        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                const value = payload[key];

                if (typeof value === 'number' && !isNaN(value)) {
                    const stats = profile.fieldStats[key] || { count: 0, sum: 0, sumOfSquares: 0, mean: 0, stdDev: 0 };

                    stats.count += 1;
                    stats.sum += value;
                    stats.sumOfSquares += value * value;

                    profile.fieldStats[key] = stats;
                }
            }
        }
    }

    /**
     * Calculates the standard deviation for a field based on accumulated stats.
     */
    private calculateStdDev(stats: FieldStats): number {
        if (stats.count < 2) return 0;
        const variance = (stats.sumOfSquares / stats.count) - (stats.sum / stats.count) ** 2;
        return Math.sqrt(Math.max(0, variance));
    }

    /**
     * Generates a deep copy of the current profile for inspection.
     */
    getSnapshot(capabilityId: string): BehavioralProfile | undefined {
        return this.profiles.get(capabilityId);
    }
}

export class CapabilityBehaviorDriftDetector {
    private profileStore: BehavioralProfileStore;
    private readonly driftThreshold: number;

    constructor(profileStore: BehavioralProfileStore, driftThreshold: number = 0.5) {
        this.profileStore = profileStore;
        this.driftThreshold = driftThreshold;
    }

    /**
     * Calculates the drift score by comparing the new payload's statistics against the stored profile.
     * @param capabilityId The ID of the capability.
     * @param payload The new tool output payload.
     * @returns The calculated drift score.
     */
    private calculateDriftScore(capabilityId: string, payload: Record<string, unknown>): number {
        const profile = this.profileStore.getProfile(capabilityId);
        if (!profile) {
            return 0;
        }

        let totalDriftScore = 0;
        let fieldCount = 0;

        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                const newValue = payload[key];

                if (typeof newValue === 'number' && !isNaN(newValue)) {
                    fieldCount++;
                    const storedStats = profile.fieldStats[key];

                    if (storedStats && storedStats.count > 1) {
                        // 1. Calculate current stats for the new payload (assuming single sample for simplicity)
                        const currentMean = newValue;
                        const currentStdDev = 0;

                        // 2. Calculate Z-score based on historical mean and std dev
                        const zScore = Math.abs(currentMean - storedStats.mean) / storedStats.stdDev;
                        
                        // Use Z-score as a component of the drift score
                        totalDriftScore += zScore;
                    }
                }
            }
        }

        // Normalize the score by the number of fields analyzed
        return fieldCount > 0 ? totalDriftScore / fieldCount : 0;
    }

    /**
     * Detects if the provided payload exhibits significant behavioral drift compared to the stored profile.
     * @param capabilityId The ID of the capability.
     * @param payload The new tool output payload.
     * @returns A BehavioralDriftReport indicating potential degradation.
     */
    detect(capabilityId: string, payload: Record<string, unknown>): BehavioralDriftReport {
        const driftScore = this.calculateDriftScore(capabilityId, payload);

        const isDrifting = driftScore > this.driftThreshold;

        return {
            driftScore: parseFloat(driftScore.toFixed(4)),
            isDrifting: isDrifting,
            details: {
                threshold: this.driftThreshold.toString(),
                message: isDrifting ? "Potential behavioral drift detected." : "Behavior within expected norms.",
            }
        };
    }

    /**
     * Records the current payload as a new behavioral norm, updating the profile.
     * @param capabilityId The ID of the capability.
     * @param payload The tool output payload to profile.
     */
    recordBehavior(capabilityId: string, payload: Record<string, unknown>): void {
        this.profileStore.updateProfile(capabilityId, payload);
    }
}