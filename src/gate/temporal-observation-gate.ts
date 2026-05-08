export type GateStatus = "OPEN" | "CLOSED" | "TIMEOUT";

export interface Observation {
    type: string;
    data: any;
    timestamp: number;
}

export class TemporalObservationGate {
    private requiredObservationTypes: Set<string>;
    private minCount: number;
    private timeWindowMs: number;
    private startTime: number;
    private observationCount: number;
    private observedTypes: Set<string>;

    constructor(
        requiredObservationTypes: string[],
        minCount: number,
        timeWindowMs: number
    ) {
        this.requiredObservationTypes = new Set(requiredObservationTypes);
        this.minCount = minCount;
        this.timeWindowMs = timeWindowMs;
        this.startTime = Date.now();
        this.observationCount = 0;
        this.observedTypes = new Set<string>();
    }

    waitObservation(observation: Observation): void {
        if (this.observedTypes.has(observation.type)) {
            return;
        }

        if (!this.requiredObservationTypes.has(observation.type)) {
            return;
        }

        this.observationCount++;
        this.observedTypes.add(observation.type);
    }

    checkGateStatus(): GateStatus {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;

        if (elapsedTime > this.timeWindowMs) {
            return "TIMEOUT";
        }

        if (this.observationCount < this.minCount) {
            return "CLOSED";
        }

        return "OPEN";
    }
}