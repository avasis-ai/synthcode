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

export class ToolCallDependencyGraphVisualizer {
  private graphContext: {
    nodes: Map<string, any>;
    edges: any[];
    flowControl: {
      type: "conditional" | "loop";
      sourceId: string;
      targetId: string | string[];
      condition?: string;
    }[];
  };

  constructor(graphContext: {
    nodes: Map<string, any>;
    edges: any[];
    flowControl: {
      type: "conditional" | "loop";
      sourceId: string;
      targetId: string | string[];
      condition?: string;
    }[];
  }) {
    this.graphContext = {
      nodes: graphContext.nodes,
      edges: graphContext.edges,
      flowControl: graphContext.flowControl,
    };
  }

  private generateNodeDefinition(nodeId: string, nodeData: any): string {
    let content = `id["${nodeId}"]\n`;
    if (nodeData.type === "tool_call") {
      const toolUse: ToolUseBlock = nodeData.toolUse as ToolUseBlock;
      content += `  Tool Call: ${toolUse.name}\n`;
      content += `  Input: ${JSON.stringify(toolUse.input, null, 2).replace(/\n/g, "\\n")}\n`;
    } else if (nodeData.type === "step") {
      content += `  Description: ${nodeData.description}\n`;
    } else {
      content += `  Content: ${nodeData.content || "N/A"}\n`;
    }
    return content;
  }

  private generateEdgeDefinition(edge: any): string {
    let edgeStr = "";
    if (edge.type === "dependency") {
      edgeStr = `--> "${edge.targetId}" : Depends on\n`;
    } else if (edge.type === "flow") {
      if (edge.flowControl.type === "conditional") {
        edgeStr = `--> "${edge.targetId}" : ${edge.flowControl.condition || "Conditional Branch"}\n`;
      } else if (edge.flowControl.type === "loop") {
        edgeStr = `--> "${edge.targetId}" : Loop Back\n`;
      }
    }
    return edgeStr;
  }

  public generateMermaidSyntax(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    mermaid += "%% --- Nodes Definition ---\n";
    for (const [id, nodeData] of this.graphContext.nodes.entries()) {
      mermaid += `subgraph ${id} [${nodeData.label || id}]\n`;
      mermaid += this.generateNodeDefinition(id, nodeData);
      mermaid += "end\n";
    }

    // 2. Define Edges (Dependencies and Flow Control)
    mermaid += "\n%% --- Edges Definition ---\n";
    for (const edge of this.graphContext.edges) {
      mermaid += this.generateEdgeDefinition(edge);
    }

    // 3. Add Flow Control Specifics (If not fully covered by edges)
    mermaid += "\n%% --- Flow Control Logic ---\n";
    for (const flow of this.graphContext.flowControl) {
      if (flow.type === "conditional") {
        mermaid += `subgraph ${flow.sourceId} --> ${flow.targetId} : IF ${flow.condition || "Condition Met"}\n`;
      } else if (flow.type === "loop") {
        mermaid += `subgraph ${flow.sourceId} --> ${flow.targetId} : LOOP\n`;
      }
    }

    return mermaid.trim();
  }
}