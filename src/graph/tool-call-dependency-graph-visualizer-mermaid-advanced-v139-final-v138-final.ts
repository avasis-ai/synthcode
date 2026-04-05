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

export interface GraphContext extends Record<string, any> {
  finalStateMarkers: Set<string>;
}

export interface ToolCallDependencyGraph {
  messages: Message[];
  context: GraphContext;
}

interface NodeDefinition {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool";
  content: string;
}

interface EdgeDefinition {
  fromId: string;
  toId: string;
  label: string;
  condition?: string;
  isFinal?: boolean;
}

export class MermaidGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private getNodeDefinitions(): Map<string, NodeDefinition> {
    const nodeMap = new Map<string, NodeDefinition>();
    let nodeIdCounter = 1;

    this.graph.messages.forEach((message, index) => {
      let nodeId: string;
      let content: string;
      let type: "user" | "assistant" | "tool";

      if ("role" in message) {
        if (message.role === "user") {
          type = "user";
          content = message.content;
          nodeId = `U${index}`;
        } else if (message.role === "assistant") {
          type = "assistant";
          content = this.extractAssistantContent(message.content);
          nodeId = `A${index}`;
        } else if (message.role === "tool") {
          type = "tool";
          content = `Tool Result (${message.tool_use_id}): ${message.content}`;
          nodeId = `T${index}`;
        } else {
          return;
        }
      } else {
        return;
      }

      nodeMap.set(nodeId, { id: nodeId, label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`, type: type, content: content });
    });

    return nodeMap;
  }

  private extractAssistantContent(contentBlocks: ContentBlock[]): string {
    let text = "";
    contentBlocks.forEach((block) => {
      if (block.type === "text") {
        text += (block as TextBlock).text + "\n";
      } else if (block.type === "tool_use") {
        const toolUse = block as ToolUseBlock;
        text += `\n[Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})]\n`;
      } else if (block.type === "thinking") {
        const thinking = block as ThinkingBlock;
        text += `\n--- Thinking ---\n${thinking.thinking}\n----------------\n`;
      }
    });
    return text.trim();
  }

  private getEdgeDefinitions(): EdgeDefinition[] {
    const edges: EdgeDefinition[] = [];
    let lastNodeId: string | null = null;

    for (let i = 0; i < this.graph.messages.length; i++) {
      const message = this.graph.messages[i];
      const currentNodeId = `U${i}`.replace(/U/g, 'A').replace(/A/g, 'T'); // Simplified ID logic for demonstration

      if (i > 0) {
        const previousMessage = this.graph.messages[i - 1];
        const previousNodeId = `U${i - 1}`.replace(/U/g, 'A').replace(/A/g, 'T');

        // Simple sequential edge creation for demonstration
        edges.push({
          fromId: previousNodeId,
          toId: currentNodeId,
          label: "->",
        });
      }
      lastNodeId = currentNodeId;
    }
    return edges;
  }

  public renderMermaidGraph(): string {
    const nodeMap = this.getNodeDefinitions();
    const edges = this.getEdgeDefinitions();

    let mermaidString = "graph TD;\n";

    // 1. Define Nodes
    nodeMap.forEach((node, id) => {
      let style = "";
      if (node.type === "user") {
        style = "fill:#ccf,stroke:#333";
      } else if (node.type === "assistant") {
        style = "fill:#cfc,stroke:#333";
      } else if (node.type === "tool") {
        style = "fill:#ffc,stroke:#333";
      }
      mermaidString += `${id}["${node.label}\\n(${node.type})\\n${node.content.substring(0, 100)}..."]:::${node.type};\n`;
    });

    // 2. Define Edges
    edges.forEach((edge, index) => {
      let edgeLabel = edge.label;
      let linkStyle = "";

      if (edge.isFinal) {
        linkStyle = "stroke:red,stroke-width:2px,stroke-dasharray: 5 5";
      }

      mermaidString += `${edge.fromId} -- ${edgeLabel} --> ${edge.toId}${linkStyle};\n`;
    });

    // 3. Apply Classes (Conceptual)
    mermaidString += "\nclassDef user fill:#ccf,stroke:#333;\n";
    mermaidString += "classDef assistant fill:#cfc,stroke:#333;\n";
    mermaidString += "classDef tool fill:#ffc,stroke:#333;\n";

    return mermaidString.trim();
  }
}

export function visualizeToolCallDependencyGraph(graph: ToolCallDependencyGraph): string {
  const visualizer = new MermaidGraphVisualizer(graph);
  return visualizer.renderMermaidGraph();
}