import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synth-code-types";

interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  durationMs: number;
}

interface TemporalConstraints {
  startTimeMs: number;
  endTimeMs: number;
}

interface GraphNode {
  id: string;
  name: string;
  metrics: ResourceMetrics;
  constraints: TemporalConstraints;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  metrics: {
    dataTransferSize: number;
    latencyMs: number;
  };
  constraints: {
    minDurationMs: number;
    maxDurationMs: number;
  };
}

interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type NodeStyle = {
  backgroundColor: string;
  borderColor: string;
  size: number;
};

type EdgeStyle = {
  strokeWidth: number;
  color: string;
};

export class ToolExecutionDependencyGraphVisualizerAdvanced {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  private calculateNodeStyle(node: GraphNode): NodeStyle {
    const cpuRatio = Math.min(1, node.metrics.cpuUsage / 100);
    const memRatio = Math.min(1, node.metrics.memoryUsage / 100);
    const durationRatio = Math.min(1, node.metrics.durationMs / 10000);

    const baseColor = `hsl(${cpuRatio * 120}, 70%, ${50 + cpuRatio * 10}%)`;
    const intensity = Math.max(cpuRatio, memRatio, durationRatio);

    return {
      backgroundColor: baseColor,
      borderColor: `hsl(${cpuRatio * 120}, 70%, ${50 + cpuRatio * 10}%)`,
      size: 10 + Math.sqrt(intensity) * 20,
    };
  }

  private calculateEdgeStyle(edge: GraphEdge): EdgeStyle {
    const duration = edge.metrics.latencyMs;
    const thicknessFactor = Math.min(1, duration / 5000);

    return {
      strokeWidth: 2 + thicknessFactor * 5,
      color: `rgba(100, 150, 255, ${0.5 + thicknessFactor * 0.5})`,
    };
  }

  private processLayoutAdjustments(nodes: GraphNode[], edges: GraphEdge[]): {
    adjustedPositions: Map<string, { x: number; y: number }>;
    layoutHints: string[];
  } {
    const positions = new Map<string, { x: number; y: number }>();
    const hints: string[] = [];

    // Simple heuristic: place nodes based on their temporal window center
    nodes.forEach((node, index) => {
      const centerX = index * 150 + 100;
      const centerY = Math.sin(index * 0.5) * 50 + 100;
      positions.set(node.id, { x: centerX, y: centerY });
    });

    // Check for temporal overlaps (contention)
    const timeSlots = nodes.map(n => ({ id: n.id, start: n.constraints.startTimeMs, end: n.constraints.endTimeMs }));
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slotA = timeSlots[i];
        const slotB = timeSlots[j];
        const overlapStart = Math.max(slotA.start, slotB.start);
        const overlapEnd = Math.min(slotA.end, slotB.end);

        if (overlapStart < overlapEnd) {
          hints.push(`Temporal overlap detected between ${slotA.id} and ${slotB.id} (${Math.round(overlapStart / 1000)}s to ${Math.round(overlapEnd / 1000)}s).`);
        }
      }
    }

    return { adjustedPositions: positions, layoutHints: hints };
  }

  public visualize(): {
    nodesStyle: Record<string, NodeStyle>;
    edgesStyle: Record<string, EdgeStyle>;
    layout: {
      positions: Map<string, { x: number; y: number }>;
      hints: string[];
    };
  } {
    const nodeStyles: Record<string, NodeStyle> = {};
    const edgeStyles: Record<string, EdgeStyle> = {};

    this.payload.nodes.forEach((node) => {
      nodeStyles[node.id] = this.calculateNodeStyle(node);
    });

    this.payload.edges.forEach((edge) => {
      edgeStyles[`${edge.sourceId}-${edge.targetId}`] = this.calculateEdgeStyle(edge);
    });

    const layout = this.processLayoutAdjustments(this.payload.nodes, this.payload.edges);

    return {
      nodesStyle: nodeStyles,
      edgesStyle: edgeStyles,
      layout: {
        positions: layout.adjustedPositions,
        hints: layout.layoutHints,
      },
    };
  }
}