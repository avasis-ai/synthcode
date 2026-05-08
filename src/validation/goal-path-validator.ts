import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface Goal {
    description: string;
    requiredComponents: string[];
}

interface PlanContext {
    history: Message[];
    currentState: Record<string, unknown>;
}

interface PlanStep {
    actionName: string;
    inputs: Record<string, unknown>;
    relevanceKeywords: string[];
}

export class GoalPathValidator {
    private goal: Goal;
    private context: PlanContext;

    constructor(goal: Goal, context: PlanContext) {
        this.goal = goal;
        this.context = context;
    }

    private calculateRelevanceScore(step: PlanStep): number {
        let score = 0;
        const goalKeywords = this.goal.requiredComponents.join(" ").toLowerCase();
        const stepKeywords = step.relevanceKeywords.join(" ").toLowerCase();

        // 1. Keyword overlap score
        const commonKeywords = stepKeywords.split(/\s+/).filter(word => goalKeywords.includes(word));
        score += commonKeywords.length * 3;

        // 2. Action relevance score (simple check)
        if (step.actionName.toLowerCase().includes("solve") || step.actionName.toLowerCase().includes("achieve")) {
            score += 5;
        }

        return Math.min(100, score);
    }

    private assessContextualAlignment(step: PlanStep): number {
        let score = 0;
        const contextHistory = this.context.history.map(m => m.content).join(" ").toLowerCase();

        // Check if the step addresses a gap or follows up on recent context
        const requiredComponents = this.goal.requiredComponents.map(c => c.toLowerCase());

        for (const component of requiredComponents) {
            if (!contextHistory.includes(component.toLowerCase()) && step.relevanceKeywords.some(k => k.toLowerCase().includes(component.toLowerCase()))) {
                score += 4;
            }
        }

        return Math.min(20, score);
    }

    /**
     * Calculates the Goal Alignment Score for a proposed step.
     * Score is a weighted combination of direct relevance and contextual fit.
     * @param step The proposed action step.
     * @returns {number} The Goal Alignment Score (0-100).
     */
    public calculateGoalAlignmentScore(step: PlanStep): number {
        const relevanceScore = this.calculateRelevanceScore(step);
        const contextScore = this.assessContextualAlignment(step);

        // Weighted average: Relevance (60%) + Context (40%)
        const finalScore = Math.round((relevanceScore * 0.6 + contextScore * 0.4));
        return Math.max(0, Math.min(100, finalScore));
    }

    /**
     * Validates the proposed step against the goal and context.
     * @param step The proposed action step.
     * @param threshold The minimum acceptable score.
     * @returns {ValidationResult} Contains the score and a drift message if applicable.
     */
    public validateStep(step: PlanStep, threshold: number = 60): { score: number; isAligned: boolean; driftMessage: string } {
        const score = this.calculateGoalAlignmentScore(step);
        const isAligned = score >= threshold;

        let driftMessage = "";
        if (!isAligned) {
            const required = this.goal.requiredComponents.join(", ");
            driftMessage = `WARNING: Goal Drift Detected. The proposed step (${step.actionName}) has a low alignment score (${score}/100). Consider steps more directly related to achieving: ${required}.`;
        }

        return {
            score: score,
            isAligned: isAligned,
            driftMessage: driftMessage
        };
    }
}

export type ValidationResult = {
    score: number;
    isAligned: boolean;
    driftMessage: string;
};