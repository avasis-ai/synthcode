import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

type SourceAuthority = number;

export interface Observation {
    timestamp: number;
    sourceAuthority: SourceAuthority;
    confidenceScore: number;
    data: Record<string, unknown>;
}

export interface ObservationContext {
    fusedTimestamp: number;
    fusedAuthority: SourceAuthority;
    fusedConfidence: number;
    fusedData: Record<string, unknown>;
    sourceCount: number;
}

class ObservationFusionEngine {

    constructor() {}

    /**
     * Calculates the weighted average for a numerical field across multiple observations.
     * Weighting is based on confidence score.
     * @param values An array of numerical values.
     * @param weights An array of corresponding weights (e.g., confidence scores).
     * @returns The weighted average, or null if no valid data exists.
     */
    private calculateWeightedAverage(values: number[], weights: number[]): number | null {
        if (values.length === 0 || weights.length === 0) {
            return null;
        }

        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < values.length; i++) {
            weightedSum += values[i] * weights[i];
            totalWeight += weights[i];
        }

        return totalWeight === 0 ? null : weightedSum / totalWeight;
    }

    /**
     * Resolves conflicting string data using the highest authority source.
     * @param observations Array of observations containing the field.
     * @returns The resolved string value.
     */
    private resolveStringConflict(observations: Observation[], fieldName: string): string | null {
        let bestValue: string | null = null;
        let highestAuthority: SourceAuthority = -1;

        for (const obs of observations) {
            const value = obs.data[fieldName];
            if (typeof value === 'string') {
                if (obs.sourceAuthority > highestAuthority) {
                    highestAuthority = obs.sourceAuthority;
                    bestValue = value;
                }
            }
        }
        return bestValue;
    }

    /**
     * Fuses an array of observations into a single, coherent context.
     * @param observations Array of input observations.
     * @returns The enriched ObservationContext.
     */
    public fuse(observations: Observation[]): ObservationContext {
        if (!observations || observations.length === 0) {
            throw new Error("Cannot fuse an empty array of observations.");
        }

        const sourceCount = observations.length;
        let fusedData: Record<string, unknown> = {};
        let totalConfidenceSum = 0;
        let totalAuthoritySum = 0;
        let fusedTimestamp = 0;

        // 1. Determine overall context metrics (Weighted averages/Max)
        let metricValues: Record<string, number[]> = {};
        let metricWeights: Record<string, number[]> = {};
        let stringFields: Set<string> = new Set();

        for (const obs of observations) {
            // Update overall metrics
            totalConfidenceSum += obs.confidenceScore;
            totalAuthoritySum += obs.sourceAuthority;

            // Simple temporal fusion: Use the latest timestamp
            if (obs.timestamp > fusedTimestamp) {
                fusedTimestamp = obs.timestamp;
            }

            // Analyze data fields
            for (const key in obs.data) {
                const value = obs.data[key];

                if (typeof value === 'number') {
                    if (!metricValues[key]) {
                        metricValues[key] = [];
                        metricWeights[key] = [];
                    }
                    metricValues[key].push(value);
                    metricWeights[key].push(obs.confidenceScore);
                } else if (typeof value === 'string') {
                    stringFields.add(key);
                } else {
                    // Handle other complex types if necessary, for now, treat them as unique keys
                    if (!fusedData[key]) {
                        fusedData[key] = value;
                    }
                }
            }
        }

        // 2. Apply fusion strategies for specific field types
        for (const key of stringFields) {
            fusedData[key] = this.resolveStringConflict(observations, key);
        }

        // 3. Calculate weighted averages for numerical fields
        for (const key in metricValues) {
            const values = metricValues[key];
            const weights = metricWeights[key];
            const average = this.calculateWeightedAverage(values, weights);
            if (average !== null) {
                fusedData[key] = average;
            }
        }

        // 4. Final Context Assembly
        return {
            fusedTimestamp: fusedTimestamp,
            fusedAuthority: Math.max(...observations.map(o => o.sourceAuthority)),
            fusedConfidence: totalConfidenceSum / sourceCount,
            fusedData: fusedData,
            sourceCount: sourceCount,
        };
    }
}

export { ObservationFusionEngine };