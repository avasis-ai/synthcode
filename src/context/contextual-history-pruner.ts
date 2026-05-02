export interface ContextChunk {
    content: string;
    metadata: {
        source: string;
        timestamp: number;
        topic: string;
    };
}

export interface RelevanceScorer {
    score(query: string, chunk: ContextChunk): number;
}

export class ContextualHistoryPruner {
    private scorer: RelevanceScorer;
    private maxChunks: number;

    constructor(scorer: RelevanceScorer, maxChunks: number = 10) {
        this.scorer = scorer;
        this.maxChunks = maxChunks;
    }

    prune(chunks: ContextChunk[], query: string): ContextChunk[] {
        if (!chunks || chunks.length === 0) {
            return [];
        }

        const scoredChunks = chunks.map(chunk => ({
            chunk: chunk,
            score: this.scorer.score(query, chunk)
        }));

        scoredChunks.sort((a, b) => b.score - a.score);

        const topChunks = scoredChunks.slice(0, this.maxChunks).map(item => item.chunk);

        return topChunks;
    }
}