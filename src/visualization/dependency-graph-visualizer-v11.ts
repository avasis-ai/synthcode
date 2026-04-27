import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalDependencyEdge {
  source: string;
  target: string;
  startTime: number;
  endTime: number;
  resourceConstraint: string;
}

export interface ComponentNode {
  id: string;
  name: string;
  description: string;
}

export interface DependencyGraphData {
  components: ComponentNode[];
  temporalEdges: TemporalDependencyEdge[];
}

export class DependencyGraphVisualizerV11 {
  private data: DependencyGraphData;

  constructor(data: DependencyGraphData) {
    this.data = data;
  }

  public visualizeTimeline(canvasWidth: number, canvasHeight: number): void {
    const { components, temporalEdges } = this.data;

    if (!components.length || !temporalEdges.length) {
      console.log("No data available for visualization.");
      return;
    }

    console.log("--- Starting Timeline Visualization ---");
    console.log(`Canvas Dimensions: ${canvasWidth}x${canvasHeight}`);
    console.log(`Components Detected: ${components.length}`);
    console.log(`Temporal Edges Detected: ${temporalEdges.length}`);

    const minTime = Math.min(...temporalEdges.map(e => e.startTime));
    const maxTime = Math.max(...temporalEdges.map(e => e.endTime));
    const timeRange = Math.max(1, maxTime - minTime);

    console.log(`Time Range: ${minTime} to ${maxTime} (Total: ${timeRange.toFixed(2)})`);

    // Simulate rendering logic for time-windowed interactions
    const timelineSegments: string[] = [];
    for (const edge of temporalEdges) {
      const duration = edge.endTime - edge.startTime;
      const normalizedStart = (edge.startTime - minTime) / timeRange;
      const normalizedEnd = (edge.endTime - minTime) / timeRange;

      const segmentInfo = `[${edge.source} -> ${edge.target}] Time: ${edge.startTime.toFixed(1)} - ${edge.endTime.toFixed(1)} | Resource: ${edge.resourceConstraint} | Normalized: [${normalizedStart.toFixed(2)}, ${normalizedEnd.toFixed(2)}]`;
      timelineSegments.push(segmentInfo);
    }

    console.log("\n--- Rendered Timeline Interactions (Simulated) ---");
    timelineSegments.forEach((segment, index) => {
      console.log(`Segment ${index + 1}: ${segment}`);
    });

    console.log("--- Visualization Complete ---");
  }

  public getSummary(): {
    componentCount: number;
    edgeCount: number;
    timeSpan: number;
  } {
    const edges = this.data.temporalEdges;
    if (edges.length === 0) {
      return {
        componentCount: this.data.components.length,
        edgeCount: 0,
        timeSpan: 0,
      };
    }

    const minTime = Math.min(...edges.map(e => e.startTime));
    const maxTime = Math.max(...edges.map(e => e.endTime));

    return {
      componentCount: this.data.components.length,
      edgeCount: edges.length,
      timeSpan: maxTime - minTime,
    };
  }
}