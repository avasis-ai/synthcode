import { ContextChunk, Query, TimeWindow } from "./context-types";

interface SemanticContextMergerV5 {
    calculateCombinedScore(chunk: ContextChunk, query: Query, timeWindow: TimeWindow): number;
    mergeWithTemporalScoring(contextChunks: ContextChunk[], query: Query, timeWindow: TimeWindow): ContextChunk[];
}

export class SemanticContextMergerV5 implements SemanticContextMergerV5 {
    calculateCombinedScore(chunk: ContextChunk, query: Query, timeWindow: TimeWindow): number {
        const semanticScore = this.calculateCosineSimilarity(chunk.content, query.content);
        const temporalScore = this.calculateTimeDecay(chunk.timestamp, timeWindow);
        
        // Combined score: Weighted average or product. Using a weighted sum here.
        // Weights can be tuned based on empirical testing.
        const semanticWeight = 0.7;
        const temporalWeight = 0.3;

        return (semanticScore * semanticWeight) + (temporalScore * temporalWeight);
    }

    calculateCosineSimilarity(content: string, query: string): number {
        const textVector = this.textToVector(content);
        const queryVector = this.textToVector(query);

        if (textVector.length === 0 || queryVector.length === 0) {
            return 0.0;
        }

        let dotProduct = 0;
        for (let i = 0; i < textVector.length; i++) {
            dotProduct += textVector[i] * queryVector[i];
        }

        const magnitudeA = Math.sqrt(textVector.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0.0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    calculateTimeDecay(timestamp: number, timeWindow: TimeWindow): number {
        const timeDifference = Math.abs(timestamp - timeWindow.startTime);
        const maxTime = timeWindow.endTime - timeWindow.startTime;

        if (maxTime === 0) return 1.0;

        // Exponential decay: e^(-k * |t - t_ref| / T)
        // We use a decay factor that approaches 1.0 for recent items and decays towards 0.
        // A simple linear decay normalized by the window size can also work: 1 - (timeDifference / maxTime)
        
        // Using a decay that is 1.0 at the start and decays towards 0.0 at the end of the window.
        const normalizedTime = Math.min(1.0, Math.max(0.0, (timeDifference / maxTime)));
        
        // Simple inverse decay: 1.0 - normalizedTime (if timeDifference is small, score is high)
        return Math.max(0.1, 1.0 - normalizedTime);
    }

    textToVector(text: string): number[] {
        // Placeholder for actual embedding generation (e.g., using a model API)
        // For this simulation, we use a simple frequency count vector based on common words.
        const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
        const vocabulary: Set<string> = new Set(["context", "query", "time", "merge", "semantic", "relevance", "state", "data", "info"]);
        const vectorSize = Math.max(vocabulary.size, 10); // Ensure minimum size

        const counts: Record<string, number> = {};
        vocabulary.forEach(word => counts[word] = 0);

        words.forEach(word => {
            if (vocabulary.has(word)) {
                counts[word] = (counts[word] || 0) + 1;
            }
        });

        const vector: number[] = [];
        for (let i = 0; i < vectorSize; i++) {
            const word = Array.from(vocabulary)[i];
            vector.push(counts[word] || 0);
        }
        return vector;
    }

    mergeWithTemporalScoring(contextChunks: ContextChunk[], query: Query, timeWindow: TimeWindow): ContextChunk[] {
        if (!contextChunks || contextChunks.length === 0) {
            return [];
        }

        const scoredChunks = contextChunks.map(chunk => ({
            chunk: chunk,
            score: this.calculateCombinedScore(chunk, query, timeWindow)
        }));

        // Sort by score in descending order
        scoredChunks.sort((a, b) => b.score - a.score);

        // Select top N chunks (e.g., top 3, or all if less than 3)
        const N = Math.min(3, scoredChunks.length);
        
        return scoredChunks.slice(0, N).map(item => item.chunk);
    }
}