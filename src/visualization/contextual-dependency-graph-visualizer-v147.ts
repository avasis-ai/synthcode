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

export interface ContextualEdge {
  sourceId: string;
  targetId: string;
  contextConcept: string;
  type: "contextual" | "tool_call";
}

export interface ContextualDependencyGraph {
  messages: Message[];
  contextualEdges: ContextualEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private readonly graph: ContextualDependencyGraph;

  constructor(graph: ContextualDependencyGraph) {
    this.graph = graph;
  }

  private extractContextFromMessage(message: Message): string {
    if ("user" === (message as UserMessage).role) {
      return (message as UserMessage).content;
    }
    if ("assistant" === (message as AssistantMessage).role) {
      const content = (message as AssistantMessage).content;
      let context = "";
      for (const block of content) {
        if ("text" === (block as TextBlock).type) {
          context += (block as TextBlock).text + " ";
        }
      }
      return context.trim();
    }
    if ("tool" === (message as ToolResultMessage).role) {
      return (message as ToolResultMessage).content;
    }
    return "";
  }

  private generateContextualEdges(messages: Message[]): ContextualEdge[] {
    const edges: ContextualEdge[] = [];
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currMessage = messages[i];

      const prevContext = this.extractContextFromMessage(prevMessage);
      const currContext = this.extractContextFromMessage(currMessage);

      if (prevContext && currContext) {
        // Simple overlap detection for demonstration
        const commonConcepts = new Set<string>();
        const prevWords = prevContext.toLowerCase().match(/\b\w{3,}\b/g) || [];
        const currWords = currContext.toLowerCase().match(/\b\w{3,}\b/g) || [];

        prevWords.forEach(word => {
          if (currWords.includes(word)) {
            commonConcepts.add(word);
          }
        });

        if (commonConcepts.size > 0) {
          edges.push({
            sourceId: `msg_${i - 1}`,
            targetId: `msg_${i}`,
            contextConcept: Array.from(commonConcepts).join(", "),
            type: "contextual",
          });
        }
      }
    }
    return edges;
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const { messages, contextualEdges } = this.graph;

    const nodes: any[] = messages.map((message, index) => ({
      id: `msg_${index}`,
      type: "message",
      data: {
        role: (message as Message).role,
        contentSummary: this.extractContextFromMessage(message).substring(0, 50) + "...",
      },
    }));

    const edges: any[] = [
      ...contextualEdges.map(edge => ({
        source: edge.sourceId,
        target: edge.targetId,
        value: {
          type: edge.type,
          context: edge.contextConcept,
        },
      })),
      // Placeholder for explicit tool call edges if needed, using message index difference
    ];

    return { nodes, edges };
  }
}

export function createContextualDependencyGraphVisualizer(
  messages: Message[],
  contextualEdges: ContextualEdge[]
): ContextualDependencyGraphVisualizer {
  const graph: ContextualDependencyGraph = {
    messages: messages,
    contextualEdges: contextualEdges,
  };
  return new ContextualDependencyGraphVisualizer(graph);
}