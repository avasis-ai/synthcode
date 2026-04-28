import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface NodeMetadata {
  id: string;
  label: string;
  type: "tool" | "step";
  resourcesUsed?: {
    cpu: number;
    memoryMb: number;
  };
  startTimeMs: number;
  endTimeMs: number;
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  dependencyType: "data" | "control";
  dataFlow?: string;
}

export interface GraphPayload {
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
}

export class UnifiedExecutionDependencyGraphVisualizer {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  private generateMermaidGraph(nodes: NodeMetadata[], edges: EdgeMetadata[]): string {
    let mermaid = "graph TD;\n";

    const nodeDefinitions: Record<string, string> = {};
    const nodeStyles: Record<string, string> = {};

    nodes.forEach(node => {
      let style = "";
      if (node.type === "tool") {
        style = "fill:#ccf,stroke:#333,stroke-width:2px";
      } else {
        style = "fill:#cfc,stroke:#333,stroke-width:2px";
      }
      nodeDefinitions[node.id] = `${node.label}(${node.label})`;
      nodeStyles[node.id] = style;
    });

    Object.keys(nodeDefinitions).forEach(id => {
      mermaid += `${id}["${nodeDefinitions[id]}"]:::${node.type};\n`;
    });

    mermaid += "\n";

    edges.forEach(edge => {
      let link = `${edge.sourceId} -->|${edge.dependencyType}| ${edge.targetId};\n`;
      mermaid += link;
    });

    return mermaid;
  }

  public generateVisualizationData(): {
    mermaidDiagram: string;
    summary: string;
  } {
    const mermaidDiagram = this.generateMermaidGraph(this.payload.nodes, this.payload.edges);

    const totalNodes = this.payload.nodes.length;
    const totalEdges = this.payload.edges.length;

    let summary = `Visualization Summary:\n`;
    summary += `Total Nodes (Tools/Steps): ${totalNodes}\n`;
    summary += `Total Dependencies (Edges): ${totalEdges}\n`;

    if (totalNodes > 0) {
      const avgResources = this.payload.nodes.reduce((acc, node) => {
        if (node.resourcesUsed) {
          acc.cpu += node.resourcesUsed.cpu;
          acc.memoryMb += node.resourcesUsed.memoryMb;
        }
        return acc;
      }, { cpu: 0, memoryMb: 0});

      summary += `Average Resource Usage (Estimated): ${Math.round(avgResources.cpu / totalNodes)} CPU, ${Math.round(avgResources.memoryMb / totalNodes)} MB RAM.\n`;
    }

    return {
      mermaidDiagram: mermaidDiagram,
      summary: summary,
    };
  }
}