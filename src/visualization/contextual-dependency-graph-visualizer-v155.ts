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

export type ContextualMetadataType = "RESOURCE_CONSTRAINT" | "GOAL_ALIGNMENT" | "SEMANTIC_LINK";

export interface ContextualEdgePayload {
  type: ContextualMetadataType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  payload: ContextualEdgePayload;
}

export interface GraphNode {
  id: string;
  type: "USER" | "ASSISTANT" | "TOOL";
  content: string;
  contextualTags?: string[];
}

export interface ContextualDependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

type VisualStyleMap = Record<ContextualMetadataType, { color: string; icon: string }>;

const DEFAULT_STYLES: VisualStyleMap = {
  RESOURCE_CONSTRAINT: { color: "#FF9800", icon: "⚠️" },
  GOAL_ALIGNMENT: { color: "#4CAF50", icon: "🎯" },
  SEMANTIC_LINK: { color: "#2196F3", icon: "🔗" },
};

class ContextualDependencyGraphVisualizer {
  private styles: VisualStyleMap;

  constructor(styles?: VisualStyleMap) {
    this.styles = styles || DEFAULT_STYLES;
  }

  private getNodeColor(nodeType: GraphNode["type"]): string {
    switch (nodeType) {
      case "USER":
        return "#E0F7FA";
      case "ASSISTANT":
        return "#F1F8E9";
      case "TOOL":
        return "#FFF3E0";
      default:
        return "#FFFFFF";
    }
  }

  private getEdgeStyle(payload: ContextualEdgePayload): { color: string; icon: string } {
    const style = this.styles[payload.type] || DEFAULT_STYLES.SEMANTIC_LINK;
    return { color: style.color, icon: style.icon };
  }

  public visualize(
    graphData: ContextualDependencyGraph,
    containerElementId: string
  ): void {
    const container = document.getElementById(containerElementId);
    if (!container) {
      console.error(`Container element with ID "${containerElementId}" not found.`);
      return;
    }

    container.innerHTML = "";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.padding = "20px";

    // 1. Render Nodes
    const nodeContainer = document.createElement("div");
    nodeContainer.id = "graph-nodes";
    nodeContainer.style.display = "flex";
    nodeContainer.style.flexWrap = "wrap";
    nodeContainer.style.gap = "20px";
    nodeContainer.style.marginBottom = "30px";

    graphData.nodes.forEach((node, index) => {
      const nodeEl = document.createElement("div");
      nodeEl.className = "graph-node";
      nodeEl.style.border = `2px solid ${this.getNodeColor(node.type)}`;
      nodeEl.style.padding = "15px";
      nodeEl.style.borderRadius = "8px";
      nodeEl.style.flexBasis = "300px";
      nodeEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

      let tagsHtml = node.contextualTags ? node.contextualTags.map(tag =>
        `<span style="background-color: #eee; padding: 3px 8px; border-radius: 4px; margin-right: 5px; font-size: 0.8em; display: inline-block;">${tag}</span>`
      ).join("") : "";

      nodeEl.innerHTML = `
        <h3 style="margin-top: 0; color: ${this.getNodeColor(node.type).replace('E', '0')};">${node.type} Node (${node.id})</h3>
        <p style="white-space: pre-wrap; margin-bottom: 10px;">${node.content.substring(0, 150)}...</p>
        <div style="margin-top: 10px;">${tagsHtml}</div>
      `;
      nodeContainer.appendChild(nodeEl);
    });

    container.appendChild(nodeContainer);

    // 2. Render Edges (Contextual Dependencies)
    const edgeContainer = document.createElement("div");
    edgeContainer.id = "graph-edges";
    edgeContainer.innerHTML = "<h2>Contextual Dependencies</h2>";

    graphData.edges.forEach((edge, index) => {
      const style = this.getEdgeStyle(edge.payload);
      const edgeEl = document.createElement("div");
      edgeEl.className = "graph-edge";
      edgeEl.style.borderLeft = `5px solid ${style.color}`;
      edgeEl.style.padding = "10px 15px";
      edgeEl.style.marginBottom = "15px";
      edgeEl.style.backgroundColor = "#f9f9f9";
      edgeEl.style.borderRadius = "4px";

      edgeEl.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 1.2em; margin-right: 10px;">${style.icon}</span>
            <h4 style="margin: 0; color: ${style.color};">${edge.payload.type} Dependency</h4>
        </div>
        <p style="margin: 5px 0;"><strong>Source:</strong> ${edge.sourceId} &rarr; <strong>Target:</strong> ${edge.targetId}</p>
        <p style="margin: 5px 0; font-style: italic;">Context: ${edge.payload.description} (Severity: ${edge.payload.severity})</p>
      `;
      edgeContainer.appendChild(edgeEl);
    });

    container.appendChild(edgeContainer);
  }
}

export { ContextualDependencyGraphVisualizer };