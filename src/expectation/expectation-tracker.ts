import { Message, UserMessage, ToolResultMessage } from "./types";

interface Expectation {
    id: string;
    source: "user" | "system";
    expectedOutcome: string;
    priority: number;
    resourceConstraint: string | null;
    weight: number;
    timestamp: number;
}

interface ExpectationScore {
    overallScore: number;
    constraints: Record<string, number>;
    driftDetected: boolean;
}

export class ExpectationTracker {
    private expectations: Expectation[] = [];
    private history: Message[] = [];

    constructor() {}

    recordExpectation(message: UserMessage): void {
        const newExpectation: Expectation = {
            id: Date.now().toString(),
            source: "user",
            expectedOutcome: message.content,
            priority: this.calculatePriority(message.content),
            resourceConstraint: this.extractConstraint(message.content),
            weight: 1.0,
            timestamp: Date.now(),
        };
        this.expectations.push(newExpectation);
        this.history.push(message);
    }

    updateExpectation(result: ToolResultMessage): void {
        const observedOutcome = result.content;
        const lastExpectation = this.expectations[this.expectations.length - 1];

        if (!lastExpectation) {
            return;
        }

        const driftScore = this.calculateDrift(lastExpectation.expectedOutcome, observedOutcome);

        // Update the weight based on how close the outcome was to the expectation
        const updatedExpectation: Expectation = {
            ...lastExpectation,
            weight: Math.max(0.1, lastExpectation.weight * (1 - driftScore * 0.1)),
            timestamp: Date.now(),
        };

        // Replace the last expectation with the updated version
        this.expectations[this.expectations.length - 1] = updatedExpectation;
        this.history.push(result as unknown as Message);
    }

    private calculatePriority(content: string): number {
        if (content.toLowerCase().includes("must") || content.toLowerCase().includes("critical")) {
            return 0.9;
        }
        if (content.toLowerCase().includes("preferably") || content.toLowerCase().includes("nice to have")) {
            return 0.4;
        }
        return 0.7;
    }

    private extractConstraint(content: string): string | null {
        if (content.toLowerCase().includes("under 5 minutes")) {
            return "time:5m";
        }
        if (content.toLowerCase().includes("list of")) {
            return "format:list";
        }
        return null;
    }

    private calculateDrift(expected: string, observed: string): number {
        const expectedKeywords = expected.toLowerCase().split(/\s+/);
        const observedKeywords = observed.toLowerCase().split(/\s+/);

        let matchCount = 0;
        let totalKeywords = Math.max(expectedKeywords.length, observedKeywords.length);

        for (const expWord of expectedKeywords) {
            if (observedKeywords.includes(expWord)) {
                matchCount++;
            }
        }

        // Simple similarity metric: (Matches / Max Length)
        return Math.min(1.0, matchCount / Math.max(1, totalKeywords));
    }

    getExpectationScore(): ExpectationScore {
        if (this.expectations.length === 0) {
            return { overallScore: 0, constraints: {}, driftDetected: false };
        }

        let totalWeightedScore = 0;
        const constraints: Record<string, number> = {};
        let maxDrift = 0;

        this.expectations.forEach(e => {
            totalWeightedScore += e.weight * e.priority;
            
            if (e.resourceConstraint) {
                const key = e.resourceConstraint.split(':')[0];
                constraints[key] = (constraints[key] || 0) + e.weight;
            }
            
            // Check for significant drift in the last recorded expectation
            if (e.source === "user" && e.weight < 0.5) {
                maxDrift = Math.max(maxDrift, 1 - e.weight);
            }
        });

        const driftDetected = maxDrift > 0.3;

        return {
            overallScore: totalWeightedScore,
            constraints: constraints,
            driftDetected: driftDetected,
        };
    }
}