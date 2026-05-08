import { EventEmitter } from "node:events";

export type ConfidenceScore = number;

export interface ScoreChange {
    delta: number;
    sourceReliability: number;
    reason: string;
    timestamp: number;
}

export class ConfidenceContext {
    private currentScore: ConfidenceScore;
    private history: ScoreChange[];

    constructor(initialScore: ConfidenceScore = 1.0) {
        this.currentScore = initialScore;
        this.history = [];
    }

    getScore(): ConfidenceScore {
        return this.currentScore;
    }

    getHistory(): ReadonlyArray<ScoreChange> {
        return this.history;
    }

    recordChange(delta: number, sourceReliability: number, reason: string): void {
        const change: ScoreChange = {
            delta: delta,
            sourceReliability: sourceReliability,
            reason: reason,
            timestamp: Date.now(),
        };
        this.history.push(change);
        this.currentScore += delta;
    }
}

export class ConfidencePropagationManager extends EventEmitter {
    private context: ConfidenceContext;
    private readonly CRITICAL_THRESHOLD: ConfidenceScore;

    constructor(initialScore: ConfidenceScore = 1.0, criticalThreshold: ConfidenceScore = 0.3) {
        super();
        this.context = new ConfidenceContext(initialScore);
        this.CRITICAL_THRESHOLD = criticalThreshold;
    }

    /**
     * Updates the internal confidence score based on an observed change.
     * @param delta The raw change in confidence (positive or negative).
     * @param sourceReliability A factor (0.0 to 1.0) indicating the trustworthiness of the source providing the delta.
     * @param reason A descriptive string of why the score changed.
     */
    public updateScore(delta: number, sourceReliability: number, reason: string): void {
        if (sourceReliability < 0 || sourceReliability > 1) {
            throw new Error("Source reliability must be between 0.0 and 1.0.");
        }

        // Weighted delta calculation: The effective change is modulated by source reliability.
        const effectiveDelta = delta * sourceReliability;

        this.context.recordChange(effectiveDelta, sourceReliability, reason);
        
        const currentScore = this.context.getScore();

        if (currentScore < this.CRITICAL_THRESHOLD) {
            this.emit("confidence_low", { score: currentScore, threshold: this.CRITICAL_THRESHOLD });
        } else {
            this.emit("confidence_updated", { score: currentScore });
        }
    }

    /**
     * Retrieves the current systemic confidence score.
     */
    public getConfidence(): ConfidenceScore {
        return this.context.getScore();
    }

    /**
     * Checks if the current confidence score is below the critical threshold.
     * @returns True if confidence is low, false otherwise.
     */
    public isConfidenceLow(): boolean {
        return this.context.getScore() < this.CRITICAL_THRESHOLD;
    }

    /**
     * Resets the confidence context, useful for starting a new, independent task.
     */
    public resetConfidence(newScore: ConfidenceScore = 1.0): void {
        this.context = new ConfidenceContext(newScore);
        this.emit("confidence_reset", { score: newScore });
    }
}

export {
    ConfidenceContext,
    ConfidencePropagationManager
}