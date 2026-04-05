import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface AdvancedGraphOptions {
  customCssClasses?: Record<string, string>;
  subgraphDefinitions?: {
    id: string;
    title: string;
    nodes: string[];
    edges: string[];
  }[];
}

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  label: string;
  details: string;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  label: string;
}

export class ToolCallDependencyGraphVisualizer {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      customCssClasses: {},
      subgraphDefinitions: [],
      ...options,
    };
  }

  private generateNodeDefinition(node: GraphNode): string {
    const baseClass = `node-${node.type}`;
    const customClass = this.options.customCssClasses?.[baseClass] || "";
    return `    ${node.id}["${node.label}\\n(${node.details})"]:::${baseClass}${customClass}`;
  }

  private generateEdgeDefinition(edge: GraphEdge): string {
    return `    ${edge.fromId} -->|${edge.label}| ${edge.toId};`;
  }

  private generateSubgraphDefinition(subgraph: {
    id: string;
    title: string;
    nodes: string[];
    edges: string[];
  }): string {
    let subgraphContent = `subgraph ${subgraph.id} "${subgraph.title}"\n`;
    subgraphContent += subgraph.nodes.join('\n');
    subgraphContent += '\n';
    subgraphContent += subgraph.edges.join('\n');
    subgraphContent += '\nend';
    return subgraphContent;
  }

  public render(nodes: GraphNode[], edges: GraphEdge[], graphContext: {
    messages: Message[];
    toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[];
  }): string {
    let mermaidString = "graph TD\n";

    // 1. Define custom styles/classes (Conceptual - actual styling handled by CSS/Mermaid theme)
    mermaidString += "%% Custom Styles/Classes Definition (Conceptual)\n";
    mermaidString += "classDef user fill:#aaffaa,stroke:#333,stroke-width:2px;\n";
    mermaidString += "classDef assistant fill:#aaaaff,stroke:#333,stroke-width:2px;\n";
    mermaidString += "classDef tool fill:#ffddaa,stroke:#333,stroke-width:2px;\n\n";

    // 2. Generate Nodes
    const nodeDefinitions = nodes.map(this.generateNodeDefinition).join('\n');
    mermaidString += "%% Nodes\n" + nodeDefinitions + "\n\n";

    // 3. Generate Edges
    const edgeDefinitions = edges.map(this.generateEdgeDefinition).join('\n');
    mermaidString += "%% Edges\n" + edgeDefinitions + "\n\n";

    // 4. Generate Subgraphs (Advanced Feature)
    if (this.options.subgraphDefinitions && this.options.subgraphDefinitions.length > 0) {
      const subgraphDefinitions = this.options.subgraphDefinitions.map(this.generateSubgraphDefinition).join('\n');
      mermaidString += "%% Subgraphs\n" + subgraphDefinitions + "\n";
    }

    return `%% Mermaid Diagram for Tool Call Dependency Graph\n${mermaidString}`;
  }
}

export function generateToolCallDependencyGraphMermaid(
  nodes: GraphNode[],
  edges: GraphEdge[],
  graphContext: {
    messages: Message[];
    toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[];
  },
  options: AdvancedGraphOptions = {}
): string {
  const visualizer = new ToolCallDependencyGraphVisualizer({
    customCssClasses: {
      "node-user": "user-style",
      "node-assistant": "assistant-style",
      "node-tool": "tool-style",
    },
    subgraphDefinitions: options.subgraphDefinitions,
  });

  return visualizer.render(nodes, edges, graphContext);
}