import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface StructuralDiff {
    path: string;
    oldValue: any;
    newValue: any;
    changeType: "added" | "removed" | "modified";
}

interface SemanticDiff {
    semanticDriftScore: number;
    conceptDriftDetected: boolean;
}

export interface ContextualStateDiffResult {
    structuralChanges: StructuralDiff[];
    semanticDiff: SemanticDiff;
}

class ContextualStateDiffer {
    private readonly vectorEmbeddingFunction: (data: any) => Float32Array;

    constructor(vectorEmbeddingFunction: (data: any) => Float32Array) {
        this.vectorEmbeddingFunction = vectorEmbeddingFunction;
    }

    private calculateCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return 0.0;
        }
        let dotProduct = 0.0;
        let normA = 0.0;
        let normB = 0.0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const magnitudeA = Math.sqrt(normA);
        const magnitudeB = Math.sqrt(normB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0.0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    private calculateSemanticSimilarity(oldState: any, newState: any): number {
        if (typeof oldState !== 'object' || typeof newState !== 'object' || oldState === null || newState === null) {
            return 0.0;
        }

        const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
        let totalSimilarity = 0.0;
        let count = 0;

        for (const key of keys) {
            const oldVal = oldState[key];
            const newVal = newState[key];

            if (oldVal !== undefined && newVal !== undefined) {
                const vecA = this.vectorEmbeddingFunction(oldVal);
                const vecB = this.vectorEmbeddingFunction(newVal);
                const similarity = this.calculateCosineSimilarity(vecA, vecB);
                totalSimilarity += similarity;
                count++;
            }
        }

        return count > 0 ? totalSimilarity / count : 0.0;
    }

    private deepDiff(oldObj: any, newObj: any, path: string = ""): StructuralDiff[] {
        const structuralChanges: StructuralDiff[] = [];

        const oldKeys = Object.keys(oldObj);
        const newKeys = Object.keys(newObj);

        const allKeys = new Set([...oldKeys, ...newKeys]);

        for (const key of allKeys) {
            const currentPath = path ? `${path}.${key}` : key;
            const oldValue = oldObj[key];
            const newValue = newObj[key];

            if (!(key in oldObj)) {
                structuralChanges.push({ path: currentPath, oldValue: undefined, newValue: newValue, changeType: "added" });
            } else if (!(key in newObj)) {
                structuralChanges.push({ path: currentPath, oldValue: oldValue, newValue: undefined, changeType: "removed" });
            } else if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
                if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                    const arrayDiff = this.deepDiff(oldValue, newValue, currentPath);
                    structuralChanges.push(...arrayDiff);
                } else if (!Array.isArray(oldValue) && !Array.isArray(newValue)) {
                    const nestedDiff = this.deepDiff(oldValue, newValue, currentPath);
                    structuralChanges.push(...nestedDiff);
                } else {
                    structuralChanges.push({ path: currentPath, oldValue: oldValue, newValue: newValue, changeType: "modified" });
                }
            } else if (oldValue !== newValue) {
                structuralChanges.push({ path: currentPath, oldValue: oldValue, newValue: newValue, changeType: "modified" });
            }
        }
        return structuralChanges;
    }

    public diff(oldState: any, newState: any, semanticThreshold: number = 0.5): ContextualStateDiffResult {
        const structuralChanges = this.deepDiff(oldState, newState);

        const semanticSimilarity = this.calculateSemanticSimilarity(oldState, newState);
        const conceptDriftDetected = semanticSimilarity < semanticThreshold;

        return {
            structuralChanges: structuralChanges,
            semanticDiff: {
                semanticDriftScore: semanticSimilarity,
                conceptDriftDetected: conceptDriftDetected,
            },
        };
    }
}

export { ContextualStateDiffer };