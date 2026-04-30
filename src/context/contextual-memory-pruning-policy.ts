import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface MemoryEntry {
  id: string;
  timestamp: number;
  content: Message;
  relevanceScore: number;
  domainImportance: number;
}

export interface PruningContext {
  currentMessage: Message;
  memory: MemoryEntry[];
}

export interface PruningCriteria {
  maxMemorySize: number;
  relevanceWeight: number;
  ageWeight: number;
  domainWeight: number;
  minRelevanceThreshold: number;
}

export interface PruningPolicy {
  apply(context: PruningContext, criteria: PruningCriteria): { prunedEntries: Set<string>; scoreMap: Map<string, number> };
}

export class ContextualMemoryPruningPolicy implements PruningPolicy {
  apply(context: PruningContext, criteria: PruningCriteria): { prunedEntries: Set<string>; scoreMap: Map<string, number> } {
    const scoreMap = new Map<string, number>();
    const prunedEntries = new Set<string>();

    const calculatePruningScore = (entry: MemoryEntry): number => {
      const age = Date.now() - entry.timestamp;
      const recencyFactor = Math.exp(-age / (3600 * 1000 * 24)); // Decay over days
      const relevanceFactor = Math.max(0, entry.relevanceScore - criteria.minRelevanceThreshold) / 10;
      const domainFactor = entry.domainImportance;

      // Composite Score: Lower score means higher pruning priority (more likely to be pruned)
      // We want to penalize low relevance, high age, and low domain importance.
      // A simple product/sum combination works:
      const score = (1 - relevanceFactor) * (1 + Math.min(1, age / (3600 * 1000 * 24))) * (1 - domainFactor);
      return score;
    };

    context.memory.forEach(entry => {
      const score = calculatePruningScore(entry);
      scoreMap.set(entry.id, score);

      if (score > 1.5) { // Heuristic threshold for pruning
        prunedEntries.add(entry.id);
      }
    });

    return { prunedEntries, scoreMap };
  }
}

export const createPruningPolicy = (
  criteria: PruningCriteria
): PruningPolicy => {
  return new ContextualMemoryPruningPolicy();
};