import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpuUtilization: number; // 0.0 to 1.0
  memoryUsageMB: number;
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ToolExecutionNode {
  toolName: string;
  toolUseId: string;
  startTimeMs: number;
  endTimeMs: number;
  resourceUsage: ResourceUsage;
  input: Record<string, unknown>;
}

export interface DependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  durationMs: number;
  dependencyType: "sequential" | "parallel" | "conditional";
}

export interface VisualizationData {
  nodes: ToolExecutionNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private data: VisualizationData;
  private resourceThresholds: { cpu: number; memory: number };
  private timeFilter: TimeWindow;

  constructor(initialData: VisualizationData, initialResourceThresholds: { cpu: number; memory: number }, initialTimeFilter: TimeWindow) {
    this.data = initialData;
    this.resourceThresholds = initialResourceThresholds;
    this.timeFilter = initialTimeFilter;
  }

  private filterData(data: VisualizationData): VisualizationData {
    const filteredNodes = data.nodes.filter(node =>
      node.resourceUsage.cpuUtilization <= this.resourceThresholds.cpu &&
      node.resourceUsage.memoryUsageMB <= this.resourceThresholds.memory
    );

    const filteredEdges = data.edges.filter(edge => {
      // Simple check: if source or target falls outside time window, filter edge
      const sourceNode = data.nodes.find(n => n.toolUseId === edge.sourceNodeId);
      const targetNode = data.nodes.find(n => n.toolUseId === edge.targetNodeId);

      if (!sourceNode || !targetNode) return false;

      const passesTime = (
        Math.max(sourceNode.startTimeMs, targetNode.startTimeMs) >= this.timeFilter.startTimeMs &&
        Math.min(sourceNode.endTimeMs, targetNode.endTimeMs) <= this.timeFilter.endTimeMs
      );
      return passesTime;
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }

  public updateFilters(cpuThreshold: number, memoryThreshold: number, timeStartMs: number, timeEndMs: number): void {
    this.resourceThresholds = { cpu: cpuThreshold, memory: memoryThreshold };
    this.timeFilter = { startTimeMs: timeStartMs, endTimeMs: timeEndMs };
  }

  public getFilteredVisualizationData(): VisualizationData {
    return this.filterData(this.data);
  }

  public renderVisualization(data: VisualizationData): void {
    console.log("--- Rendering Dependency Graph ---");
    console.log(`Nodes to render: ${data.nodes.length}`);
    console.log(`Edges to render: ${data.edges.length}`);

    data.nodes.forEach(node => {
      const saturation = Math.max(node.resourceUsage.cpuUtilization, node.resourceUsage.memoryUsageMB / 100);
      const color = saturation > 0.9 ? "RED" : saturation > 0.6 ? "YELLOW" : "GREEN";
      console.log(`[Node] ${node.toolName} (${node.toolUseId}): Color=${color}, Duration=${node.endTimeMs - node.startTimeMs}ms`);
    });

    data.edges.forEach(edge => {
      console.log(`[Edge] ${edge.sourceNodeId} -> ${edge.targetNodeId}: Thickness=${Math.min(1, edge.durationMs / 1000).toFixed(2)}`);
    });
  }
}