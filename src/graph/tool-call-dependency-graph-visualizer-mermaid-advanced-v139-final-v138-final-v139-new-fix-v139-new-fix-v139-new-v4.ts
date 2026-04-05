import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface AdvancedNode {
  id: string;
  type: "user" | "assistant" | "tool";
  content: ContentBlock[];
  dependencies: {
    fromId: string;
    toId: string;
    relationship: "calls" | "follows" | "parallel";
    condition?: string;
  }[];
}

export interface AdvancedGraph {
  nodes: AdvancedNode[];
  edges: {
    fromId: string;
    toId: string;
    relationship: "calls" | "follows" | "parallel";
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private graph: AdvancedGraph;

  constructor(graph: AdvancedGraph) {
    this.graph = graph;
  }

  private getNodeMermaidId(node: AdvancedNode): string {
    const baseId = node.id.replace(/[^a-zA-Z0-9]/g, "_");
    if (node.type === "user") return `User_${baseId}`;
    if (node.type === "assistant") return `Assistant_${baseId}`;
    if (node.type === "tool") return `Tool_${baseId}`;
    return `Node_${baseId}`;
  }

  private renderNodeContent(node: AdvancedNode): string {
    let content = "";
    for (const block of node.content) {
      if (block.type === "text") {
        content += `Text: ${block.text.substring(0, 50)}...`;
      } else if (block.type === "tool_use") {
        content += `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
      } else if (block.type === "thinking") {
        content += `Thinking: ${block.thinking.substring(0, 50)}...`;
      }
    }
    return content;
  }

  private renderSubgraph(node: AdvancedNode): string {
    const mermaidId = this.getNodeMermaidId(node);
    let content = `subgraph ${mermaidId} [${node.type} node]\n`;
    content += `    ${mermaidId} -- "${node.type} content" --> ${mermaidId}_content\n`;
    content += `    ${mermaidId}_content[${this.renderNodeContent(node)}]\n`;
    return content;
  }

  private renderEdges(edges: AdvancedGraph["edges"]): string {
    let mermaid = "";
    for (const edge of edges) {
      const fromId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.fromId)!);
      const toId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.toId)!);
      let relationship = edge.relationship === "calls" ? "-->" : (edge.relationship === "follows" ? "-->" : "-->");
      let linkStyle = "";

      if (edge.relationship === "parallel") {
        mermaid += `    ${fromId} -- "Parallel Branch" --> ${toId}:::parallel\n`;
        linkStyle = `linkStyle ${fromId}-->${toId} stroke-width:2px,stroke:blue;`;
      } else if (edge.condition) {
        mermaid += `    ${fromId} -- "${edge.condition}" --> ${toId}:::conditional\n`;
        linkStyle = `linkStyle ${fromId}-->${toId} stroke-dasharray: 5 5,stroke:orange;`;
      } else {
        mermaid += `    ${fromId} -- "${edge.relationship}" --> ${toId}\n`;
      }
    }
    return `${mermaid}\n${linkStyle ? linkStyle : ""}`;
  }

  public renderMermaidGraph(): string {
    let mermaid = "graph TD\n";
    let subgraphDeclarations = "";
    let edgeDeclarations = "";

    for (const node of this.graph.nodes) {
      subgraphDeclarations += this.renderSubgraph(node);
    }

    edgeDeclarations = this.renderEdges(this.graph.edges);

    return `${subgraphDeclarations}\n${edgeDeclarations}`;
  }
}