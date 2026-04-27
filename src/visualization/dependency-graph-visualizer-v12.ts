import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraint {
  resourceName: string;
  startTime: number;
  endTime: number;
}

export interface TemporalDependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  constraints: ResourceConstraint[];
  dependencyType: "sequential" | "resource_lock" | "temporal_wait";
}

export interface GraphNode {
  id: string;
  type: "tool_call" | "user_input" | "system_state";
  data: Record<string, unknown>;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: TemporalDependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV12 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  public visualize(): {
    html: string;
    metadata: Record<string, any>;
  } {
    const nodeHtml = this.renderNodes();
    const edgeHtml = this.renderEdges();

    const metadata = {
      nodeCount: this.graph.nodes.length,
      edgeCount: this.graph.edges.length,
      constraints: this.graph.edges.flatMap(edge => edge.constraints).map(c => ({
        resource: c.resourceName,
        start: c.startTime,
        end: c.endTime,
      })),
    };

    return {
      html: `
        <div class="dependency-graph-v12" style="border: 1px solid #ccc; padding: 20px;">
          <h2>Execution Dependency Graph (V12)</h2>
          <div class="graph-visualization">
            ${nodeHtml}
            <div class="edges-layer">
              ${edgeHtml}
            </div>
          </div>
          <div class="metadata">
            <p>Nodes: ${metadata.nodeCount}, Edges: ${metadata.edgeCount}</p>
            <p>Detected Constraints: ${metadata.constraints.length} total.</p>
          </div>
        </div>
      `,
      metadata: metadata,
    };
  }

  private renderNodes(): string {
    return this.graph.nodes.map(node => {
      let content = "";
      if (node.type === "tool_call") {
        const toolData = node.data as { name: string; input: Record<string, unknown> };
        content = `<strong>Tool:</strong> ${toolData.name}<br><strong>Input:</strong> ${JSON.stringify(toolData.input)}`;
      } else if (node.type === "user_input") {
        content = `User Input: ${JSON.stringify(node.data)}`;
      }
      return `<div class="graph-node node-${node.type}" id="${node.id}">${content}</div>`;
    }).join("");
  }

  private renderEdges(): string {
    return this.graph.edges.map(edge => {
      const constraintDetails = edge.constraints.map(c =>
        `<span style="background-color: rgba(255, 165, 0, 0.3); padding: 2px; margin-right: 5px; display: inline-block;">${c.resourceName} [${c.startTime}-${c.endTime}]</span>`
      ).join(" ");

      let typeIndicator = "";
      if (edge.dependencyType === "resource_lock") {
        typeIndicator = `<span style="color: red;">[Resource Lock]</span>`;
      } else if (edge.dependencyType === "temporal_wait") {
        typeIndicator = `<span style="color: orange;">[Wait]</span>`;
      }

      return `
        <div class="dependency-edge" id="edge-${edge.sourceNodeId}-${edge.targetNodeId}" style="border-left: 3px solid blue; padding-left: 10px; margin: 10px 0;">
          <strong>${edge.sourceNodeId}</strong> -- ${typeIndicator} --> <strong>${edge.targetNodeId}</strong>
          <p style="margin: 5px 0 0 0; font-size: 0.9em;">Constraints: ${constraintDetails || 'None'}</p>
        </div>
      `;
    }).join("");
  }
}