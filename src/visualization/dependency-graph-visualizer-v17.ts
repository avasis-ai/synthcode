import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceConstraint {
  resourceName: string;
  requiredCapacity: number;
  startTime: number;
  endTime: number;
}

export interface TemporalEdgeData {
  edgeId: string;
  startTime: number;
  endTime: number;
  resourceConstraints: ResourceConstraint[];
}

export interface DependencyGraphData {
  nodes: Record<string, { id: string; label: string; position: { x: number; y: number } }>;
  edges: Record<string, { sourceId: string; targetId: string; data: TemporalEdgeData }>;
}

export class ToolExecutionDependencyGraphVisualizerV17 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private calculateResourceContention(edges: Record<string, { sourceId: string; targetId: string; data: TemporalEdgeData }>): Map<string, { overlaps: Map<string, { start: number; end: number; count: number }> }> {
    const resourceContention: Map<string, { overlaps: Map<string, { start: number; end: number; count: number }> }> = new Map();

    for (const edgeId in edges) {
      const edge = edges[edgeId];
      for (const constraint of edge.data.resourceConstraints) {
        if (!resourceContention.has(constraint.resourceName)) {
          resourceContention.set(constraint.resourceName, { overlaps: new Map() });
        }
        const resourceMap = resourceContention.get(constraint.resourceName)!.overlaps;
        const resourceKey = `${constraint.startTime}-${constraint.endTime}`;

        if (!resourceMap.has(resourceKey)) {
          resourceMap.set(resourceKey, { start: constraint.startTime, end: constraint.endTime, count: 1 });
        } else {
          const existing = resourceMap.get(resourceKey)!;
          existing.count += 1;
        }
      }
    }
    return resourceContention;
  }

  private renderResourceOverlaps(resourceContention: Map<string, { overlaps: Map<string, { start: number; end: number; count: number }> }>): string {
    let output = "Resource Contention Analysis:\n";
    for (const [resourceName, data] of resourceContention.entries()) {
      output += `  Resource: ${resourceName}\n`;
      const sortedOverlaps = Array.from(data.overlaps.values()).sort((a, b) => a.start - b.start);

      if (sortedOverlaps.length === 0) continue;

      let currentStart = sortedOverlaps[0].start;
      let currentEnd = sortedOverlaps[0].end;
      let currentCount = sortedOverlaps[0].count;

      for (let i = 1; i < sortedOverlaps.length; i++) {
        const next = sortedOverlaps[i];

        if (next.start < currentEnd && next.end > currentStart) {
          // Overlap detected or contiguous
          currentEnd = Math.max(currentEnd, next.end);
          currentStart = Math.min(currentStart, next.start);
          currentCount += next.count;
        } else {
          // Gap detected, report previous segment
          output += `    [${currentStart.toFixed(1)} - ${currentEnd.toFixed(1)}]: Overlap Count = ${currentCount}\n`;
          currentStart = next.start;
          currentEnd = next.end;
          currentCount = next.count;
        }
      }
      // Report last segment
      output += `    [${currentStart.toFixed(1)} - ${currentEnd.toFixed(1)}]: Overlap Count = ${currentCount}\n`;
    }
    return output;
  }

  public visualize(): { visualizationOutput: string; resourceReport: string } {
    // 1. Standard Graph Visualization Placeholder (Simplified)
    let graphOutput = "--- Standard Dependency Graph Visualization ---\n";
    graphOutput += `Nodes: ${Object.keys(this.graphData.nodes).length}\n`;
    graphOutput += `Edges: ${Object.keys(this.graphData.edges).length}\n`;

    // 2. Resource Contention Pass
    const resourceContention = this.calculateResourceContention(this.graphData.edges);
    const resourceReport = this.renderResourceOverlaps(resourceContention);

    // 3. Combine results
    const visualizationOutput = `\n--- Temporal Visualization Summary ---\n${graphOutput}\n\n${resourceReport}`;

    return {
      visualizationOutput: visualizationOutput,
      resourceReport: resourceReport
    };
  }
}