import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./synth-code-types.js";

interface OperationalContext {
    maxLatencyMs: number;
    minSecurityScore: number;
    requiredResourceType: string;
    computationalBudget: number;
}

interface ToolFilter {
    name: string;
    description: string;
    operationalRequirements: {
        maxLatencyMs: number;
        minSecurityScore: number;
        requiredResourceType: string;
        computationalBudget: number;
    };
    // Placeholder for the actual tool function/logic
    execute?: (input: Record<string, unknown>) => Promise<string>;
}

interface ToolCandidate extends ToolFilter {
    // Assuming the tool definition includes relevance score calculation capability
    calculateRelevanceScore: (context: Message[]) => number;
}

class OperationalContextualToolSelector {
    private context: OperationalContext;

    constructor(context: OperationalContext) {
        this.context = context;
    }

    private isOperationallyViable(tool: ToolCandidate): boolean {
        const req = tool.operationalRequirements;

        if (req.maxLatencyMs > this.context.maxLatencyMs) {
            return false;
        }
        if (req.minSecurityScore > this.context.minSecurityScore) {
            return false;
        }
        if (req.requiredResourceType !== this.context.requiredResourceType) {
            return false;
        }
        if (req.computationalBudget > this.context.computationalBudget) {
            return false;
        }
        return true;
    }

    private calculateFeasibilityScore(tool: ToolCandidate): number {
        const req = tool.operationalRequirements;
        let score = 0;

        // Penalize deviations from context limits
        score += Math.max(0, this.context.maxLatencyMs - req.maxLatencyMs) / 100;
        score += Math.max(0, this.context.minSecurityScore - req.minSecurityScore) / 100;
        
        // Simple check for resource match
        if (req.requiredResourceType === this.context.requiredResourceType) {
            score += 1.5;
        }
        
        // Budget penalty
        score -= Math.min(1, req.computationalBudget / this.context.computationalBudget);

        return Math.max(0, score);
    }

    public selectTool(candidates: ToolCandidate[], messageHistory: Message[]): { tool: ToolCandidate | null; score: number } {
        
        const viableTools = candidates.filter(tool => this.isOperationallyViable(tool));

        if (viableTools.length === 0) {
            return { tool: null, score: 0 };
        }

        const scoredTools = viableTools.map(tool => {
            const relevanceScore = tool.calculateRelevanceScore(messageHistory);
            const feasibilityScore = this.calculateFeasibilityScore(tool);

            // Weighted combination: Relevance (60%) + Feasibility (40%)
            const combinedScore = (relevanceScore * 0.6) + (feasibilityScore * 0.4);
            return { tool, score: combinedScore };
        });

        scoredTools.sort((a, b) => b.score - a.score);

        const bestTool = scoredTools[0];

        return { tool: bestTool.tool, score: bestTool.score };
    }
}

export { OperationalContextualToolSelector };