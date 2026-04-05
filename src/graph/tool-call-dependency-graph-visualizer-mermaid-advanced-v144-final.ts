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

interface DependencyGraphNode {
  id: string;
  type: "tool_call" | "conditional" | "loop" | "start" | "end";
  label: string;
  details: Record<string, any>;
}

interface DependencyGraphEdge {
  from: string;
  to: string;
  type: "precondition" | "fallback" | "success" | "failure";
  condition?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private nodes: DependencyGraphNode[];
  private edges: DependencyGraphEdge[];

  constructor(nodes: DependencyGraphNode[], edges: DependencyGraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private generateNodeDefinition(node: DependencyGraphNode): string {
    let definition = `    ${node.id}["${node.label}"]\n`;

    if (node.type === "conditional") {
      definition += `    ${node.id}:::conditional\n`;
    } else if (node.type === "loop") {
      definition += `    ${node.id}:::loop\n`;
    } else if (node.type === "start") {
      definition += `    ${node.id}:::start\n`;
    } else if (node.type === "end") {
      definition += `    ${node.id}:::end\n`;
    } else if (node.type === "tool_call") {
      const toolUse = node.details.tool_use as ToolUseBlock;
      definition += `    ${node.id}["Tool: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input)}"]:::tool_call\n`;
    }
    return definition;
  }

  private generateEdgeDefinition(edge: DependencyGraphEdge): string {
    let edgeSyntax = `    ${edge.from} -- "${edge.type.toUpperCase()}" --> ${edge.to}`;

    if (edge.condition) {
      edgeSyntax += `\n    ${edge.from} -- "${edge.type.toUpperCase()}: ${edge.condition}" --> ${edge.to}`;
    }
    return edgeSyntax;
  }

  private generateStyleDefinitions(): string {
    return `
%% Styling Definitions
classDef start fill:#aaffaa,stroke:#333,stroke-width:2px;
classDef end fill:#ffaaaa,stroke:#333,stroke-width:2px;
classDef tool_call fill:#cceeff,stroke:#007bff,stroke-width:2px;
classDef conditional fill:#fff3cd,stroke:#ffc107,stroke-width:2px;
classDef loop fill:#d1ecf1,stroke:#17a2b8,stroke-width:2px;
`;
  }

  public renderMermaidGraph(): string {
    let mermaid = "graph TD\n";

    mermaid += "%% Advanced Tool Call Dependency Graph\n";
    mermaid += "%% Nodes\n";
    this.nodes.forEach(node => {
      mermaid += this.generateNodeDefinition(node);
    });

    mermaid += "\n%% Edges\n";
    this.edges.forEach(edge => {
      mermaid += this.generateEdgeDefinition(edge);
    });

    mermaid += "\n%% Apply Classes\n";
    this.nodes.forEach(node => {
      mermaid += `class ${node.id} ${node.type};\n`;
    });

    mermaid += "\n" + this.generateStyleDefinitions();

    return mermaid;
  }
}