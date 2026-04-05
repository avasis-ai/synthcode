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

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV148Final {
  private messages: Message[];
  private graphNodes: Map<string, { id: string; label: string; type: string }>;
  private graphEdges: { from: string; to: string; label: string }[];

  constructor(messages: Message[]) {
    this.messages = messages;
    this.graphNodes = new Map<string, { id: string; label: string; type: string }>();
    this.graphEdges = [];
  }

  private getNodeLabel(message: Message): string {
    if ("user" === message.role) {
      return `User: ${message.content.substring(0, 30)}...`;
    }
    if ("assistant" === message.role) {
      return `Assistant: ${message.content.length > 0 ? "Response" : "Empty"}`;
    }
    if ("tool" === message.role) {
      return `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
    }
    return "Unknown Message";
  }

  private addNode(id: string, label: string, type: string): void {
    if (!this.graphNodes.has(id)) {
      this.graphNodes.set(id, { id, label, type });
    }
  }

  private addEdge(fromId: string, toId: string, label: string): void {
    this.graphEdges.push({ from: fromId, to: toId, label });
  }

  private processContentBlock(block: ContentBlock, sourceId: string, targetId: string): void {
    if (block.type === "text") {
      const textBlock = block as TextBlock;
      this.addNode(sourceId, `Text: ${textBlock.text.substring(0, 30)}...`, "text");
      this.addEdge(sourceId, targetId, `-> ${textBlock.text.substring(0, 10)}`);
    } else if (block.type === "tool_use") {
      const toolUseBlock = block as ToolUseBlock;
      const nodeId = `${sourceId}_tool_${toolUseBlock.id}`;
      this.addNode(nodeId, `Tool Call: ${toolUseBlock.name}`, "tool_use");
      this.addEdge(sourceId, nodeId, `Call ${toolUseBlock.name}`);
      this.addEdge(nodeId, targetId, `Awaits Result`);
    } else if (block.type === "thinking") {
      const thinkingBlock = block as ThinkingBlock;
      const nodeId = `${sourceId}_think`;
      this.addNode(nodeId, `Thinking: ${thinkingBlock.thinking.substring(0, 30)}...`, "thinking");
      this.addEdge(sourceId, nodeId, `Thinking`);
      this.addEdge(nodeId, targetId, `Proceeds`);
    }
  }

  private traverseGraph(message: Message, index: number): void {
    const sourceId = `msg_${index}`;
    this.addNode(sourceId, this.getNodeLabel(message), message.role);

    if ("assistant" === message.role && message.content.length > 0) {
      const contentBlocks = message.content;
      let currentSourceId = sourceId;

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const targetId = i < contentBlocks.length - 1 ? `msg_${index + 1}` : `end`;
        this.processContentBlock(block, currentSourceId, targetId);
        currentSourceId = block.type === "text" ? `${sourceId}_text_${i}` : (block.type === "tool_use" ? `${sourceId}_tool_${(block as ToolUseBlock).id}` : `${sourceId}_think`);
      }
    } else if ("tool" === message.role) {
      const toolResultId = `${message.tool_use_id}_result`;
      this.addNode(toolResultId, `Tool Result: ${message.content.substring(0, 30)}...`, "tool_result");
      this.addEdge(sourceId, toolResultId, "Result Received");
    }
  }

  private buildGraphStructure(): void {
    this.graphNodes.clear();
    this.graphEdges = [];

    for (let i = 0; i < this.messages.length; i++) {
      this.traverseGraph(this.messages[i], i);
    }
  }

  private finalizeGraphStructure(): void {
    // Finalization Pass: Resolve unattached edges and ensure all nodes have a defined path.
    // For simplicity in this implementation, we ensure the last node connects to a conceptual 'End' state.
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      const lastNodeId = `msg_${this.messages.length - 1}`;
      if (!this.graphNodes.has("end")) {
        this.addNode("end", "End State", "end");
      }
      // Ensure the last message explicitly connects to the end state if it hasn't already.
      if (!this.graphEdges.some(e => e.to === "end")) {
        this.graphEdges.push({ from: lastNodeId, to: "end", label: "Finished" });
      }
    }
  }

  private generateMermaidSyntax(): string {
    let mermaid = "graph TD\n";
    mermaid += "%% Tool Call Dependency Graph\n";

    const nodeDefinitions = Array.from(this.graphNodes.values());
    const uniqueNodeIds = new Set(nodeDefinitions.map(n => n.id));

    // 1. Define Nodes
    nodeDefinitions.forEach(node => {
      let shape = "[]";
      if (node.type === "tool_use") shape = "{ }";
      if (node.type === "thinking") shape = "(( ))";
      mermaid += `  ${node.id}["${node.label}"]:::${node.type.replace('_', '')}${shape}\n`;
    });

    // 2. Define Edges
    this.graphEdges.forEach(edge => {
      mermaid += `  ${edge.from} -- "${edge.label}" --> ${edge.to};\n`;
    });

    // 3. Define Styles (Classes)
    mermaid += "\n%% Styling\n";
    mermaid += ".user { fill:#ccf,stroke:#333,stroke-width:2px }\n";
    mermaid += ".assistant { fill:#cfc,stroke:#333,stroke-width:2px }\n";
    mermaid += ".tool_result { fill:#ffc,stroke:#333,stroke-width:2px }\n";
    mermaid += ".tool_use { fill:#ddf,stroke:#333,stroke-width:2px }\n";
    mermaid += ".thinking { fill:#fdd,stroke:#333,stroke-width:2px }\n";
    mermaid += ".end { fill:#eee,stroke:#333,stroke-width:2px }\n";

    return mermaid;
  }

  public visualize(finalize: boolean = false): string {
    this.buildGraphStructure();

    if (finalize) {
      this.finalizeGraphStructure();
    }

    return this.generateMermaidSyntax();
  }
}