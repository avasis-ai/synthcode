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
  unit: string;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface GraphNode {
  messageId: string;
  type: "message";
  metadata: {
    temporal: TemporalMetadata;
    resources: ResourceConstraint[];
  };
  content: ContentBlock[];
}

export interface GraphEdge {
  sourceMessageId: string;
  targetMessageId: string;
  metadata: {
    temporal: TemporalMetadata;
    dependencyType: "sequential" | "conditional" | "resource_wait";
  };
}

export interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodeHtml = this.renderNodes();
    const edgeHtml = this.renderEdges();

    return `
      <div class="dependency-graph-container">
        <h2>Tool Execution Dependency Graph</h2>
        <div class="graph-visualization">
          ${nodeHtml}
          <svg class="dependency-graph-svg" width="100%" height="500px">
            ${this.renderSvgEdges()}
          </svg>
        </div>
        <div class="legend">
          <h3>Legend</h3>
          <p>Nodes represent agent actions/messages. Edges show temporal and dependency flow.</p>
        </div>
      </div>
    `;
  }

  private renderNodes(): string {
    return this.payload.nodes.map(node => {
      const resourceInfo = node.metadata.resources.map(r =>
        `<span class="resource-badge">${r.resourceName}: ${r.requiredAmount}${r.unit}</span>`
      ).join(" ");

      return `
        <div class="graph-node" id="${node.messageId}">
          <h4>Message ID: ${node.messageId}</h4>
          <div class="metadata">
            <p>Time Span: ${new Date(node.metadata.temporal.startTimeMs).toLocaleTimeString()} - ${new Date(node.metadata.temporal.endTimeMs).toLocaleTimeString()}</p>
            <p>Resources Used: ${resourceInfo || 'None'}</p>
          </div>
          <div class="content-display">
            ${node.content.map(block => this.renderContentBlock(block)).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  private renderContentBlock(block: ContentBlock): string {
    switch (block.type) {
      case "text":
        return `<p class="text-content">${block.text}</p>`;
      case "tool_use":
        return `<div class="tool-use-block">
          <strong>Tool Use: ${block.name}</strong><br>
          Input: ${JSON.stringify(block.input)}
        </div>`;
      case "thinking":
        return `<div class="thinking-block">
          <strong>Thinking Process:</strong><p>${block.thinking}</p>
        </div>`;
      default:
        return "";
    }
  }

  private renderEdges(): string {
    return this.payload.edges.map(edge => {
      const dependencyClass = edge.metadata.dependencyType === "sequential" ? "seq" :
                              edge.metadata.dependencyType === "conditional" ? "cond" : "wait";
      return `
        <div class="graph-edge" data-source="${edge.sourceMessageId}" data-target="${edge.targetMessageId}" data-type="${dependencyClass}">
          <span class="edge-label">
            ${edge.metadata.dependencyType.toUpperCase()} (${Math.round(edge.metadata.temporal.durationMs / 1000)}s)
          </span>
        </div>
      `;
    }).join("");
  }

  private renderSvgEdges(): string {
    // In a real implementation, this would calculate SVG paths based on node positions.
    // For this simulation, we return a placeholder structure.
    return this.payload.edges.map((edge, index) => `
      <line x1="10%" y1="${(index * 15) % 80 + 20}" x2="90%" y2="${(index * 15) % 80 + 20}" stroke="#ccc" stroke-width="2" class="dependency-line" />
      <text x="50%" y="${(index * 15) % 80 + 20 - 10}" text-anchor="middle" class="edge-label-svg">${edge.metadata.dependencyType.charAt(0).toUpperCase() + edge.metadata.dependencyType.slice(1)}</text>
    `).join("");
  }
}