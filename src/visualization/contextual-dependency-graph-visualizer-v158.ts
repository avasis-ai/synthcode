import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface SemanticLinkPayload {
  sourceId: string;
  targetId: string;
  relationshipType: "semantic_similarity" | "conceptual_gap" | "redundancy";
  score: number;
  description: string;
}

export interface DependencyGraphData {
  nodes: Record<string, { id: string; label: string; type: string }>;
  edges: SemanticLinkPayload[];
}

interface ContextEnrichmentResult {
  semanticLinks: SemanticLinkPayload[];
  enrichedMessages: Message[];
}

export class ContextualDependencyGraphVisualizerV158 {
  private readonly semanticLinkGenerator: (
    messages: Message[]
  ) => SemanticLinkPayload[];

  constructor() {
    this.semanticLinkGenerator = this.generateSemanticLinks;
  }

  private generateSemanticLinks(messages: Message[]): SemanticLinkPayload[] {
    const links: SemanticLinkPayload[] = [];
    // Simplified simulation of semantic analysis based on message content
    for (let i = 0; i < messages.length - 1; i++) {
      const source = messages[i];
      const target = messages[i + 1];

      if (source instanceof AssistantMessage && target instanceof UserMessage) {
        const sourceText = source.content.map((block) => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");

        const targetText = target.content;

        if (sourceText.includes("analyze") && targetText.includes("clarify")) {
          links.push({
            sourceId: `msg_${i}`,
            targetId: `msg_${i + 1}`,
            relationshipType: "conceptual_gap",
            score: 0.75,
            description: "User request requires clarification on the analysis scope.",
          });
        } else if (sourceText.includes("result") && targetText.includes("restate")) {
          links.push({
            sourceId: `msg_${i}`,
            targetId: `msg_${i + 1}`,
            relationshipType: "redundancy",
            score: 0.90,
            description: "User restates information already provided in the result.",
          });
        } else if (sourceText.includes("data") && targetText.includes("data")) {
          links.push({
            sourceId: `msg_${i}`,
            targetId: `msg_${i + 1}`,
            relationshipType: "semantic_similarity",
            score: 0.85,
            description: "High similarity in data context between consecutive turns.",
          });
        }
      }
    }
    return links;
  }

  public enrichContext(messages: Message[]): ContextEnrichmentResult {
    const semanticLinks = this.semanticLinkGenerator(messages);
    return {
      semanticLinks: semanticLinks,
      enrichedMessages: messages,
    };
  }

  public visualize(
    messages: Message[]
  ): DependencyGraphData {
    const { semanticLinks } = this.enrichContext(messages);

    const nodes: Record<string, { id: string; label: string; type: string }> = {};
    const edges: SemanticLinkPayload[] = [...semanticLinks];

    messages.forEach((message, index) => {
      const id = `msg_${index}`;
      let label = "";
      let type = "message";

      if (message instanceof UserMessage) {
        label = `User Input: "${message.content.substring(0, 30)}..."`;
      } else if (message instanceof AssistantMessage) {
        label = `Assistant Response: "${message.content.substring(0, 30)}..."`;
      } else if (message instanceof ToolResultMessage) {
        label = `Tool Result (${message.tool_use_id}): "${message.content.substring(0, 30)}..."`;
        type = "tool_result";
      }

      nodes[id] = { id: id, label: label, type: type };
    });

    return {
      nodes: nodes,
      edges: edges,
    };
  }
}