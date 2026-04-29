import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContextualLink = {
  sourceNodeId: string;
  targetNodeId: string;
  contextSource: "memory" | "context_chunk" | "user_input" | "system_prompt";
  contextIdentifier: string;
  description: string;
};

export interface DependencyGraphNode {
  id: string;
  type: "message" | "tool_call" | "context_source";
  content: any;
  metadata: Record<string, unknown>;
}

export interface DependencyGraphEdge {
  sourceId: string;
  targetId: string;
  contextualLinks: ContextualLink[];
}

export interface ContextualDependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}

class ContextualDependencyGraphVisualizer {
  private graph: ContextualDependencyGraph;

  constructor(graph: ContextualDependencyGraph) {
    this.graph = graph;
  }

  public visualize(): string {
    let output = "--- Contextual Dependency Graph Visualization ---\n";

    output += "\n[NODES]\n";
    this.graph.nodes.forEach(node => {
      output += `ID: ${node.id}, Type: ${node.type.toUpperCase()}\n`;
      if (node.type === "message") {
        const msg = node.content as Message;
        output += `  Role: ${msg.role}, Content Snippet: "${String(msg.content).substring(0, 50)}..."\n`;
      } else if (node.type === "tool_call") {
        const toolUse = node.content as ToolUseBlock;
        output += `  Tool Call: ${toolUse.name} (ID: ${toolUse.id})\n`;
      } else if (node.type === "context_source") {
        const context = node.content as { source: string, identifier: string };
        output += `  Source: ${context.source}, ID: ${context.identifier}\n`;
      }
    });

    output += "\n[EDGES (Dependencies)]\n";
    this.graph.edges.forEach((edge, index) => {
      output += `\n--- Edge ${index + 1} ---\n`;
      output += `From: ${edge.sourceId} -> To: ${edge.targetId}\n`;
      
      if (edge.contextualLinks.length === 0) {
        output += "  Contextual Links: None provided.\n";
      } else {
        output += "  Contextual Dependencies:\n";
        edge.contextualLinks.forEach((link, linkIndex) => {
          output += `    ${linkIndex + 1}. Context: ${link.contextSource.toUpperCase()} (${link.contextIdentifier})\n`;
          output += `       Description: ${link.description}\n`;
        });
      }
    });

    output += "\n--- Visualization Complete ---";
    return output;
  }
}

export { ContextualDependencyGraphVisualizer };