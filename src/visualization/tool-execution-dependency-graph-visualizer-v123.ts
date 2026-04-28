import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "calls" | "uses" | "waits_for";
  temporalConstraint?: {
    startTime: number;
    endTime: number;
    durationMs: number;
  };
  resourceUsage?: {
    resourceName: string;
    allocatedUnits: number;
    peakUsage: number;
  };
}

export interface DependencyNode {
  id: string;
  type: "tool_call" | "tool_result" | "user_input" | "system_state";
  label: string;
  metadata: Record<string, unknown>;
  dependencies: string[];
}

export interface EnrichedGraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV123 {
  private graphData: EnrichedGraphPayload | null = null;

  constructor() {}

  public setGraphData(payload: EnrichedGraphPayload): void {
    this.graphData = payload;
  }

  public renderGraph(): string {
    if (!this.graphData) {
      return "Error: Graph data has not been set. Call setGraphData first.";
    }

    const { nodes, edges } = this.graphData;

    let mermaidDefinition = "graph TD;\n";

    // 1. Define Nodes
    nodes.forEach(node => {
      let nodeId = node.id;
      let label = node.label;
      let style = "";

      if (node.type === "tool_call") {
        style = "fill:#ADD8E6,stroke:#333,stroke-width:2px";
      } else if (node.type === "tool_result") {
        style = "fill:#90EE90,stroke:#333,stroke-width:2px";
      } else if (node.type === "user_input") {
        style = "fill:#FFD700,stroke:#333,stroke-width:2px";
      } else if (node.type === "system_state") {
        style = "fill:#D3D3D3,stroke:#333,stroke-width:2px";
      }

      mermaidDefinition += `    ${nodeId}["${label}"]:::${node.type};\n`;
    });

    // 2. Define Edges (Dependencies)
    edges.forEach(edge => {
      let edgeLabel = `${edge.dependencyType}`;
      let constraints = "";

      if (edge.temporalConstraint) {
        constraints = ` (Time: ${edge.temporalConstraint.durationMs}ms)`;
      }
      if (edge.resourceUsage) {
        constraints += ` | Resource: ${edge.resourceUsage.resourceName}`;
      }

      mermaidDefinition += `    ${edge.sourceId} -- "${edge.dependencyType}"${constraints} --> ${edge.targetId};\n`;
    });

    // 3. Define Styles (Classes)
    mermaidDefinition += "\n%% Styles\n";
    mermaidDefinition += "classDef tool_call fill:#ADD8E6,stroke:#333,stroke-width:2px;\n";
    mermaidDefinition += "classDef tool_result fill:#90EE90,stroke:#333,stroke-width:2px;\n";
    mermaidDefinition += "classDef user_input fill:#FFD700,stroke:#333,stroke-width:2px;\n";
    mermaidDefinition += "classDef system_state fill:#D3D3D3,stroke:#333,stroke-width:2px;\n";

    return mermaidDefinition;
  }
}