import { Message, ContentBlock, TextBlock } from "./types";

type GapType = "MissingCapability" | "UnmappedLink" | "UnresolvedConflict";

export interface SynthesisProposal {
  artifact: string;
  confidenceScore: number;
  justification: string;
  isProvisional: boolean;
}

export interface Context {
  history: Message[];
  activeKnowledgeBase: Map<string, any>;
  provisionalKnowledge: Map<string, SynthesisProposal>;
}

interface KnowledgeRetriever {
  retrieve(context: Context, gapType: GapType): Promise<string>;
}

interface ConflictPrioritizer {
  prioritize(context: Context, gapType: GapType): Promise<{ rule: string; confidence: number }>;
}

class KnowledgeSynthesisEngine {
  private retriever: KnowledgeRetriever;
  private prioritizer: ConflictPrioritizer;

  constructor(retriever: KnowledgeRetriever, prioritizer: ConflictPrioritizer) {
    this.retriever = retriever;
    this.prioritizer = prioritizer;
  }

  private async generateProposal(context: Context, gapType: GapType): Promise<SynthesisProposal> {
    let artifact: string;
    let justification: string;
    let confidenceScore: number = 0.5;

    if (gapType === "MissingCapability") {
      const retrievedInfo = await this.retriever.retrieve(context, gapType);
      artifact = `Proposed Capability: ${retrievedInfo.toUpperCase()} Definition`;
      justification = `Detected missing capability. Synthesized definition based on related context data.`;
      confidenceScore = 0.75;
    } else if (gapType === "UnmappedLink") {
      const conflictResult = await this.prioritizer.prioritize(context, gapType);
      artifact = `Proposed Link Rule: ${conflictResult.rule}`;
      justification = `Detected unmapped link. Proposed rule based on conflict resolution patterns.`;
      confidenceScore = conflictResult.confidence;
    } else {
      artifact = "Generic Provisional Artifact";
      justification = "General knowledge gap detected requiring synthesis.";
      confidenceScore = 0.5;
    }

    return {
      artifact: artifact,
      confidenceScore: confidenceScore,
      justification: justification,
      isProvisional: true,
    };
  }

  private injectProposal(context: Context, proposal: SynthesisProposal): Context {
    const newContext = {
      ...context,
      provisionalKnowledge: new Map(context.provisionalKnowledge).set(
        proposal.artifact, proposal
      ),
    };
    return newContext;
  }

  public async synthesize(context: Context, gapType: GapType): Promise<{ proposal: SynthesisProposal; newContext: Context }> {
    const proposal = await this.generateProposal(context, gapType);
    const newContext = this.injectProposal(context, proposal);

    return {
      proposal: proposal,
      newContext: newContext,
    };
  }
}

export { KnowledgeSynthesisEngine };