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

export interface ToolCallDependencyGraphNode {
  id: string;
  type: "start" | "tool_call" | "conditional" | "end";
  metadata: Record<string, any>;
  connections: {
    from: string;
    to: string;
    condition?: string;
  }[];
}

export interface ToolCallDependencyGraph {
  nodes: ToolCallDependencyGraphNode[];
  connections: {
    from: string;
    to: string;
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV151 {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private generateNodeDefinition(node: ToolCallDependencyGraphNode): string {
    switch (node.type) {
      case "start":
        return `A[Start: ${node.metadata.description || "Execution Start"}]`;
      case "tool_call":
        const tool = node.metadata.toolName || "Unknown Tool";
        const inputDisplay = JSON.stringify(node.metadata.input || {});
        return `T${node.id}["Tool Call: ${tool}\\nInput: ${inputDisplay.substring(0, 30)}..."]`;
      case "conditional":
        const conditionDesc = node.metadata.condition || "Condition Check";
        return `C${node.id}["Decision: ${conditionDesc}"]`;
      case "end":
        return `E[End: ${node.metadata.description || "Execution End"}]`;
      default:
        return `N${node.id}["Unknown Node"]`;
    }
  }

  private generateConnectionDefinition(connection: {
    from: string;
    to: string;
    condition?: string;
  }): string {
    let link = `${connection.from} --> ${connection.to}`;
    if (connection.condition) {
      link += `\n--${connection.condition}-->`;
    }
    return link;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Define all nodes
    const nodeDefinitions: string[] = this.graph.nodes.map(this.generateNodeDefinition);
    mermaid += nodeDefinitions.join('\n') + "\n\n";

    // 2. Define all connections
    const connectionDefinitions: string[] = this.graph.connections.map(this.generateConnectionDefinition);
    mermaid += connectionDefinitions.join('\n');

    // 3. Wrap in a subgraph for advanced grouping (optional but good practice)
    mermaid = `subgraph Tool Call Dependency Flow\n${mermaid}\nend\n`;

    return mermaid;
  }
}