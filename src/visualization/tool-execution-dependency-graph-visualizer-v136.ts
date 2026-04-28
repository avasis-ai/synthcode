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

export interface TemporalResourceConstraint {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface DependencyNode {
  id: string;
  label: string;
  constraints?: TemporalResourceConstraint[];
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  constraints?: TemporalResourceConstraint[];
}

export interface GraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV136 {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  public visualize(): string {
    const nodeStyles = this.generateNodeStyles();
    const edgeStyles = this.generateEdgeStyles();

    let output = `--- Tool Execution Dependency Graph Visualization (V136) ---\\n`;
    output += `Nodes Rendered: ${this.payload.nodes.length}\\n`;
    output += `Edges Rendered: ${this.payload.edges.length}\\n\\n`;

    output += "--- Node Styles (Conceptual Rendering) ---\\n";
    this.payload.nodes.forEach((node, index) => {
      output += `Node ${index} (${node.id}): ${node.label}\\n`;
      if (node.constraints && node.constraints.length > 0) {
        output += `  Temporal/Resource Constraints Applied: ${node.constraints.length} set(s).\\n`;
        node.constraints.forEach((c, i) => {
          output += `    Constraint ${i}: Time [${c.startTime}-${c.endTime}], Resources: ${JSON.stringify(c.resourceUsage)}.\\n`;
        });
      } else {
        output += "  No specific temporal/resource constraints found.\\n";
      }
    });

    output += "\\n--- Edge Styles (Conceptual Rendering) ---\\n";
    this.payload.edges.forEach((edge, index) => {
      output += `Edge ${index} (${edge.sourceId} -> ${edge.targetId}):\\n`;
      if (edge.constraints && edge.constraints.length > 0) {
        output += `  Temporal/Resource Constraints Applied: ${edge.constraints.length} set(s).\\n`;
        edge.constraints.forEach((c, i) => {
          output += `    Constraint ${i}: Time [${c.startTime}-${c.endTime}], Resources: ${JSON.stringify(c.resourceUsage)}.\\n`;
        });
      } else {
        output += "  No specific temporal/resource constraints found.\\n";
      }
    });

    return output;
  }

  private generateNodeStyles(): Record<string, any> {
    const styles: Record<string, any> = {};
    this.payload.nodes.forEach((node, index) => {
      let style = {
        id: node.id,
        label: node.label,
        baseColor: "gray",
        thickness: 1,
        temporalOverlays: [],
        resourceIntensity: 0,
      };

      if (node.constraints) {
        style.temporalOverlays = node.constraints.map(c => ({
          start: c.startTime,
          end: c.endTime,
          resource: c.resourceUsage,
        }));
        // Simple aggregation for resource intensity visualization
        let totalResource = 0;
        for (const res in c.resourceUsage) {
            totalResource += c.resourceUsage[res];
        }
        style.resourceIntensity = totalResource;
      }
      styles[node.id] = style;
    });
    return styles;
  }

  private generateEdgeStyles(): Record<string, any> {
    const styles: Record<string, any> = {};
    this.payload.edges.forEach((edge, index) => {
      let style = {
        source: edge.sourceId,
        target: edge.targetId,
        baseColor: "blue",
        thickness: 2,
        temporalOverlays: [],
        resourceIntensity: 0,
      };

      if (edge.constraints) {
        style.temporalOverlays = edge.constraints.map(c => ({
          start: c.startTime,
          end: c.endTime,
          resource: c.resourceUsage,
        }));
        let totalResource = 0;
        for (const res in c.resourceUsage) {
            totalResource += c.resourceUsage[res];
        }
        style.resourceIntensity = totalResource;
      }
      styles[`${edge.sourceId}->${edge.targetId}`] = style;
    });
    return styles;
  }
}