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

interface GraphContext {
  messages: Message[];
  // Assume a structure representing the actual dependency graph traversal result
  // For this implementation, we'll simulate the necessary graph structure derived from messages.
  // A real implementation would take a more complex graph object.
  getDependencies(messageIndex: number): {
    sourceId: string;
    targetId: string;
    relationship: string;
    condition?: string;
  }[];
}

interface NodeDefinition {
  id: string;
  label: string;
  type: "start" | "process" | "tool_call" | "end";
}

interface EdgeDefinition {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: Map<string, NodeDefinition> = new Map();
  private edges: EdgeDefinition[] = [];

  private _generateNodeId(messageIndex: number, role: string): string {
    return `N${messageIndex}_${role.toUpperCase()}`;
  }

  private _generateEdgeId(fromId: string, toId: string): string {
    return `E_${fromId}_${toId}`;
  }

  private _processMessageForNodes(message: Message, index: number): NodeDefinition {
    let nodeId: string;
    let label: string;
    let nodeType: NodeDefinition["type"] = "process";

    if (message.role === "user") {
      nodeId = this._generateNodeId(index, "user");
      label = `User Input: ${message.content.substring(0, 30)}...`;
    } else if (message.role === "assistant") {
      nodeId = this._generateNodeId(index, "assistant");
      label = `Assistant Response`;
      nodeType = "process";
    } else if (message.role === "tool") {
      nodeId = this._generateNodeId(index, "tool");
      label = `Tool Result: ${message.tool_use_id}`;
      nodeType = "tool_call";
    } else {
      nodeId = this._generateNodeId(index, "unknown");
      label = `Unknown Message`;
    }

    this.nodes.set(nodeId, { id: nodeId, label: label, type: nodeType });
    return this.nodes.get(nodeId)!;
  }

  private _processToolUseBlock(block: ToolUseBlock, sourceNodeId: string, messageIndex: number): {
    nodeId: string;
    edge: EdgeDefinition;
  } {
    const toolCallId = `T${messageIndex}_${block.id}`;
    const toolNodeId = `Tool_${toolCallId}`;

    this.nodes.set(toolNodeId, {
      id: toolNodeId,
      label: `Call: ${block.name}(${JSON.stringify(block.input)})`,
      type: "tool_call",
    });

    const edge: EdgeDefinition = {
      from: sourceNodeId,
      to: toolNodeId,
      label: "Calls Tool",
    };
    this.edges.push(edge);

    return { nodeId: toolNodeId, edge };
  }

  private _traverseAndCollect(graphContext: GraphContext): void {
    this.nodes.clear();
    this.edges = [];

    let lastProcessedNodeId: string | null = null;

    graphContext.messages.forEach((message, messageIndex) => {
      const messageNode = this._processMessageForNodes(message, messageIndex);
      const currentNodeId = messageNode.id;

      if (message.role === "assistant" && message.content.length > 0) {
        const contentBlocks = message.content as ContentBlock[];
        let currentSourceId = currentNodeId;

        contentBlocks.forEach((block, blockIndex) => {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const { nodeId: toolNodeId, edge: toolEdge } = this._processToolUseBlock(
              toolUseBlock,
              currentSourceId,
              messageIndex
            );
            // Update current source ID to the tool call node for subsequent steps in this message
            currentSourceId = toolNodeId;
          } else if (block.type === "text") {
            // Text block might just update the label or act as a simple transition
          }
        });
      }

      // Simulate dependency collection based on context (e.g., tool results feeding back)
      const dependencies = graphContext.getDependencies(messageIndex);
      dependencies.forEach(dep => {
        const edge: EdgeDefinition = {
          from: dep.sourceId,
          to: dep.targetId,
          label: dep.relationship,
          condition: dep.condition,
        };
        this.edges.push(edge);
      });
    });
  }

  private _generateMermaidSyntax(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    this.nodes.forEach(node => {
      let style = "";
      switch (node.type) {
        case "start":
          style = "fill:#ccffcc,stroke:#339933";
          break;
        case "end":
          style = "fill:#ffcccc,stroke:#cc3333";
          break;
        case "tool_call":
          style = "fill:#ffffcc,stroke:#cccc33";
          break;
        case "process":
        default:
          style = "fill:#cceeff,stroke:#336699";
          break;
      }
      mermaid += `    ${node.id}["${node.label}"]:::${node.type};\n`;
    });

    // 2. Define Edges
    this.edges.forEach(edge => {
      let link = `${edge.from} --> ${edge.to}`;
      let label = `\n    ${link}${edge.condition ? `\n    --${edge.condition}--` : ''}${edge.label}`;
      mermaid += label + "\n";
    });

    // 3. Define Classes/Styling (Optional but good practice)
    mermaid += "\n%% Styling\n";
    mermaid += "classDef start fill:#ccffcc,stroke:#339933;\n";
    mermaid += "classDef end fill:#ffcccc,stroke:#cc3333;\n";
    mermaid += "classDef tool_call fill:#ffffcc,stroke:#cccc33;\n";
    mermaid += "classDef process fill:#cceeff,stroke:#336699;\n";

    return mermaid;
  }

  public generateMermaidGraph(graphContext: GraphContext): string {
    this._traverseAndCollect(graphContext);
    return this._generateMermaidSyntax();
  }
}