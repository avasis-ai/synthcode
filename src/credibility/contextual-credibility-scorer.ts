export type Message = {
    role: "user" | "assistant" | "tool";
    content: string | ContentBlock | { tool_use_id: string; content: string; is_error?: boolean };
    tool_use_id?: string;
    is_error?: boolean;
};

export type ContentBlock = { type: "text" | "tool_use" | "thinking"; text?: string; id?: string; name?: string; input?: Record<string, unknown>; thinking?: string; };

export interface CredibilityScore {
    score: number;
    details: string;
}

export interface CredibilityScorer {
    score(context: Message[]): CredibilityScore;
}

class RecencyScorer implements CredibilityScorer {
    score(context: Message[]): CredibilityScore {
        if (context.length === 0) {
            return { score: 0.1, details: "No context provided." };
        }
        // Simple recency model: more recent messages (closer to the end) get higher weight.
        const totalWeight = context.length * 10;
        let weightedScore = 0;
        for (let i = 0; i < context.length; i++) {
            // Weight increases linearly with index
            weightedScore += (i + 1) * 0.5;
        }
        const score = Math.min(1.0, weightedScore / totalWeight * 1.5);
        return { score: parseFloat(score.toFixed(3)), details: `Recency score based on ${context.length} messages.` };
    }
}

class CorroborationScorer implements CredibilityScorer {
    score(context: Message[]): CredibilityScore {
        if (context.length < 2) {
            return { score: 0.3, details: "Insufficient context for corroboration." };
        }

        // Simple corroboration model: count how many times key information appears.
        let corroborationCount = 0;
        let textContent = context.map(m => {
            if (typeof m.content === 'string') return m.content;
            if (Array.isArray(m.content)) return m.content.map(b => b.text || '').join(' ');
            return '';
        }).join(' ').toLowerCase();

        const keywords = ["key concept", "important fact", "result"];
        keywords.forEach(keyword => {
            const count = (textContent.match(new RegExp(keyword, 'g')) || []).length;
            corroborationCount += count;
        });

        const score = Math.min(1.0, 0.3 + (corroborationCount * 0.05));
        return { score: parseFloat(score.toFixed(3)), details: `Corroboration found ${corroborationCount} times.` };
    }
}

class ConsistencyScorer implements CredibilityScorer {
    score(context: Message[]): CredibilityScore {
        if (context.length < 3) {
            return { score: 0.5, details: "Requires at least 3 messages for consistency check." };
        }

        // Simple consistency model: Check if the last message contradicts the first.
        const initialMessage = context[0].content;
        const finalMessage = context[context.length - 1].content;

        let contradictionScore = 0.0;
        if (typeof initialMessage === 'string' && typeof finalMessage === 'string') {
            const initialLower = initialMessage.toLowerCase();
            const finalLower = finalMessage.toLowerCase();

            if (initialLower.includes("not true") && finalLower.includes("true")) {
                contradictionScore = 0.2;
            } else if (initialLower.includes("false") && finalLower.includes("true")) {
                contradictionScore = 0.2;
            }
        }

        const score = Math.max(0.1, 0.8 - contradictionScore);
        return { score: parseFloat(score.toFixed(3)), details: `Consistency check passed with a penalty of ${contradictionScore.toFixed(2)}.` };
    }
}

export class ContextualCredibilityScorer {
    private scorers: CredibilityScorer[];
    private weights: Record<string, number>;

    constructor() {
        this.scorers = [
            new RecencyScorer(),
            new CorroborationScorer(),
            new ConsistencyScorer()
        ];
        this.weights = {
            recency: 0.35,
            corroboration: 0.35,
            consistency: 0.30
        };
    }

    score(context: Message[]): { finalScore: number; report: Record<string, CredibilityScore> } {
        let totalWeightedScore = 0;
        const report: Record<string, CredibilityScore> = {};

        for (const scorer of this.scorers) {
            // Determine which weight to apply based on the scorer type
            let weightKey: string;
            if (scorer instanceof RecencyScorer) {
                weightKey = "recency";
            } else if (scorer instanceof CorroborationScorer) {
                weightKey = "corroboration";
            } else if (scorer instanceof ConsistencyScorer) {
                weightKey = "consistency";
            } else {
                weightKey = "unknown";
            }

            const partialScore = scorer.score(context);
            report[weightKey] = partialScore;
            totalWeightedScore += partialScore.score * this.weights[weightKey];
        }

        const finalScore = parseFloat(totalWeightedScore.toFixed(3));

        return {
            finalScore: finalScore,
            report: report
        };
    }
}

export { ContextualCredibilityScorer };