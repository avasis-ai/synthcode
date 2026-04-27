import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Node {
  id: string;
  type: "tool" | "context" | "resource" | "start" | "end";
  label: string;
  details: Record<string, unknown>;
}

interface Edge {
  fromId: string;
  toId: string;
  type: "calls" | "data_flow" | "constraint";
  weight?: number;
}

export interface DependencyGraphData {
  nodes: Node[];
  edges: Edge[];
}

export class ToolDependencyGraphVisualizer {
  private graphData: DependencyGraphData;

  constructor(initialData?: DependencyGraphData) {
    this.graphData = initialData || { nodes: [], edges: [] };
  }

  public setGraphData(data: DependencyGraphData): void {
    this.graphData = data;
  }

  public visualize(): {
    mermaidGraph: string;
    payload: Record<string, any>;
  } {
    const { nodes, edges } = this.graphData;

    const mermaidNodes = nodes.map(node => {
      let shape = "box";
      if (node.type === "start") shape = "circle";
      if (node.type === "end") shape = "doublecircle";
      return `${node.id}["${node.label}"]`;
    }).join(";\n");

    const mermaidEdges = edges.map(edge => {
      let arrow = "-->";
      if (edge.type === "data_flow") arrow = "-->";
      if (edge.type === "constraint") arrow = "---";
      return `${edge.fromId} ${arrow} ${edge.toId}`;
    }).join("\n");

    const mermaidGraph = `graph TD\n${mermaidNodes}\n${mermaidEdges}`;

    const payload: Record<string, any> = {
      nodeDetails: nodes.reduce((acc, node) => {
        acc[node.id] = {
          type: node.type,
          label: node.label,
          details: node.details,
        };
        return acc;
      }, {} as Record<string, any>),
      edgeDetails: edges.map(edge => ({
        from: edge.fromId,
        to: edge.toId,
        type: edge.type,
        weight: edge.weight,
      })),
    };

    return {
      mermaidGraph: mermaidGraph,
      payload: payload,
    };
  }
}