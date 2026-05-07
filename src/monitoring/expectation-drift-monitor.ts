import { Message, UserMessage } from "./types";

interface ExpectedEntity {
    name: string;
    required: boolean;
    description: string;
}

export class ExpectationProfile {
    private initialIntent: string;
    private expectedEntities: ExpectedEntity[];
    private expectedDomain: string;

    constructor(initialIntent: string, expectedEntities: ExpectedEntity[], expectedDomain: string) {
        this.initialIntent = initialIntent;
        this.expectedEntities = expectedEntities;
        this.expectedDomain = expectedDomain;
    }

    getExpectedEntities(): ExpectedEntity[] {
        return this.expectedEntities;
    }

    getInitialIntent(): string {
        return this.initialIntent;
    }

    getExpectedDomain(): string {
        return this.expectedDomain;
    }
}

export interface ExpectationDriftReport {
    isDrifting: boolean;
    score: number;
    details: string;
    actionRequired: "CLARIFICATION" | "CONTINUE" | "STOP";
}

export class ExpectationDriftMonitor {
    private profile: ExpectationProfile;
    private readonly driftThreshold: number;

    constructor(profile: ExpectationProfile, driftThreshold: number = 0.3) {
        this.profile = profile;
        this.driftThreshold = driftThreshold;
    }

    private calculateSemanticSimilarity(context: UserMessage): number {
        // Placeholder for complex embedding similarity calculation (e.g., cosine similarity)
        // In a real system, this would involve calling an embedding model.
        const contextLength = context.content.length;
        const profileIntentLength = this.profile.getInitialIntent().length;
        
        // Simple heuristic: similarity decreases if context is very different in length/topic
        let score = Math.min(1.0, 1.0 - Math.abs(contextLength - profileIntentLength) / Math.max(contextLength, profileIntentLength) * 0.5);
        
        // Simulate a base score based on shared keywords (very basic)
        const keywords = ["book", "flight", "reservation", "schedule"];
        let matchCount = 0;
        const lowerContent = context.content.toLowerCase();
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword)) {
                matchCount++;
            }
        }
        score += matchCount * 0.1;
        return Math.min(1.0, score);
    }

    private checkEntityCompleteness(context: UserMessage): { score: number; details: string } {
        const expected = this.profile.getExpectedEntities();
        let missingCount = 0;
        let details = "";

        for (const entity of expected) {
            // Placeholder check: assumes entity presence is checked via NLP extraction
            const isPresent = context.content.toLowerCase().includes(entity.name.toLowerCase());
            if (!isPresent && entity.required) {
                missingCount++;
                details += `Missing required entity: ${entity.name}. `;
            }
        }

        const score = 1.0 - (missingCount * 0.2);
        return { score: Math.max(0, score), details: details.trim() };
    }

    public monitor(context: UserMessage): ExpectationDriftReport {
        // 1. Semantic Drift Check (How close is the topic?)
        const semanticScore = this.calculateSemanticSimilarity(context);

        // 2. Entity Drift Check (Are the necessary components present?)
        const entityCheck = this.checkEntityCompleteness(context);

        // Combine scores (Weighted average)
        const combinedScore = (semanticScore * 0.6) + (entityCheck.score * 0.4);

        const isDrifting = combinedScore < this.driftThreshold;

        let report: ExpectationDriftReport;

        if (isDrifting) {
            report = {
                isDrifting: true,
                score: combinedScore,
                details: `Drift detected. Semantic similarity (${semanticScore.toFixed(2)}) is low, and ${entityCheck.details ? 'entities are incomplete.' : 'context is off-topic.'}`,
                actionRequired: "CLARIFICATION"
            };
        } else {
            report = {
                isDrifting: false,
                score: combinedScore,
                details: "Context aligns well with established expectations.",
                actionRequired: "CONTINUE"
            };
        }

        return report;
    }
}