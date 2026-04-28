import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface NodeMetadata {
  id: string;
  type: "tool_call" | "user_input" | "system_state";
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
  description: string;
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  dataFlow: string;
  temporalConstraint: {
    minTime: number;
    maxTime: number;
  };
  weight: number;
}

export interface GraphPayload {
  nodes: NodeMetadata[];
  edges: EdgeMetadata[];
  layoutHints: {
    // Could contain force-directed layout parameters or fixed positions
    positions?: Record<string, { x: number; y: number }>;
  };
}

export type VisualizationContext = {
  payload: GraphPayload;
  onInteraction: (interaction: { type: string; data: any }) => void;
};

export class ToolExecutionDependencyGraphVisualizer {
  private readonly graphRenderer: (context: VisualizationContext) => void;

  constructor(graphRenderer: (context: VisualizationContext) => void) {
    this.graphRenderer = graphRenderer;
  }

  public renderAdvancedDependencyGraph(payload: GraphPayload, onInteraction: (interaction: { type: string; data: any }) => void): void {
    const context: VisualizationContext = {
      payload: payload,
      onInteraction: onInteraction,
    };
    this.graphRenderer(context);
  }
}

export function renderAdvancedDependencyGraph(
  payload: GraphPayload,
  onInteraction: (interaction: { type: string; data: any }) => void
): void {
  const visualizer = new ToolExecutionDependencyGraphVisualizer(
    (context) => {
      console.log("Rendering Advanced Dependency Graph...");
      console.log("Nodes:", context.payload.nodes.length);
      console.log("Edges:", context.payload.edges.length);

      context.payload.nodes.forEach(node => {
        console.log(`- Node ${node.id}: Type=${node.type}, Duration=${node.endTime - node.startTime}ms`);
      });

      context.payload.edges.forEach(edge => {
        console.log(`- Edge ${edge.sourceId} -> ${edge.targetId}: DataFlow=${edge.dataFlow}, Constraint=[${edge.temporalConstraint.minTime}, ${edge.temporalConstraint.maxTime}]`);
      });

      // In a real implementation, this would call a rendering library (e.g., D3, React Flow)
      // using the enriched metadata for styling and layout calculation.
      console.log("Visualization rendering complete with temporal and resource awareness.");
    }
  );

  visualizer.renderAdvancedDependencyGraph(payload, onInteraction);
}