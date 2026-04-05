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

export interface FlowNode {
  id: string;
  type: "start" | "process" | "condition" | "loop_entry" | "loop_exit" | "end";
  content: string;
  inputs: string[];
  outputs: {
    targetId: string;
    condition?: string;
  }[];
  metadata?: Record<string, any>;
}

export interface DependencyGraph {
  nodes: FlowNode[];
  edges: {
    fromId: string;
    toId: string;
    label: string;
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeDefinition(node: FlowNode): string {
    switch (node.type) {
      case "start":
        return `Start Node: ${node.content}`;
      case "process":
        return `Process: ${node.content}`;
      case "condition":
        return `Condition: ${node.content}`;
      case "loop_entry":
        return `Loop Entry: ${node.content}`;
      case "loop_exit":
        return `Loop Exit: ${node.content}`;
      case "end":
        return `End Node: ${node.content}`;
      default:
        return `Unknown Node Type`;
    }
  }

  private renderSubgraph(nodeId: string, title: string, content: string): string {
    return `subgraph ${title} [${nodeId}]\n    ${content}\nend`;
  }

  private renderNode(node: FlowNode): string {
    let nodeContent = this.getNodeDefinition(node);
    if (node.type === "condition") {
      return `decision_${node.id}["${node.content}"]\n    --${node.metadata?.question || 'Check'}-->\n`;
    }
    return `${node.type}_${node.id}["${node.content}"]\n`;
  }

  private renderEdges(edges: { fromId: string; toId: string; label: string; condition?: string }[]): string {
    let mermaidEdges = "";
    for (const edge of edges) {
      let label = edge.label;
      if (edge.condition) {
        label = `${edge.condition} : ${label}`;
      }
      mermaidEdges += `${edge.fromId} -- "${label}" --> ${edge.toId};\n`;
    }
    return mermaidEdges;
  }

  public renderMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Render Nodes (and wrap complex ones in subgraphs if necessary)
    const nodeDeclarations: string[] = [];
    for (const node of this.graph.nodes) {
      nodeDeclarations.push(this.renderNode(node));
    }
    mermaid += nodeDeclarations.join('\n') + "\n";

    // 2. Render Subgraphs/Complex Structures (Placeholder for advanced grouping)
    // In a real scenario, we'd analyze node relationships to define subgraphs.
    // For this implementation, we'll just add a general structure wrapper.
    mermaid += "%% --- Complex Flow Grouping --- ---\n";
    mermaid += "subgraph Execution Flow\n";
    mermaid += "    A[Start] --> B(Process);\n";
    mermaid += "    B --> C{Condition?};\n";
    mermaid += "    C -- Yes --> D[Loop];\n";
    mermaid += "    C -- No --> E[End];\n";
    mermaid += "end\n";

    // 3. Render Edges
    const edgeDeclarations = this.renderEdges(this.graph.edges);
    mermaid += "\n%% --- Dependencies --- ---\n";
    mermaid += edgeDeclarations;

    return mermaid.trim();
  }
}