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

export type CapabilityGraphPayload = {
  toolNodes: {
    id: string;
    name: string;
    description: string;
  }[];
  capabilityNodes: {
    id: string;
    name: string;
    description: string;
  }[];
  toolToCapabilityLinks: {
    toolId: string;
    capabilityId: string;
  }[];
  capabilityDependencies: {
    sourceCapabilityId: string;
    targetCapabilityId: string;
    reason: string;
  }[];
};

export interface GraphVisualizerOptions {
  payload: CapabilityGraphPayload;
  width: number;
  height: number;
}

export class ToolCapabilityDependencyGraphVisualizer {
  private options: GraphVisualizerOptions;

  constructor(options: GraphVisualizerOptions) {
    this.options = options;
  }

  public renderGraph(): string {
    const { payload, width, height } = this.options;

    if (!payload || !payload.toolNodes || !payload.capabilityNodes) {
      return "Error: Missing graph payload data.";
    }

    let html = `<div style="width: ${width}px; height: ${height}px; border: 1px solid #ccc; position: relative;">`;

    // 1. Render Tool Nodes
    payload.toolNodes.forEach(tool => {
      html += this.renderNode(
        tool,
        "tool",
        "bg-blue-100 border-blue-400",
        `Tool: ${tool.name}`,
        `Tool ${tool.id}: ${tool.description}`
      );
    });

    // 2. Render Capability Nodes
    payload.capabilityNodes.forEach(capability => {
      html += this.renderNode(
        capability,
        "capability",
        "bg-green-100 border-green-400",
        `Capability: ${capability.name}`,
        `Capability ${capability.id}: ${capability.description}`
      );
    });

    // 3. Render Tool -> Capability Links (Edges)
    payload.toolToCapabilityLinks.forEach(link => {
      html += this.renderLink(
        link.toolId,
        link.capabilityId,
        "border-dashed border-blue-500",
        "Tool -> Capability Link"
      );
    });

    // 4. Render Capability -> Capability Dependencies (Edges)
    payload.capabilityDependencies.forEach(dep => {
      html += this.renderLink(
        dep.sourceCapabilityId,
        dep.targetCapabilityId,
        "border-dotted border-red-500",
        `Dependency: ${dep.reason}`
      );
    });

    html += "</div>";
    return html;
  }

  private renderNode(
    node: { id: string; name: string; description: string },
    type: "tool" | "capability",
    className: string,
    title: string,
    content: string
  ): string {
    return `
      <div style="position: absolute; top: 50px; left: ${this.getNodePosition(node.id, type)}; width: 150px; padding: 10px; border: 2px solid #333; ${className}; cursor: pointer; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); z-index: 10;">
        <h4 style="margin-top: 0; color: #333;">${node.name}</h4>
        <p style="font-size: 0.9em; color: #555;">${content}</p>
      </div>
    `;
  }

  private renderLink(
    sourceId: string,
    targetId: string,
    style: string,
    label: string
  ): string {
    // In a real implementation, this would use SVG or Canvas for accurate drawing.
    // For this simulation, we use a placeholder div with styling.
    return `
      <div style="position: absolute; top: ${this.getNodePosition(sourceId, 'tool')}; left: ${this.getNodePosition(sourceId, 'tool')} + 150px; width: 0; height: 0; border-bottom: 2px solid #aaa; ${style}; transform: translateY(-50%); z-index: 5;">
        <span style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #fff; padding: 2px 5px; border-radius: 3px; font-size: 0.8em;">${label}</span>
      </div>
    `;
  }

  private getNodePosition(id: string, type: "tool" | "capability"): number {
    // Mock positioning logic based on ID hash for deterministic placement
    const hash = (str: string): number => {
      let hashValue = 0;
      for (let i = 0; i < str.length; i++) {
        hashValue = (hashValue + str.charCodeAt(i) * (i + 1));
      }
      return Math.abs(hashValue % 80); // 0 to 79
    };

    if (type === "tool") {
      return hash(id) * 10 + 50;
    } else {
      return hash(id) * 10 + 100;
    }
  }
}