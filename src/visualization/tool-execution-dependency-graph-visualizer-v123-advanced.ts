import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: "cpu" | "memory" | "gpu";
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ToolExecutionNode {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  startTimeMs: number;
  endTimeMs: number;
  resourceConstraints: ResourceConstraint[];
  stateTransitions: { from: string; to: string; timestamp: number }[];
}

export interface DependencyEdge {
  sourceToolUseId: string;
  targetToolUseId: string;
  dependencyType: "causal" | "temporal" | "resource_wait";
  weight: number;
  constraint: "must_precede" | "must_follow" | "waits_for";
}

export interface EnrichedGraphPayload {
  nodes: ToolExecutionNode[];
  edges: DependencyEdge[];
  globalContextState: Record<string, any>;
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  public renderVisualization(): string {
    const nodeHtml = this.renderNodes();
    const edgeHtml = this.renderEdges();
    return `
      <div class="dependency-graph-container">
        <h2>Tool Execution Dependency Graph (v123 Advanced)</h2>
        <div class="graph-visualization">
          ${nodeHtml}
          ${edgeHtml}
        </div>
        <div class="context-summary">
          <h3>Global Context State</h3>
          <pre>${JSON.stringify(this.payload.globalContextState, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  private renderNodes(): string {
    return this.payload.nodes.map(node => {
      const resourceDetails = node.resourceConstraints.map(r =>
        `<span class="resource-tag">${r.resourceName}: ${r.requiredAmount}${r.unit}</span>`
      ).join(" ");

      const stateTransitionsHtml = node.stateTransitions.map(t =>
        `<span class="transition-event">(${t.from} -> ${t.to} @ ${new Date(t.timestamp).toLocaleTimeString()})</span>`
      ).join(" ");

      return `
        <div class="graph-node" id="node-${node.toolUseId}">
          <h4>${node.toolName} (${node.toolUseId})</h4>
          <p><strong>Time:</strong> ${new Date(node.startTimeMs).toLocaleTimeString()} - ${new Date(node.endTimeMs).toLocaleTimeString()}</p>
          <p><strong>Resources:</strong> ${resourceDetails || 'None'}</p>
          <p><strong>State Changes:</strong> ${stateTransitionsHtml || 'None'}</p>
          <div class="node-details">
            <p>Input: ${JSON.stringify(node.input)}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  private renderEdges(): string {
    return this.payload.edges.map(edge => {
      let constraintDisplay = "";
      switch (edge.constraint) {
        case "must_precede":
          constraintDisplay = "MUST PRECEDE";
          break;
        case "must_follow":
          constraintDisplay = "MUST FOLLOW";
          break;
        case "waits_for":
          constraintDisplay = "WAITS FOR";
          break;
      }

      return `
        <div class="graph-edge">
          <span class="edge-source">(${edge.sourceToolUseId})</span> 
          <span class="edge-type">${edge.dependencyType.toUpperCase()}</span> 
          <span class="edge-constraint">${constraintDisplay}</span> 
          <span class="edge-target">(${edge.targetToolUseId})</span>
        </div>
      `;
    }).join("");
  }
}