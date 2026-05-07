import { Message } from "../types/message";

export interface CausalLink {
  cause: string;
  effect: string;
  description: string;
}

export interface SupportingEvidence {
  source: string;
  type: "fact" | "logic" | "temporal";
  details: string;
}

export interface CausalAssumptionReport {
  isSupported: boolean;
  confidenceScore: number;
  reasons: string[];
  evidence: SupportingEvidence[];
}

export interface Context {
  history: Message[];
  knowledgeGraph: Record<string, string[]>;
  temporalConstraints: Map<string, Date>;
}

export class CausalAssumptionValidator {
  private readonly knowledgeGraph: Record<string, string[]>;

  constructor(knowledgeGraph: Record<string, string[]>) {
    this.knowledgeGraph = knowledgeGraph;
  }

  private checkKnowledgeGraphSupport(cause: string, effect: string): SupportingEvidence[] {
    const evidence: SupportingEvidence[] = [];
    const neighbors = this.knowledgeGraph[cause] || [];

    if (neighbors.includes(effect)) {
      evidence.push({
        source: "Knowledge Graph",
        type: "fact",
        details: `Direct link found: ${cause} is known to lead to ${effect}.`,
      });
    }

    // Simple check for indirect support (A -> X -> B)
    for (const neighbor of neighbors) {
      if (this.knowledgeGraph[neighbor]?.includes(effect)) {
        evidence.push({
          source: "Knowledge Graph",
          type: "logic",
          details: `Indirect support found: ${cause} -> ${neighbor} -> ${effect}.`,
        });
      }
    }
    return evidence;
  }

  private checkTemporalSupport(cause: string, effect: string, context: Context): SupportingEvidence[] {
    const evidence: SupportingEvidence[] = [];
    const causeTime = context.temporalConstraints.get(cause);
    const effectTime = context.temporalConstraints.get(effect);

    if (causeTime && effectTime) {
      if (causeTime.getTime() < effectTime.getTime()) {
        evidence.push({
          source: "Temporal Constraint",
          type: "temporal",
          details: `Temporal order confirmed: ${cause} must precede ${effect}.`,
        });
      } else {
        evidence.push({
          source: "Temporal Constraint",
          type: "temporal",
          details: `Warning: Temporal order might be violated or ambiguous.`,
        });
      }
    }
    return evidence;
  }

  private checkContextualSupport(cause: string, effect: string, context: Context): SupportingEvidence[] {
    const evidence: SupportingEvidence[] = [];
    const historyMessages = context.history;

    for (const message of historyMessages) {
      const content = message.content;
      if (typeof content === "string" && content.includes(cause) && content.includes(effect)) {
        evidence.push({
          source: "Conversation History",
          type: "fact",
          details: `Support found in recent conversation history: "${content.substring(0, 50)}..."`,
        });
      }
    }
    return evidence;
  }

  validate(link: CausalLink, context: Context): CausalAssumptionReport {
    const allEvidence: SupportingEvidence[] = [];

    // 1. Check Knowledge Graph Support
    allEvidence.push(...this.checkKnowledgeGraphSupport(link.cause, link.effect));

    // 2. Check Temporal Support
    allEvidence.push(...this.checkTemporalSupport(link.cause, link.effect, context));

    // 3. Check Contextual Support
    allEvidence.push(...this.checkContextualSupport(link.cause, link.effect, context));

    const supportedLinks = allEvidence.filter(e => e.type !== "warning");
    const isSupported = supportedLinks.length > 0;

    const reasons = [
      `Proposed link: ${link.cause} causes ${link.effect}.`,
      isSupported ? "The link is supported by multiple sources." : "The link lacks sufficient verifiable support.",
    ];

    return {
      isSupported: isSupported,
      confidenceScore: Math.min(1.0, supportedLinks.length * 0.2 + 0.5),
      reasons: reasons,
      evidence: allEvidence,
    };
  }
}

export { CausalAssumptionValidator };