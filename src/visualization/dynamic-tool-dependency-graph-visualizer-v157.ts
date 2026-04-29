import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ToolDependencyEdge = {
  sourceId: string;
  targetId: string;
  type: "tool_call" | "capability_req";
  details: {
    [key: string]: unknown;
  };
};

export type GraphPayload = {
  nodes: Record<string, {
    label: string;
    type: "tool" | "capability";
    details: Record<string, unknown>;
  }>;
  edges: ToolDependencyEdge[];
};

export class DynamicToolDependencyGraphVisualizer {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  private drawNode(context: CanvasRenderingContext2D, node: {
    label: string;
    type: "tool" | "capability";
    details: Record<string, unknown>;
  }, x: number, y: number): void {
    context.save();
    context.translate(x, y);

    const size = node.type === "tool" ? 80 : 60;
    context.beginPath();
    context.arc(0, 0, size / 2, 0, Math.PI * 2);
    context.fillStyle = node.type === "tool" ? "#4CAF50" : "#2196F3";
    context.fill();
    context.strokeStyle = "#333";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = "#FFFFFF";
    context.font = "14px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(node.label, 0, 0);

    context.restore();
  }

  private drawEdge(context: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, edge: ToolDependencyEdge): void {
    context.save();
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.strokeStyle = edge.type === "tool_call" ? "#FF9800" : "#9C27B0";
    context.lineWidth = edge.type === "tool_call" ? 3 : 2;
    context.stroke();

    context.fillStyle = edge.type === "tool_call" ? "#FF9800" : "#9C27B0";
    context.font = "12px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(edge.type === "tool_call" ? "CALL" : "REQUIRES", (startX + endX) / 2, (startY + endY) / 2 - 10);
    context.restore();
  }

  public visualize(payload: GraphPayload): void {
    const context = this.canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const nodePositions: Record<string, {
      x: number;
      y: number;
    }> = {};

    const nodeKeys = Object.keys(payload.nodes);
    const count = nodeKeys.length;
    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let i = 0; i < count; i++) {
      const nodeId = nodeKeys[i];
      const x = width * (i / count) * 0.8 + width * 0.1;
      const y = height * (i % Math.ceil(Math.sqrt(count)) / Math.ceil(Math.sqrt(count))) * 0.8 + height * 0.1;
      nodePositions[nodeId] = { x, y };
    }

    // 1. Draw Edges first (so nodes overlap them)
    payload.edges.forEach(edge => {
      const startPos = nodePositions[edge.sourceId];
      const endPos = nodePositions[edge.targetId];

      if (startPos && endPos) {
        this.drawEdge(
          context,
          startPos.x,
          startPos.y,
          endPos.x,
          endPos.y,
          edge
        );
      }
    });

    // 2. Draw Nodes
    Object.keys(payload.nodes).forEach(nodeId => {
      const node = payload.nodes[nodeId];
      const pos = nodePositions[nodeId];
      if (pos) {
        this.drawNode(context, node, pos.x, pos.y);
      }
    });
  }
}