interface ObservationPayload {
    value: number;
    sourceId: string;
    weight: number;
}

interface ReconciledObservation {
    value: number;
    source: string;
    timestamp: Date;
}

interface ConflictResolutionStrategy {
    resolve(observations: ObservationPayload[]): ReconciledObservation;
}

class WeightedAverageStrategy implements ConflictResolutionStrategy {
    resolve(observations: ObservationPayload[]): ReconciledObservation {
        if (observations.length === 0) {
            throw new Error("Cannot resolve conflict: No observations provided.");
        }

        let weightedSum = 0;
        let totalWeight = 0;

        for (const obs of observations) {
            weightedSum += obs.value * obs.weight;
            totalWeight += obs.weight;
        }

        const reconciledValue = totalWeight === 0 ? 0 : weightedSum / totalWeight;
        
        // Use the source with the highest weight as the representative source
        const authoritativeSource = observations.reduce((acc, obs) => 
            obs.weight > acc.weight ? { sourceId: obs.sourceId, weight: obs.weight } : acc, 
            { sourceId: "", weight: -1 }
        );

        return {
            value: reconciledValue,
            source: authoritativeSource.sourceId,
            timestamp: new Date(),
        };
    }
}

class AuthorityStrategy implements ConflictResolutionStrategy {
    resolve(observations: ObservationPayload[]): ReconciledObservation {
        if (observations.length === 0) {
            throw new Error("Cannot resolve conflict: No observations provided.");
        }

        let bestObservation: ObservationPayload = observations[0];

        for (const obs of observations) {
            if (obs.weight > bestObservation.weight) {
                bestObservation = obs;
            }
        }

        return {
            value: bestObservation.value,
            source: bestObservation.sourceId,
            timestamp: new Date(),
        };
    }
}

export class TemporalConflictResolver {
    /**
     * Resolves conflicts among multiple time-series observations using a specified strategy.
     * @param observations An array of conflicting observations from different sources.
     * @param strategy The strategy to apply for conflict resolution.
     * @returns The single, reconciled, and authoritative observation.
     */
    resolve(observations: ObservationPayload[], strategy: ConflictResolutionStrategy): ReconciledObservation {
        if (!strategy) {
            throw new Error("A conflict resolution strategy must be provided.");
        }
        if (!observations || observations.length === 0) {
            throw new Error("Cannot resolve conflict: Observation list is empty.");
        }

        return strategy.resolve(observations);
    }
}

export {
    TemporalConflictResolver,
    WeightedAverageStrategy,
    AuthorityStrategy,
    ObservationPayload,
    ReconciledObservation
}