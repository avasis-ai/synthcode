import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpu_cores: number;
  memory_gb: number;
  network_throughput_mbps: number;
}

export interface TemporalConstraint {
  start_time_ms: number;
  duration_ms: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "tool_execution" | "user_input" | "system_process";
  metadata: Record<string, unknown>;
  resource_usage: ResourceUsage;
  temporal_constraint: TemporalConstraint;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  dependency_type: "sequential" | "conditional" | "parallel";
  weight: number;
  resource_flow: {
    cpu_cores: number;
    memory_gb: number;
  };
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type VisualizationPayload = {
  layout: {
    nodePositions: Record<string, { x: number; y: number }>;
    edgePaths: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  };
  visualizationConfig: {
    nodeStyles: Record<string, { color: string; size: number }>;
    edgeStyles: Record<string, { stroke: string; thickness: number }>;
  };
}

export function visualizeToolExecutionDependencyGraph(data: DependencyGraphData): VisualizationPayload {
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const edgePaths: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
  const nodeStyles: Record<string, { color: string; size: number }> = {};
  const edgeStyles: Record<string, { stroke: string; thickness: number }> = {};

  // Simple deterministic layout simulation (e.g., circular or layered)
  // In a real implementation, this would use force-directed layout (like D3-force)
  const calculatePositions = (nodes: GraphNode[]): Record<string, { x: number; y: number }> => {
    const positions: Record<string, { x: number; y: number }> = {};
    const centerX = 500;
    const centerY = 500;
    const radius = 300;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    return positions;
  };

  const positions = calculatePositions(data.nodes);

  // Map edges to paths using calculated positions
  data.edges.forEach(edge => {
    const fromPos = positions[edge.fromNodeId] || { x: 0, y: 0 };
    const toPos = positions[edge.toNodeId] || { x: 0, y: 0 };
    edgePaths.push({ from: fromPos, to: toPos });
  });

  // Determine styles based on node type and edge dependency type
  data.nodes.forEach(node => {
    let color: string;
    let size: number;
    switch (node.type) {
      case "tool_execution":
        color = "#4CAF50";
        size = 20;
        break;
      case "user_input":
        color = "#2196F3";
        size = 18;
        break;
      case "system_process":
        color = "#FF9800";
        size = 15;
        break;
      default:
        color = "#9E9E9E";
        size = 12;
    }
    nodeStyles[node.id] = { color, size };
  });

  data.edges.forEach(edge => {
    let stroke: string;
    let thickness: number;
    switch (edge.dependency_type) {
      case "sequential":
        stroke = "#333";
        thickness = 2;
        break;
      case "conditional":
        stroke = "#F44336";
        thickness = 1.5;
        break;
      case "parallel":
        stroke = "#FFC107";
        thickness = 2.5;
        break;
      default:
        stroke = "#607D8B";
        thickness = 1;
    }
    edgeStyles[edge.dependency_type] = { stroke, thickness };
  });

  return {
    layout: {
      nodePositions: positions,
      edgePaths: edgePaths,
    },
    visualizationConfig: {
      nodeStyles: nodeStyles,
      edgeStyles: edgeStyles,
    },
  };
}