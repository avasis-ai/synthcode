import { Message, ToolResultMessage } from "./types";

export class ToolCallDependencyGraphVisualizer {
  private graph: {
    nodes: string[];
    edges: { from: string; to: string; label: string };
  };

  constructor(graph: {
    nodes: string[];
    edges: { from: string; to: string; label: string };
  }) {
    this.graph = graph;
  }

  private getNodeStyle(result: 'SUCCESS' | 'FAILED' | 'SKIPPED'): string {
    switch (result) {
      case 'SUCCESS':
        return "style fill:#d4edda,stroke:#c3e6cb,stroke-width:2px";
      case 'FAILED':
        return "style fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px";
      case 'SKIPPED':
        return "style fill:#fff3cd,stroke:#ffeeba,stroke-width:2px";
      default:
        return "";
    }
  }

  private getEdgeStyle(result: 'SUCCESS' | 'FAILED' | 'SKIPPED'): string {
    switch (result) {
      case 'SUCCESS':
        return "stroke:#28a745,stroke-dasharray:0";
      case 'FAILED':
        return "stroke:#dc3545,stroke-dasharray:5,2";
      case 'SKIPPED':
        return "stroke:#ffc107,stroke-dasharray:3,3";
      default:
        return "stroke:#6c757d,stroke-dasharray:0";
    }
  }

  public visualizeMermaidAdvanced(
    executionResults: Record<string, 'SUCCESS' | 'FAILED' | 'SKIPPED'>,
  ): string {
    const { nodes, edges } = this.graph;
    let mermaid = "graph TD;\n";

    // 1. Node Definitions with Styling
    nodes.forEach((nodeId) => {
      const result = executionResults[nodeId] || 'SKIPPED';
      const style = this.getNodeStyle(result);
      mermaid += `${nodeId}["${nodeId}"]${style};\n`;
    });

    // 2. Edge Definitions with Styling and Labels
    edges.forEach((edge) => {
      const result = executionResults[edge.to] ? executionResults[edge.to] : 'SKIPPED';
      const edgeStyle = this.getEdgeStyle(result);

      mermaid += `${edge.from} -- "${edge.label}" --> ${edge.to}${edgeStyle};\n`;
    });

    // 3. Graph Configuration (Optional but good practice)
    mermaid += "\n%% Styling Legend\n";
    mermaid += "classDef success fill:#d4edda,stroke:#c3e6cb,stroke-width:2px;\n";
    mermaid += "classDef failed fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px;\n";
    mermaid += "classDef skipped fill:#fff3cd,stroke:#ffeeba,stroke-width:2px;\n";

    return mermaid;
  }
}