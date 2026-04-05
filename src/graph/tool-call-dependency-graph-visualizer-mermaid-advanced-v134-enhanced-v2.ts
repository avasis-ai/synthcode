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

export interface AdvancedGraphOptions {
  graphTitle: string;
  startNodeId: string;
  endNodeId: string;
  conditionalPaths?: {
    fromNodeId: string;
    condition: string;
    toNodeId: string;
    weight?: number;
  }[];
  temporalConstraints?: {
    fromNodeId: string;
    toNodeId: string;
    delay?: number;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions) {
    this.options = options;
  }

  private getNodeLabel(nodeId: string, message: Message | null): string {
    if (!message) {
      return `Node ${nodeId}`;
    }
    if ("user" === message.role) {
      return `User: ${message.content.substring(0, 20)}...`;
    }
    if ("assistant" === message.role) {
      const content = message.content.map(block => {
        if (block.type === "text") return block.text.substring(0, 20) + "...";
        if (block.type === "tool_use") return `Tool: ${block.name}`;
        return "";
      }).join(" | ");
      return `Assistant: ${content}`;
    }
    if ("tool" === message.role) {
      return `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 20)}...`;
    }
    return `Unknown Node ${nodeId}`;
  }

  private generateMermaidGraph(
    nodes: Record<string, Message | null>,
    edges: { from: string; to: string; label: string }[],
    advancedOptions: AdvancedGraphOptions
  ): string {
    let mermaid = `graph TD\n`;
    mermaid += `    %% Graph Title: ${advancedOptions.graphTitle}\n`;

    // 1. Define Nodes
    Object.keys(nodes).forEach((nodeId) => {
      const message = nodes[nodeId];
      const label = this.getNodeLabel(nodeId, message);
      mermaid += `    ${nodeId}["${label}"]\n`;
    });

    // 2. Define Standard Edges
    edges.forEach((edge) => {
      mermaid += `    ${edge.from} -->|${edge.label}| ${edge.to}\n`;
    });

    // 3. Handle Conditional Paths (if A then B else C)
    if (advancedOptions.conditionalPaths && advancedOptions.conditionalPaths.length > 0) {
      mermaid += "\n    %% Conditional Logic Paths\n";
      advancedOptions.conditionalPaths.forEach((path, index) => {
        const conditionLabel = `[Condition: ${path.condition}]`;
        const weightLabel = path.weight ? ` (Weight: ${path.weight})` : "";
        mermaid += `    ${path.fromNodeId} -->|${conditionLabel}${weightLabel}| ${path.toNodeId}\n`;
      });
    }

    // 4. Handle Temporal Constraints (Delay visualization)
    if (advancedOptions.temporalConstraints && advancedOptions.temporalConstraints.length > 0) {
      mermaid += "\n    %% Temporal Constraints\n";
      advancedOptions.temporalConstraints.forEach((constraint, index) => {
        const delayLabel = constraint.delay ? ` (Delay: ${constraint.delay} units)` : "";
        mermaid += `    ${constraint.fromNodeId} --o|${delayLabel}| ${constraint.toNodeId}\n`;
      });
    }

    // 5. Set Start/End Points (Optional styling/marking)
    if (advancedOptions.startNodeId) {
      mermaid += `    style ${advancedOptions.startNodeId} fill:#ccf,stroke:#333,stroke-width:2px\n`;
    }
    if (advancedOptions.endNodeId) {
      mermaid += `    style ${advancedOptions.endNodeId} fill:#cfc,stroke:#333,stroke-width:2px\n`;
    }

    return mermaid;
  }

  public visualize(
    messages: Message[],
    edges: { from: string; to: string; label: string }[],
    advancedOptions: AdvancedGraphOptions
  ): string {
    const nodes: Record<string, Message | null> = {};
    const nodeIds: string[] = [];

    // Map messages to nodes, ensuring all nodes are represented
    messages.forEach((msg, index) => {
      const nodeId = `N${index}`;
      nodes[nodeId] = msg;
      nodeIds.push(nodeId);
    });

    // Ensure all nodes mentioned in edges are present, even if they don't correspond to a message index
    const allNodeIds = new Set<string>();
    edges.forEach(edge => {
      allNodeIds.add(edge.from);
      allNodeIds.add(edge.to);
    });

    // Merge message nodes with explicitly defined nodes from edges/options
    const finalNodes: Record<string, Message | null> = { ...nodes};
    allNodeIds.forEach(id => {
        if (!finalNodes[id]) {
            finalNodes[id] = null; // Placeholder for nodes defined only by edges
        }
    });

    return this.generateMermaidGraph(finalNodes, edges, advancedOptions);
  }
}