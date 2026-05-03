import { UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type EntityId = string;
export type LinkType = "ASSOCIATED_WITH" | "CAUSED_BY" | "PRECEDES" | "IS_PART_OF" | "UNKNOWN";

export interface Link {
  source: EntityId;
  target: EntityId;
  type: LinkType;
  confidence: number;
}

export interface GraphConstraints {
  entityTypeCompatibility: Map<LinkType, [string, string][]>;
  temporalWindowMs: number;
  knownRelationships: Map<string, Set<string>>;
}

export class KnowledgeGraphLinkResolver {
  private constraints: GraphConstraints;

  constructor(constraints: GraphConstraints) {
    this.constraints = constraints;
  }

  private calculateTypeCompatibilityScore(linkType: LinkType, source: string, target: string): number {
    const compatiblePairs = this.constraints.entityTypeCompatibility.get(linkType);
    if (!compatiblePairs) {
      return 0.0;
    }
    for (const [s, t] of compatiblePairs) {
      if (s === source && t === target) {
        return 1.0;
      }
    }
    return 0.1;
  }

  private calculateTemporalProximityScore(source: string, target: string, context: { timestamp: number } | null): number {
    if (!context) {
      return 0.5;
    }
    // Simplified: Assume source/target IDs can be mapped to timestamps for a real implementation.
    // Here, we use a placeholder score based on context presence.
    return 0.8;
  }

  private calculateContextualRelevanceScore(source: string, target: string, context: { messages: Array<any> }): number {
    let relevanceScore = 0.0;
    const contextText = context.messages.map(msg => (msg as any)?.content || "").join(" ");

    if (contextText.includes(source) && contextText.includes(target)) {
      relevanceScore += 0.4;
    }
    if (contextText.toLowerCase().includes("relationship between " + source.toLowerCase() + " and " + target.toLowerCase())) {
      relevanceScore += 0.3;
    }
    return Math.min(1.0, relevanceScore);
  }

  public resolveLinks(
    potentialSource: EntityId,
    potentialTarget: EntityId,
    context: { messages: Array<any> };
    contextTimestamp: number | null
  ): Link[] {
    const potentialLinks: Link[] = [];
    const possibleTypes: LinkType[] = ["ASSOCIATED_WITH", "CAUSED_BY", "PRECEDES", "IS_PART_OF"];

    for (const linkType of possibleTypes) {
      const typeScore = this.calculateTypeCompatibilityScore(linkType, potentialSource, potentialTarget);
      const temporalScore = this.calculateTemporalProximityScore(potentialSource, potentialTarget, { timestamp: contextTimestamp || Date.now() });
      const contextScore = this.calculateContextualRelevanceScore(potentialSource, potentialTarget, { messages: context.messages });

      const totalScore = (typeScore * 0.4) + (temporalScore * 0.3) + (contextScore * 0.3);

      potentialLinks.push({
        source: potentialSource,
        target: potentialTarget,
        type: linkType,
        confidence: Math.max(0.0, Math.min(1.0, totalScore)),
      });
    }

    potentialLinks.sort((a, b) => b.confidence - a.confidence);

    return potentialLinks;
  }

  public getTopNResolvedLinks(
    potentialSource: EntityId,
    potentialTarget: EntityId,
    context: { messages: Array<any> };
    contextTimestamp: number | null,
    n: number = 3
  ): Link[] {
    const allLinks = this.resolveLinks(potentialSource, potentialTarget, context, contextTimestamp);
    return allLinks.slice(0, n);
  }
}