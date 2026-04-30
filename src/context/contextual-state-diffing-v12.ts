import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface Context {
    history: Message[];
    session_id: string;
    user_profile: Record<string, unknown>;
}

interface StructuralDiff {
    path: string;
    oldValue: unknown;
    newValue: unknown;
    changeType: "added" | "removed" | "modified";
}

interface SemanticDiff {
    path: string;
    description: string;
    confidence_score: number;
}

interface StateDiffReport {
    structural_diff: StructuralDiff[];
    semantic_diff: SemanticDiff[];
}

export class ContextualStateDiffer {
    private readonly semanticSimilarityThreshold: number;

    constructor(semanticSimilarityThreshold: number = 0.8) {
        this.semanticSimilarityThreshold = semanticSimilarityThreshold;
    }

    private calculateStructuralDiff(oldState: Record<string, unknown>, newState: Record<string, unknown>): StructuralDiff[] {
        const structuralDiff: StructuralDiff[] = [];
        const oldKeys = Object.keys(oldState);
        const newKeys = Object.keys(newState);
        const allKeys = new Set([...oldKeys, ...newKeys]);

        for (const key of allKeys) {
            const oldValue = oldState[key];
            const newValue = newState[key];

            if (!(key in oldState)) {
                structuralDiff.push({ path: key, oldValue: undefined, newValue: newValue, changeType: "added" });
            } else if (!(key in newState)) {
                structuralDiff.push({ path: key, oldValue: oldValue, newValue: undefined, changeType: "removed" });
            } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                structuralDiff.push({ path: key, oldValue: oldValue, newValue: newValue, changeType: "modified" });
            }
        }
        return structuralDiff;
    }

    private calculateSemanticDiff(oldState: Record<string, unknown>, newState: Record<string, unknown>, context: Context): SemanticDiff[] {
        const semanticDiff: SemanticDiff[] = [];

        const checkSemanticField = (path: string, oldValue: unknown, newValue: unknown) => {
            if (typeof oldValue !== 'string' || typeof newValue !== 'string') return null;

            // Mock semantic comparison: In a real system, this would use embeddings (e.g., cosine similarity)
            // For this implementation, we simulate a score based on content overlap.
            const similarityScore = Math.min(1.0, Math.abs(oldValue.length - newValue.length) / Math.max(oldValue.length, newValue.length) * 0.5 + 0.5);

            if (similarityScore > this.semanticSimilarityThreshold) {
                return {
                    path: path,
                    description: `Semantically similar change detected. Overlap suggests intent preservation.`,
                    confidence_score: similarityScore
                };
            }
            return null;
        };

        // Example: Check specific fields known to be semantically important
        const fieldsToCheck: { path: string, getter: (state: Record<string, unknown>) => unknown }[] = [
            { path: "user_profile.intent", getter: (state) => (state as any).user_profile?.intent },
            { path: "history.last_user_message.content", getter: (state) => (state as any).history.length > 0 ? (state as any).history[state['history'].length - 1].content : null }
        ];

        for (const { path, getter } of fieldsToCheck) {
            const oldVal = getter(oldState);
            const newVal = getter(newState);

            if (oldVal !== undefined && newVal !== undefined) {
                const semanticResult = checkSemanticField(path, oldVal, newVal);
                if (semanticResult) {
                    semanticDiff.push(semanticResult);
                }
            }
        }

        return semanticDiff;
    }

    public diffState(oldState: Record<string, unknown>, newState: Record<string, unknown>, context: Context): StateDiffReport {
        const structuralDiff = this.calculateStructuralDiff(oldState, newState);
        const semanticDiff = this.calculateSemanticDiff(oldState, newState, context);

        return {
            structural_diff: structuralDiff,
            semantic_diff: semanticDiff
        };
    }
}