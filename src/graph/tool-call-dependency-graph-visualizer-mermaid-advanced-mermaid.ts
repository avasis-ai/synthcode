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

type FlowControlNode = "if" | "loop";

interface DependencyNode {
  id: string;
  type: "call" | "flow";
  label: string;
  details: Record<string, any>;
  next?: string[];
  condition?: string;
}

interface GraphStructure {
  nodes: DependencyNode[];
  edges: { from: string; to: string; label?: string }[];
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid {
  private graph: GraphStructure = {
    nodes: [],
    edges: [],
  };

  private addNode(id: string, type: "call" | "flow", label: string, details: Record<string, any> = {}, next?: string[], condition?: string): void {
    this.graph.nodes.push({
      id,
      type,
      label,
      details,
      next,
      condition,
    });
  }

  private addEdge(from: string, to: string, label?: string): void {
    this.graph.edges.push({ from, to, label });
  }

  public buildGraph(
    messages: Message[],
    dependencies: {
      sourceId: string;
      targetId: string;
      label?: string;
      flowControl?: {
        type: FlowControlNode;
        condition?: string;
      };
    }[]
  ): GraphStructure {
    this.graph = { nodes: [], edges: [] };

    // 1. Process Messages to create initial call nodes
    let nodeIdCounter = 1;
    const nodeMap: Map<string, DependencyNode> = new Map();

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMsg = message as AssistantMessage;
        for (const block of assistantMsg.content) {
          if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            const nodeId = `call_${nodeIdCounter++}`;
            const node: DependencyNode = {
              id: nodeId,
              type: "call",
              label: `Tool Call: ${toolUse.name}`,
              details: {
                tool_use_id: toolUse.id,
                input: toolUse.input,
              },
              next: [],
            };
            this.addNode(nodeId, "call", node.label, node.details);
            nodeMap.set(nodeId, node);
          }
        }
      }
    }

    // 2. Process Explicit Dependencies (including flow control)
    for (const dep of dependencies) {
      const { sourceId, targetId, label, flowControl } = dep;

      if (flowControl) {
        const flowNodeId = `flow_${Math.random().toString(36).substring(2, 9)}`;
        const flowNodeLabel = `${flowControl.type.toUpperCase()} (${flowControl.condition || ""})`;

        // Add the flow control node
        this.addNode(
          flowNodeId,
          "flow",
          flowNodeLabel,
          { condition: flowControl.condition },
          undefined,
          flowControl.condition
        );
        nodeMap.set(flowNodeId, {
          id: flowNodeId,
          type: "flow",
          label: flowNodeLabel,
          details: { condition: flowControl.condition },
          next: [],
          condition: flowControl.condition,
        });

        // Link source to flow node
        this.addEdge(sourceId, flowNodeId, label);

        // Link flow node to target (This assumes the targetId is the next logical step)
        this.addEdge(flowNodeId, targetId, label);

      } else {
        // Standard sequential dependency
        this.addEdge(sourceId, targetId, label);
      }
    }

    return this.graph;
  }

  private renderNode(node: DependencyNode): string {
    let definition = "";
    let style = "";

    if (node.type === "call") {
      definition = `-->|${node.label}| ${node.id}["${node.label}"];`;
      style = `classDef toolCall fill:#bbf,stroke:#333,stroke-width:2px;`;
    } else if (node.type === "flow") {
      definition = `-->|${node.label || "Flow"} ${node.id}["${node.label}"];`;
      style = `classDef flowControl fill:#ffc,stroke:#c60,stroke-width:2px;`;
    }

    return `${definition}\n${style}`;
  }

  public renderMermaid(graph: GraphStructure): string {
    let mermaidString = "graph TD\n";
    mermaidString += "%% Tool Call Dependency Graph\n";

    // 1. Define all nodes and their basic structure
    graph.nodes.forEach(node => {
      mermaidString += `    ${node.id}["${node.label}"];\n`;
    });

    // 2. Define all edges
    graph.edges.forEach(edge => {
      const label = edge.label ? ` |${edge.label}|` : "";
      mermaidString += `    ${edge.from} ${label} --> ${edge.to};\n`;
    });

    // 3. Define classes/styles for advanced visualization
    mermaidString += "\n%% Styling Definitions\n";
    mermaidString += "classDef toolCall fill:#bbf,stroke:#333,stroke-width:2px;\n";
    mermaidString += "classDef flowControl fill:#ffc,stroke:#c60,stroke-width:2px;\n";

    // 4. Apply classes
    graph.nodes.forEach(node => {
      if (node.type === "call") {
        mermaidString += `class ${node.id} toolCall;\n`;
      } else if (node.type === "flow") {
        mermaidString += `class ${node.id} flowControl;\n`;
      }
    });

    return mermaidString.trim();
  }
}

export {
  ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid,
}