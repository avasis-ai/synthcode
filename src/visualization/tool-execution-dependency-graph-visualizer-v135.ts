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

export interface ToolNodeData {
  id: string;
  name: string;
  description: string;
  startTime?: number;
  endTime?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
  };
}

export interface ToolEdgeData {
  sourceId: string;
  targetId: string;
  dependencyType: "sequential" | "conditional" | "parallel";
  timeWindow?: {
    start: number;
    end: number;
  };
  resourceFlow?: {
    requiredResource: string;
    amount: number;
  };
}

export interface ToolExecutionGraphPayload {
  nodes: ToolNodeData[];
  edges: ToolEdgeData[];
  metadata: {
    graphVersion: string;
    timestamp: number;
  };
}

export class ToolExecutionDependencyGraphVisualizerV135 {
  private payload: ToolExecutionGraphPayload;

  constructor(payload: ToolExecutionGraphPayload) {
    this.payload = payload;
  }

  public visualize(): {
    svgContent: string;
    metadata: Record<string, any>;
  } {
    const { nodes, edges, metadata } = this.payload;

    const nodeVisuals = nodes.map(node => {
      let borderStyle = "none";
      let content = `<rect x=\"${node.x}\" y=\"${node.y}\" width=\"${node.width}\" height=\"${node.height}\\" fill=\"#333\" rx=\"5\" />`;
      let title = `Node: ${node.name}\nDescription: ${node.description}`;

      if (node.resourceUsage) {
        borderStyle = `stroke: ${node.resourceUsage.cpu > 0.8 ? 'red' : 'green'}; stroke-width: ${node.resourceUsage.cpu * 2 + 1}px;`;
        title += `\nResource Usage: CPU=${node.resourceUsage.cpu.toFixed(2)}, Memory=${node.resourceUsage.memory.toFixed(2)}`;
      }

      if (node.startTime && node.endTime) {
        const duration = node.endTime - node.startTime;
        const timeIndicator = `<text x=\"${node.x + node.width / 2}\" y=\"${node.y - 15}\" text-anchor=\"middle\" fill=\"#007bff\">Time: ${duration.toFixed(1)}s</text>`;
        title += `\nTime Window: ${node.startTime.toFixed(1)}s to ${node.endTime.toFixed(1)}s`;
      }

      return {
        element: `${content} style=\"${borderStyle}\"`,
        title: title,
      };
    });

    const edgeVisuals = edges.map(edge => {
      let stroke = "gray";
      let strokeWidth = 2;
      let label = `${edge.dependencyType}`;

      if (edge.resourceFlow) {
        stroke = `rgba(255, 165, 0, ${edge.resourceFlow.amount / 10})`;
        strokeWidth = Math.max(2, Math.ceil(edge.resourceFlow.amount / 5));
        label += ` (Flow: ${edge.resourceFlow.amount.toFixed(1)} ${edge.resourceFlow.requiredResource})`;
      }

      if (edge.timeWindow) {
        const duration = edge.timeWindow.end - edge.timeWindow.start;
        label += ` (Duration: ${duration.toFixed(1)}s)`;
      }

      return {
        element: `<path d=\"M ${edge.sourceId} ${edge.sourceY} C ${edge.sourceX + 50} ${edge.sourceY - 50}, ${edge.targetX - 50} ${edge.targetY + 50}, ${edge.targetId} ${edge.targetY}\" stroke=\"${stroke}\" stroke-width=\"${strokeWidth}\" fill=\"none\" />`,
        label: label,
      };
    });

    const svgContent = `
      <svg width=\"1000\" height=\"600\" viewBox=\"0 0 1000 600\" xmlns=\"http://www.w3.org/2000/svg\">
        <g class=\"nodes\">
          ${nodeVisuals.map(v => v.element).join('')}
        </g>
        <g class=\"edges\">
          ${edgeVisuals.map(v => v.element).join('')}
        </g>
        <text x=\"10\" y=\"20\" font-size=\"14\">Graph Version: ${metadata.graphVersion}</text>
        <text x=\"10\" y=\"40\" font-size=\"12\" fill=\"#666\">Generated At: ${new Date(metadata.timestamp).toLocaleTimeString()}</text>
      </svg>
    `;

    return {
      svgContent: svgContent,
      metadata: {
        graphVersion: metadata.graphVersion,
        generationTime: metadata.timestamp,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };
  }
}