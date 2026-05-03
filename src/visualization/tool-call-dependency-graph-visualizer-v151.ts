import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolCallDependency {
  sourceToolId: string;
  targetToolId: string;
  dependencyType: "direct" | "temporal" | "resource";
  constraint?: string;
}

export interface ToolCallNode {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
  description: string;
}

export interface DependencyGraphPayload {
  toolCalls: ToolCallNode[];
  dependencies: ToolCallDependency[];
  messages: Message[];
}

export class ToolCallDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodesHtml = this.payload.toolCalls.map(node => `
      <div class="tool-node" data-tool-id="${node.toolUseId}">
        <h4>${node.name}</h4>
        <p>Input: ${JSON.stringify(node.input)}</p>
        <p>Description: ${node.description}</p>
      </div>
    `).join("");

    const edgesHtml = this.payload.dependencies.map(dep => {
      let typeClass = "";
      switch (dep.dependencyType) {
        case "direct":
          typeClass = "direct-edge";
          break;
        case "temporal":
          typeClass = "temporal-edge";
          break;
        case "resource":
          typeClass = "resource-edge";
          break;
      }
      return `<div class="dependency-edge ${typeClass}" data-source="${dep.sourceToolId}" data-target="${dep.targetToolId}">
        ${dep.constraint ? `Constraint: ${dep.constraint}` : ''}
      </div>`;
    }).join("");

    return `
      <div class="dependency-graph-container">
        <h2>Tool Call Dependency Graph</h2>
        <div class="graph-visualization">
          <div class="nodes-container">${nodesHtml}</div>
          <div class="edges-container">${edgesHtml}</div>
        </div>
        <div class="legend">
          <strong>Legend:</strong>
          <span class="legend-item direct-edge">Direct Dependency</span> |
          <span class="legend-item temporal-edge">Temporal Constraint</span> |
          <span class="legend-item resource-edge">Resource Usage</span>
        </div>
      </div>
    `;
  }

  public updateContext(newPayload: DependencyGraphPayload): void {
    this.payload = newPayload;
  }
}