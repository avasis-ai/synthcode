import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  source_reliability: number;
  timestamp: number;
}

export interface KnowledgeGraphPayload {
  edges: Map<string, Triple>;
  nodes: Set<string>;
}

export class ContextualKnowledgeGraphUpdater {
  private graph: KnowledgeGraphPayload;

  constructor(initialGraph: KnowledgeGraphPayload = {
    edges: new Map(),
    nodes: new Set<string>(),
  }) {
    this.graph = initialGraph;
  }

  private calculateTrustScore(
    subject: string,
    predicate: string,
    object: string,
    sourceReliability: number,
    timestamp: number,
    existingTriple: Triple | undefined
  ): number {
    const temporalDecayFactor = Math.exp(-(Date.now() - timestamp) / (3600 * 1000 * 24)); // Decay over 24 hours
    let score = sourceReliability * temporalDecayFactor;

    if (existingTriple) {
      // Penalize if the new information contradicts existing high-confidence data (simplified)
      const contradictionPenalty = Math.abs(existingTriple.source_reliability - sourceReliability) * 0.1;
      score = Math.max(0.1, score - contradictionPenalty);
    }

    return score;
  }

  private generateCandidateTriples(contextChunks: ContentBlock[]): Triple[] {
    // Placeholder for complex NLP extraction logic.
    // In a real scenario, this would use an LLM call or NER/Relation Extraction model.
    const candidates: Triple[] = [];
    let currentTimestamp = Date.now();

    for (const block of contextChunks) {
      if (block.type === "text") {
        const text = block.text;
        // Mock extraction: Assume simple patterns for demonstration
        if (text.includes("Apple") && text.includes("iPhone")) {
          candidates.push({
            subject: "Apple",
            predicate: "manufactures",
            object: "iPhone",
            source_reliability: 0.9,
            timestamp: currentTimestamp,
          });
        }
        if (text.includes("iOS")) {
          candidates.push({
            subject: "iPhone",
            predicate: "runs_on",
            object: "iOS",
            source_reliability: 0.85,
            timestamp: currentTimestamp,
          });
        }
      }
    }
    return candidates;
  }

  public updateGraph(contextChunks: ContentBlock[]): KnowledgeGraphPayload {
    const candidateTriples = this.generateCandidateTriples(contextChunks);

    for (const candidate of candidateTriples) {
      const edgeKey = `${candidate.subject}|${candidate.predicate}|${candidate.object}`;
      const existingTriple = this.graph.edges.get(edgeKey);

      if (!existingTriple) {
        // Case 1: New Edge
        this.graph.edges.set(edgeKey, { ...candidate });
        this.graph.nodes.add(candidate.subject);
        this.graph.nodes.add(candidate.object);
      } else {
        // Case 2: Update Existing Edge
        const newScore = this.calculateTrustScore(
          candidate.subject,
          candidate.predicate,
          candidate.object,
          candidate.source_reliability,
          candidate.timestamp,
          existingTriple
        );

        if (newScore > existingTriple.source_reliability * 1.1) {
          // Update if the new information significantly increases the trust score
          const updatedTriple: Triple = {
            ...existingTriple,
            source_reliability: Math.min(1.0, existingTriple.source_reliability + (newScore - existingTriple.source_reliability) * 0.5),
            timestamp: candidate.timestamp, // Use the latest timestamp
          };
          this.graph.edges.set(edgeKey, updatedTriple);
        }
        // If score is not significantly higher, we discard the update to prevent noise.
      }
    }

    return this.graph;
  }
}