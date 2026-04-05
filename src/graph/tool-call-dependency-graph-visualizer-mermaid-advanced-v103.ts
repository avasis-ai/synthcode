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

export interface DependencyNode {
  id: string;
  type: "user" | "assistant" | "tool_result" | "conditional_start" | "end";
  content: string;
  metadata?: Record<string, any>;
}

export interface ConditionalEdge {
  sourceId: string;
  condition: string;
  targetId: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: ConditionalEdge[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV103 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeLabel(node: DependencyNode): string {
    switch (node.type) {
      case "user":
        return `User: ${node.content.substring(0, 30)}...`;
      case "assistant":
        return `Assistant: ${node.content.substring(0, 30)}...`;
      case "tool_result":
        return `Tool Result: ${node.content.substring(0, 30)}...`;
      case "conditional_start":
        return `Condition Check: ${node.content}`;
      case "end":
        return "End State";
      default:
        return `Node ${node.id}`;
    }
  }

  private generateMermaidGraph(graph: DependencyGraph): string {
    let mermaid = "graph TD\n";
    mermaid += "%% Tool Call Dependency Graph Visualization (Advanced)\n";

    // 1. Define Nodes
    const nodeDefinitions: Record<string, string> = {};
    graph.nodes.forEach(node => {
      const label = this.getNodeLabel(node);
      nodeDefinitions[node.id] = `${node.id}["${label}"]`;
    });

    // 2. Define Edges (Including Conditional Logic)
    graph.edges.forEach(edge => {
      const { sourceId, condition, targetId } = edge;
      // Use the '-->|Condition|' syntax for conditional edges
      mermaid += `${sourceId} -->|${condition}| ${targetId};\n`;
    });

    // 3. Structure and Styling (Using Subgraphs for clarity)
    mermaid += "\n%% Subgraphs for Flow Grouping\n";
    
    // Simple grouping based on node type for visual separation
    const userNodes = graph.nodes.filter(n => n.type === "user").map(n => n.id);
    if (userNodes.length > 0) {
        mermaid += "subgraph User Input\n";
        userNodes.forEach(id => mermaid += `${id}\n`);
        mermaid += "end\n";
    }

    const toolNodes = graph.nodes.filter(n => n.type === "tool_result").map(n => n.id);
    if (toolNodes.length > 0) {
        mermaid += "subgraph Tool Execution\n";
        toolNodes.forEach(id => mermaid += `${id}\n`);
        mermaid += "end\n";
    }

    const conditionNodes = graph.nodes.filter(n => n.type === "conditional_start").map(n => n.id);
    if (conditionNodes.length > 0) {
        mermaid += "subgraph Decision Point\n";
        conditionNodes.forEach(id => mermaid += `${id}\n`);
        mermaid += "end\n";
    }

    // Final structure assembly
    return mermaid.trim();
  }

  public renderMermaid(mermaidString: string): string {
    return `\`\`\`mermaid\n${mermaidString}\n\`\`\``;
  }
}