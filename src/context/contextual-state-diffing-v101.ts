import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type SemanticContext = {
  embeddings: Float32Array;
  intent_vector: Float32Array;
};

interface ContextualDiffResult {
  structuralDiff: Record<string, any>;
  semanticDriftScore: number;
  isSemanticallySignificant: boolean;
  isStructurallySignificant: boolean;
  overallChangeDetected: boolean;
}

const calculateCosineSimilarity = (vecA: Float32Array, vecB: Float32Array): number => {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimension for cosine similarity.");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitudeA = Math.sqrt(normA);
  const magnitudeB = Math.sqrt(normB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

const calculateSemanticDrift = (oldContext: SemanticContext, newContext: SemanticContext): number => {
  const embeddingSimilarity = calculateCosineSimilarity(oldContext.embeddings, newContext.embeddings);
  const intentSimilarity = calculateCosineSimilarity(oldContext.intent_vector, newContext.intent_vector);

  // Simple weighted average for drift score (higher score means less drift/more similarity)
  const WEIGHT_EMBEDDING = 0.6;
  const WEIGHT_INTENT = 0.4;
  return (embeddingSimilarity * WEIGHT_EMBEDDING) + (intentSimilarity * WEIGHT_INTENT);
};

const structuralDiff = (oldState: any, newState: any): Record<string, any> => {
  const diff: Record<string, any> = {};
  const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
  for (const key of keys) {
    if (typeof oldState[key] === 'object' && oldState[key] !== null && typeof newState[key] === 'object' && newState[key] !== null) {
      const nestedDiff = structuralDiff(oldState[key], newState[key]);
      if (Object.keys(nestedDiff).length > 0) {
        diff[key] = nestedDiff;
      }
    } else if (oldState[key] !== newState[key]) {
      diff[key] = {
        old: oldState[key],
        new: newState[key],
      };
    }
  }
  return diff;
};

export const contextualDiff = (
  oldState: { messages: Message[]; context: SemanticContext },
  newState: { messages: Message[]; context: SemanticContext },
  structuralWeight: number = 0.5,
  semanticWeight: number = 0.5,
  similarityThreshold: number = 0.8
): ContextualDiffResult => {
  const structuralDiffResult = structuralDiff(oldState, newState);

  const semanticDriftScore = calculateSemanticDrift(oldState.context, newState.context);

  // Determine significance flags
  const isStructurallySignificant = Object.keys(structuralDiffResult).length > 0;
  const isSemanticallySignificant = semanticDriftScore < similarityThreshold;

  // Combine scores (Conceptual combination: Structural difference magnitude vs Semantic similarity)
  // For simplicity, we'll use a weighted combination of structural presence and semantic distance.
  const structuralMagnitude = isStructurallySignificant ? 1 : 0;
  const semanticMagnitude = 1 - Math.min(1, semanticDriftScore / similarityThreshold); // Closer to 1 means more drift

  const overallChangeScore = (structuralMagnitude * structuralWeight) + (semanticMagnitude * semanticWeight);

  const overallChangeDetected = overallChangeScore > 0.1; // Arbitrary threshold for overall change

  return {
    structuralDiff: structuralDiffResult,
    semanticDriftScore: semanticDriftScore,
    isSemanticallySignificant: isSemanticallySignificant,
    isStructurallySignificant: isStructurallySignificant,
    overallChangeDetected: overallChangeDetected,
  };
};