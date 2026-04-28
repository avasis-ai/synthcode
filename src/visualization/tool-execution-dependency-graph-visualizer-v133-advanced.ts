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

export interface ResourceConstraint {
  cpuUsage?: number;
  memoryUsage?: number;
  gpuUsage?: number;
}

export interface TemporalMetadata {
  startTime?: number;
  endTime?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  resourceConstraints?: ResourceConstraint;
  temporalMetadata?: TemporalMetadata;
}

export interface GraphEdge {
  source: string;
  target: string;
  resourceConstraints?: ResourceConstraint;
  temporalMetadata?: TemporalMetadata;
}

export interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolExecutionDependencyGraphVisualizerAdvanced {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  private getResourceColor(constraint: ResourceConstraint): string {
    if (!constraint) return "#ccc";
    if (constraint.cpuUsage && constraint.cpuUsage > 0.9) return "red";
    if (constraint.memoryUsage && constraint.memoryUsage > 0.8) return "orange";
    return "green";
  }

  private getTemporalStyle(metadata: TemporalMetadata): {
    strokeDasharray: string;
    opacity: number;
  } {
    if (!metadata || (!metadata.startTime && !metadata.endTime)) {
      return { strokeDasharray: "none", opacity: 1 };
    }
    return { strokeDasharray: "5,5", opacity: 0.7 };
  }

  public renderGraph(): {
    svgContent: string;
    metadata: Record<string, any>;
  } {
    const nodeStyles: Record<string, {
      borderColor: string;
      borderWidth: number;
    }> = {};

    const edgeStyles: Record<string, {
      stroke: string;
      strokeDasharray: string;
      opacity: number;
    }> = {};

    for (const node of this.payload.nodes) {
      const resourceColor = this.getResourceColor(node.resourceConstraints);
      nodeStyles[node.id] = {
        borderColor: resourceColor,
        borderWidth: node.resourceConstraints ? 3 : 1,
      };
    }

    for (const edge of this.payload.edges) {
      const resourceColor = this.getResourceColor(edge.resourceConstraints);
      const temporalStyle = this.getTemporalStyle(edge.temporalMetadata);
      edgeStyles[`${edge.source}-${edge.target}`] = {
        stroke: resourceColor,
        strokeDasharray: temporalStyle.strokeDasharray,
        opacity: temporalStyle.opacity,
      };
    }

    const svgContent = `
      <svg width="100%" height="500px" viewBox="0 0 1000 500">
        <style>
          .node-label { font-family: sans-serif; font-size: 14px; }
          .edge-path { transition: stroke 0.3s, stroke-dasharray 0.3s, opacity 0.3s; }
        </style>
        <!-- Placeholder for actual SVG rendering logic based on coordinates -->
        <g id="nodes">
          ${this.payload.nodes.map(node => `
            <rect x="50" y="${Math.random() * 100 + 100}" width="200" height="50" class="node-box" style="border: 2px solid ${nodeStyles[node.id]?.borderColor || '#ccc'}; border-radius: 8px; fill: #e0f7fa;"/>
            <text x="150" y="${Math.random() * 100 + 125}" class="node-label">${node.label}</text>
          `).join('')}
        </g>
        <g id="edges">
          ${this.payload.edges.map(edge => `
            <path d="M ${Math.random() * 800 + 100} ${Math.random() * 100 + 125} Q ${Math.random() * 800 + 100} ${Math.random() * 100 + 125}, ${Math.random() * 800 + 100} ${Math.random() * 100 + 125}" 
                  class="edge-path" 
                  style="stroke: ${edgeStyles[\`${edge.source}-${edge.target}\`]?.stroke || '#ccc'}; 
                         stroke-dasharray: ${edgeStyles[\`${edge.source}-${edge.target}\`]?.strokeDasharray || 'none'}; 
                         opacity: ${edgeStyles[\`${edge.source}-${edge.target}\`]?.opacity || 1};"/>
          `).join('')}
        </g>
      </svg>
    `;

    return {
      svgContent: svgContent,
      metadata: {
        nodeStyles: nodeStyles,
        edgeStyles: edgeStyles,
      },
    };
  }
}