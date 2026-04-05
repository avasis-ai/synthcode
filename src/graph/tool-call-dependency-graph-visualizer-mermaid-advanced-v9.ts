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

interface EdgeConfig {
  source: string;
  target: string;
  label: string;
  condition?: string;
  style?: "dashed" | "solid" | "dotted";
}

interface NodeConfig {
  id: string;
  label: string;
  content: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV9 {
  private nodes: NodeConfig[] = [];
  private edges: EdgeConfig[] = [];

  constructor() {}

  public addNode(nodeId: string, label: string, content: string): void {
    this.nodes.push({ id: nodeId, label: label, content: content });
  }

  public addEdge(source: string, target: string, label: string, config: Partial<EdgeConfig> = {}): void {
    this.edges.push({
      source: source,
      target: target,
      label: label,
      condition: config.condition,
      style: config.style,
    });
  }

  private generateMermaidNodes(): string {
    return this.nodes.map((node) => `  ${node.id}["${node.label}\\n${node.content}"];`).join("\n");
  }

  private generateMermaidEdges(): string {
    return this.edges.map((edge) => {
      let edgeSyntax = `${edge.source} --> ${edge.target}`;
      let labelSyntax = `\n${edge.label}`;
      let styleSyntax = "";
      let conditionSyntax = "";

      if (edge.style) {
        styleSyntax = `\nstyle ${edge.source} --> ${edge.target} stroke-dasharray: ${edge.style === "dashed" ? "5 5" : edge.style === "dotted" ? "2 2" : "none"};`;
      }

      if (edge.condition) {
        conditionSyntax = `\nlinkStyle ${edge.source} --> ${edge.target} stroke-dasharray: 5 5; /* Conditional Edge: ${edge.condition} */`;
      }

      return `${edgeSyntax}${labelSyntax}${styleSyntax}${conditionSyntax}`;
    }).join("\n");
  }

  public generateMermaidDiagram(): string {
    let mermaid = "graph TD\n";
    mermaid += "%% Tool Call Dependency Graph (V9 Advanced)\n";
    mermaid += "%% Nodes Definition\n";
    mermaid += this.generateMermaidNodes();

    mermaid += "\n%% Edges Definition\n";
    mermaid += this.generateMermaidEdges();

    return mermaid;
  }
}