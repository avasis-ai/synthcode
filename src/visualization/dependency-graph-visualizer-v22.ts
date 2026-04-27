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
  resourceName: string;
  requiredAmount: number;
  durationMs: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  toolCallId: string;
  temporalConstraints?: TemporalConstraint[];
  resourceConstraints?: ResourceConstraint[];
}

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool_result";
  content: any; // Simplified for visualization context
}

export interface EnrichedGraphData {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ToolDependencyGraphVisualizerV22 {
  private readonly canvasContext: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvasContext = canvas.getContext("2d")!;
  }

  private drawNode(node: GraphNode, x: number, y: number): void {
    this.canvasContext.fillStyle = node.type === "user" ? "#4CAF50" : node.type === "assistant" ? "#2196F3" : "#FF9800";
    this.canvasContext.beginPath();
    this.canvasContext.arc(x, y, 15, 0, 2 * Math.PI);
    this.canvasContext.fill();
    this.canvasContext.strokeStyle = "#333";
    this.canvasContext.lineWidth = 2;
    this.canvasContext.stroke();
  }

  private drawEdge(edge: DependencyEdge, startX: number, startY: number, endX: number, endY: number): void {
    this.canvasContext.strokeStyle = "#999";
    this.canvasContext.lineWidth = 3;
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(startX, startY);
    this.canvasContext.lineTo(endX, endY);
    this.canvasContext.stroke();

    if (edge.temporalConstraints && edge.temporalConstraints.length > 0) {
      this.drawTemporalMarkers(edge, startX, startY, endX, endY);
    }

    if (edge.resourceConstraints && edge.resourceConstraints.length > 0) {
      this.drawResourceMarkers(edge, startX, startY, endX, endY);
    }
  }

  private drawTemporalMarkers(edge: DependencyEdge, startX: number, startY: number, endX: number, endY: number): void {
    this.canvasContext.fillStyle = "rgba(255, 165, 0, 0.5)";
    this.canvasContext.fillRect(
      Math.min(startX, endX),
      Math.min(startY, endY) - 10,
      Math.abs(startX - endX),
      Math.max(startY, endY) - Math.min(startY, endY) + 20
    );
    this.canvasContext.font = "10px Arial";
    this.canvasContext.fillText("Time Span", startX + 5, Math.min(startY, endY) - 5);
  }

  private drawResourceMarkers(edge: DependencyEdge, startX: number, startY: number, endX: number, endY: number): void {
    this.canvasContext.fillStyle = "rgba(0, 128, 0, 0.5)";
    this.canvasContext.fillRect(
      Math.min(startX, endX),
      Math.max(startY, endY) - 15,
      Math.abs(startX - endX),
      Math.min(startY, endY) - Math.max(startY, endY) + 30
    );
    this.canvasContext.font = "10px Arial";
    this.canvasContext.fillText("Resource Use", startX + 5, Math.max(startY, endY) + 15);
  }

  public render(data: EnrichedGraphData, nodePositions: Record<string, { x: number; y: number }>): void {
    this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);

    // 1. Draw Edges (with temporal/resource overlays)
    this.canvasContext.save();
    this.canvasContext.globalAlpha = 0.8;
    data.edges.forEach(edge => {
      const startPos = nodePositions[edge.sourceId];
      const endPos = nodePositions[edge.targetId];

      if (startPos && endPos) {
        this.drawEdge(
          edge,
          startPos.x,
          startPos.y,
          endPos.x,
          endPos.y
        );
      }
    });
    this.canvasContext.restore();

    // 2. Draw Nodes
    this.canvasContext.save();
    this.canvasContext.globalAlpha = 1.0;
    data.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (pos) {
        this.drawNode(node, pos.x, pos.y);
      }
    });
    this.canvasContext.restore();
  }
}