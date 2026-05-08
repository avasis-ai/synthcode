import { Context, SemanticAnchor, SemanticGapReport } from "./types";

type Embedding = number[];

class SemanticAnchorValidator {
    private readonly anchorEmbedding: Embedding;
    private readonly distanceMetric: (e1: Embedding, e2: Embedding) => number;
    private readonly threshold: number;

    constructor(anchor: SemanticAnchor, distanceMetric: (e1: Embedding, e2: Embedding) => number, threshold: number) {
        this.anchorEmbedding = anchor.embedding;
        this.distanceMetric = distanceMetric;
        this.threshold = threshold;
    }

    private static cosineDistance(e1: Embedding, e2: Embedding): number {
        if (e1.length !== e2.length) {
            throw new Error("Embeddings must have the same dimension.");
        }

        let dotProduct = 0;
        let norm1Squared = 0;
        let norm2Squared = 0;

        for (let i = 0; i < e1.length; i++) {
            dotProduct += e1[i] * e2[i];
            norm1Squared += e1[i] * e1[i];
            norm2Squared += e2[i] * e2[i];
        }

        const magnitudeProduct = Math.sqrt(norm1Squared) * Math.sqrt(norm2Squared);

        if (magnitudeProduct === 0) {
            return 1.0; // Maximum distance if one vector is zero
        }

        const cosineSimilarity = dotProduct / magnitudeProduct;
        // Cosine Distance = 1 - Cosine Similarity
        return 1.0 - cosineSimilarity;
    }

    /**
     * Validates the semantic alignment of the current context against the predefined anchor.
     * @param context The current operational context containing the aggregated embedding.
     * @returns A SemanticGapReport indicating potential misalignment.
     */
    validate(context: Context): SemanticGapReport {
        if (!context.aggregatedEmbedding || context.aggregatedEmbedding.length === 0) {
            return {
                isMisaligned: false,
                distance: 0,
                report: "Context embedding is empty, cannot perform validation.",
            };
        }

        const currentEmbedding = context.aggregatedEmbedding;
        const distance = this.distanceMetric(currentEmbedding, this.anchorEmbedding);

        const isMisaligned = distance > this.threshold;

        return {
            isMisaligned: isMisaligned,
            distance: distance,
            report: isMisaligned
                ? `Semantic drift detected. Distance (${distance.toFixed(4)}) exceeds threshold (${this.threshold.toFixed(4)}). Context may be drifting from the target goal.`
                : `Semantic alignment confirmed. Distance (${distance.toFixed(4)}) is within acceptable limits.`,
        };
    }
}

export { SemanticAnchorValidator };