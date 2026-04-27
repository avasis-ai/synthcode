import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "sequential" | "parallel" | "conditional";
  metadata?: {
    latencyMs?: number;
    resourceUsage?: {
      resourceName: string;
      maxCapacity: number;
      requiredAmount: number;
    }[];
    temporalConstraint?: {
      startTime?: number;
      endTime?: number;
      constraintType: "must_finish_before" | "must_start_after";
    };
  };
}

export interface DependencyNode {
  id: string;
  type: "tool_call" | "user_input" | "system_event";
  name: string;
  metadata: Record<string, unknown>;
}

export interface EnrichedGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV105 {
  private graphData: EnrichedGraphData;

  constructor(initialData: EnrichedGraphData) {
    this.graphData = initialData;
  }

  private validateGraphData(data: EnrichedGraphData): boolean {
    if (!data || !data.nodes || !data.edges) {
      return false;
    }
    return true;
  }

  private processTemporalConstraints(edges: DependencyEdge[]): {
    temporalMarkers: {
      edgeId: string;
      start: number;
      end: number;
      constraint: "must_finish_before" | "must_start_after";
    }[];
  } {
    const markers: {
      edgeId: string;
      start: number;
      end: number;
      constraint: "must_finish_before" | "must_start_after";
    }[] = [];

    for (const edge of edges) {
      const meta = edge.metadata;
      if (meta?.temporalConstraint) {
        const tc = meta.temporalConstraint;
        if (tc.startTime !== undefined && tc.endTime !== undefined) {
          markers.push({
            edgeId: `${edge.sourceId}->${edge.targetId}`,
            start: tc.startTime,
            end: tc.endTime,
            constraint: "must_finish_before",
          });
        } else if (tc.constraintType) {
          markers.push({
            edgeId: `${edge.sourceId}->${edge.targetId}`,
            start: tc.startTime || 0,
            end: tc.endTime || 0,
            constraint: tc.constraintType === "must_finish_before" ? "must_finish_before" : "must_start_after",
          });
        }
      }
    }
    return { temporalMarkers: markers };
  }

  private processResourceContention(edges: DependencyEdge[]): {
    bottlenecks: {
      edgeId: string;
      resourceName: string;
      contentionLevel: number;
    }[];
  } {
    const bottlenecks: {
      edgeId: string;
      resourceName: string;
      contentionLevel: number;
    }[] = [];

    const resourceMap = new Map<string, { totalRequired: number; count: number }>();

    for (const edge of edges) {
      const meta = edge.metadata;
      if (meta?.resourceUsage) {
        for (const usage of meta.resourceUsage) {
          const key = `${usage.resourceName}`;
          if (!resourceMap.has(key)) {
            resourceMap.set(key, { totalRequired: 0, count: 0 });
          }
          const current = resourceMap.get(key)!;
          current.totalRequired += usage.requiredAmount;
          current.count += 1;
          resourceMap.set(key, current);
        }
      }
    }

    for (const [resourceName, data] of resourceMap.entries()) {
      // Simple heuristic: Contention = Total Required / (Available Capacity * Number of uses)
      // Assuming a baseline capacity check for demonstration.
      const assumedCapacity = 100;
      const contention = data.totalRequired / (assumedCapacity * data.count);
      if (contention > 1.0) {
        // Assigning this bottleneck to all edges using this resource for visualization purposes
        for (const edge of edges) {
          const meta = edge.metadata;
          if (meta?.resourceUsage?.some(u => u.resourceName === resourceName)) {
            bottlenecks.push({
              edgeId: `${edge.sourceId}->${edge.targetId}`,
              resourceName: resourceName,
              contentionLevel: Math.min(1.5, contention), // Cap visualization level
            });
          }
        }
      }
    }
    return { bottlenecks: bottlenecks };
  }

  /**
   * Processes the enriched graph data to generate specialized visualization markers.
   * @returns An object containing temporal and resource bottleneck data.
   */
  public processEnrichedGraph(): {
    temporalMarkers: {
      edgeId: string;
      start: number;
      end: number;
      constraint: "must_finish_before" | "must_start_after";
    }[];
    resourceBottlenecks: {
      edgeId: string;
      resourceName: string;
      contentionLevel: number;
    }[];
  } {
    if (!this.validateGraphData(this.graphData)) {
      return { temporalMarkers: [], resourceBottlenecks: [] };
    }

    const { temporalMarkers: temporalMarkers } = this.processTemporalConstraints(this.graphData.edges);
    const { bottlenecks: resourceBottlenecks } = this.processResourceContention(this.graphData.edges);

    return {
      temporalMarkers: temporalMarkers,
      resourceBottlenecks: resourceBottlenecks,
    };
  }

  /**
   * Renders the specialized visualization markers onto the graph structure.
   * This method simulates the rendering step by returning the processed data.
   * @param visualizationContext Placeholder for rendering context (e.g., D3 selection).
   * @returns A string representing the visualization payload or status.
   */
  public render(visualizationContext: any): string {
    const processedData = this.processEnrichedGraph();

    let output = `--- Graph Visualization Report (V105) ---\n`;

    output += `[Temporal Constraints Detected]: ${processedData.temporalMarkers.length} markers.\n`;
    processedData.temporalMarkers.forEach(marker => {
      output += `  - Edge ${marker.edgeId}: ${marker.constraint} between ${marker.start} and ${marker.end}.\n`;
    });

    output += `\n[Resource Contention Points Detected]: ${processedData.resourceBottlenecks.length} points.\n`;
    processedData.resourceBottlenecks.forEach(bottleneck => {
      output += `  - Edge ${bottleneck.edgeId}: Resource '${bottleneck.resourceName}' is contended (Level: ${bottleneck.contentionLevel.toFixed(2)}).\n`;
    });

    output += "\nVisualization rendering complete. Specialized markers applied.";
    return output;
  }
}