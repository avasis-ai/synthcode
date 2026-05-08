import { EventEmitter } from "node:events";

type CapabilityName = string;

interface PatternReport {
    pattern: CapabilityName[];
    count: number;
    frequency: number;
}

export class UsagePatternDetector extends EventEmitter {
    private readonly windowSize: number;
    private readonly minPatternLength: number;
    private readonly minFrequency: number;
    private history: CapabilityName[] = [];
    private patternCounts: Map<string, number> = new Map();

    constructor(
        windowSize: number = 10,
        minPatternLength: number = 3,
        minFrequency: number = 2
    ) {
        super();
        this.windowSize = windowSize;
        this.minPatternLength = minPatternLength;
        this.minFrequency = minFrequency;
    }

    /**
     * Processes a new capability usage event, updating the history and detecting patterns.
     * @param capabilityName The name of the capability used.
     */
    public processUsage(capabilityName: CapabilityName): PatternReport[] {
        this.history.push(capabilityName);
        
        // Maintain the sliding window size
        if (this.history.length > this.windowSize) {
            this.history.shift();
        }

        this.analyzePatterns();
        return this.getDetectedPatterns();
    }

    private analyzePatterns(): void {
        this.patternCounts.clear();
        const history = this.history;
        const historyLength = history.length;

        if (historyLength < this.minPatternLength) {
            return;
        }

        // Iterate through all possible sub-sequences (patterns)
        // starting from the minimum required length up to the window size
        for (let length = this.minPatternLength; length <= historyLength; length++) {
            for (let i = 0; i <= historyLength - length; i++) {
                const pattern = history.slice(i, i + length);
                const patternKey = JSON.stringify(pattern);
                
                const currentCount = this.patternCounts.get(patternKey) || 0;
                this.patternCounts.set(patternKey, currentCount + 1);
            }
        }
    }

    /**
     * Filters the stored patterns based on the minimum frequency threshold.
     * @returns An array of detected patterns that meet the frequency criteria.
     */
    private getDetectedPatterns(): PatternReport[] {
        const detectedPatterns: PatternReport[] = [];

        for (const [key, count] of this.patternCounts.entries()) {
            if (count >= this.minFrequency) {
                try {
                    const pattern: CapabilityName[] = JSON.parse(key);
                    detectedPatterns.push({
                        pattern: pattern,
                        count: count,
                        frequency: count / Math.max(1, this.history.length - pattern.length + 1)
                    });
                } catch (e) {
                    // Should not happen if patternKey generation is correct
                }
            }
        }
        return detectedPatterns;
    }

    /**
     * Clears the internal state of the detector.
     */
    public reset(): void {
        this.history = [];
        this.patternCounts.clear();
        this.emit("reset");
    }
}