import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type DependencyType = "requires" | "enhances" | "is_used_by";

export interface CapabilityDependency {
  source: string;
  target: string;
  type: DependencyType;
  context?: string;
}

export interface CapabilityGraphPayload {
  nodes: Record<string, { name: string; description: string }>;
  edges: CapabilityDependency[];
}

export class ToolCapabilityDependencyGraphVisualizerV140 {
  private payload: CapabilityGraphPayload;

  constructor(payload: CapabilityGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodesHtml = Object.entries(this.payload.nodes)
      .map(([id, node]) => `
        <div class="graph-node" data-node-id="${id}">
          <h3>${node.name}</h3>
          <p>${node.description}</p>
        </div>
      `).join("");

    const edgesHtml = this.payload.edges.map((edge) => {
      const relationshipClass = `dependency-${edge.type}`;
      return `
        <div class="graph-edge ${relationshipClass}" data-source="${edge.source}" data-target="${edge.target}">
          ${edge.type === "requires" ? "→ Requires" : edge.type === "enhances" ? "⟵ Enhances" : "⟷ Used By"}
          <small>(${edge.context || "N/A"})</small>
        </div>
      `).join("");

    return `
      <div class="dependency-graph-container">
        <h2>Tool Capability Dependency Graph</h2>
        <div class="graph-visualization-area">
          <div class="nodes-container">${nodesHtml}</div>
          <div class="edges-container">${edgesHtml}</div>
        </div>
        <style>
          .dependency-graph-container { font-family: sans-serif; padding: 20px; border: 1px solid #ccc; }
          .graph-visualization-area { display: flex; gap: 40px; }
          .nodes-container { flex: 1; display: flex; flex-wrap: wrap; gap: 20px; }
          .graph-node { border: 1px solid #007bff; padding: 15px; border-radius: 8px; background-color: #e7f1ff; min-width: 200px; }
          .graph-node h3 { margin-top: 0; color: #0056b3; }
          .edges-container { flex: 1; border-left: 1px dashed #ccc; padding-left: 20px; }
          .graph-edge { padding: 10px; margin-bottom: 10px; border-left: 4px solid; border-radius: 4px; background-color: #f9f9f9; }
          .dependency-requires { border-color: #dc3545; background-color: #fff0f0; }
          .dependency-enhances { border-color: #28a745; background-color: #f0fff0; }
          .dependency-is_used_by { border-color: #ffc107; background-color: #fffbe6; }
        </style>
      </div>
    `;
  }

  public static generatePayloadFromMessages(messages: Array<ContentBlock[]>): CapabilityGraphPayload {
    const nodes: Record<string, { name: string; description: string }> = {};
    const edges: CapabilityDependency[] = [];

    const processMessage = (messageBlocks: ContentBlock[]): void => {
      let capabilitiesFound: Set<string> = new Set();

      messageBlocks.forEach(block => {
        if (block.type === "tool_use") {
          const toolUse = block as ToolUseBlock;
          const toolId = toolUse.id;
          const toolName = toolUse.name;

          if (!nodes[toolId]) {
            nodes[toolId] = { name: toolName, description: `Tool used in context: ${toolId}` };
          }
          capabilitiesFound.add(toolId);
        }
        // Simplified logic: Assume thinking blocks or text mentioning specific keywords imply capabilities
        if (block.type === "thinking") {
          const thinkingBlock = block as ThinkingBlock;
          if (thinkingBlock.thinking.includes("dependency_A")) {
            const depId = "capability_A";
            if (!nodes[depId]) {
              nodes[depId] = { name: "Capability A", description: "Core logic for A" };
            }
            capabilitiesFound.add(depId);
          }
          if (thinkingBlock.thinking.includes("dependency_B")) {
            const depId = "capability_B";
            if (!nodes[depId]) {
              nodes[depId] = { name: "Capability B", description: "Advanced feature set B" };
            }
            capabilitiesFound.add(depId);
          }
        }
      });
    };

    messages.forEach(processMessage);

    // Mocking dependency creation based on assumed interaction flow
    if (capabilitiesFound.has("capability_A") && capabilitiesFound.has("capability_B")) {
      edges.push({ source: "capability_A", target: "capability_B", type: "requires", context: "A needs B for advanced output" });
      edges.push({ source: "capability_B", target: "capability_A", type: "enhances", context: "B improves A's robustness" });
    }

    return { nodes, edges };
  }
}