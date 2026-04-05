import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphContext {
  messages: Message[];
  // New markers for advanced flow control
  conditionalPaths?: {
    condition: string;
    truePath: string;
    falsePath: string;
  }[];
  loopDependencies?: {
    startNodeId: string;
    endNodeId: string;
    condition: string;
  }[];
}

class GraphBuilder {
  private context: GraphContext;
  private graphDefinition: {
    mermaid: string;
    nodes: Map<string, string>;
    links: string[];
  } = {
    mermaid: "",
    nodes: new Map(),
    links: [],
  };

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    return `${rolePrefix}_${message.role}_${index}`;
  }

  private addNode(id: string, label: string): void {
    this.graphDefinition.nodes.set(id, label);
  }

  private addLink(fromId: string, toId: string, label: string = ""): void {
    this.graphDefinition.links.push(`${fromId} -->|${label}| ${toId}`);
  }

  private processMessage(message: Message, index: number): void {
    const nodeId = this.generateNodeId(message, index);
    let label = `Role: ${message.role}`;

    if (message.role === "user") {
      label += `\nContent: ${message.content.substring(0, 30)}...`;
    } else if (message.role === "assistant") {
      const contentBlocks = (message as any).content;
      let contentSummary = "";
      for (const block of contentBlocks) {
        if (block.type === "text") {
          contentSummary += `Text: ${block.text.substring(0, 20)}...`;
        } else if (block.type === "tool_use") {
          contentSummary += `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
        }
      }
      label += `\nContent: ${contentSummary.substring(0, 30)}...`;
    } else if (message.role === "tool") {
      label += `\nTool Result: ${message.content.substring(0, 30)}...`;
    }

    this.addNode(nodeId, label);
  }

  public build(): {
    mermaid: string;
    nodes: Map<string, string>;
    links: string[];
  } {
    let currentNodeId: string | null = null;
    let lastNodeId: string | null = null;

    // 1. Process sequential messages
    this.context.messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      this.processMessage(message, index);

      if (lastNodeId) {
        this.addLink(lastNodeId, nodeId);
      }
      lastNodeId = nodeId;
    });

    // 2. Handle advanced flow control (Conditional/Loop)
    if (this.context.conditionalPaths && this.context.conditionalPaths.length > 0) {
      const condition = this.context.conditionalPaths[0];
      // Assuming the condition applies after the last processed node
      const entryNodeId = lastNodeId || "Start";
      const conditionNodeId = "C_Condition";
      this.addNode(conditionNodeId, `IF ${condition.condition}`);

      this.addLink(entryNodeId || "Start", conditionNodeId, "");
      this.addLink(conditionNodeId, "TruePath", `[${condition.condition} is true]`);
      this.addLink(conditionNodeId, "FalsePath", `[${condition.condition} is false]`);
    }

    if (this.context.loopDependencies && this.context.loopDependencies.length > 0) {
      const loop = this.context.loopDependencies[0];
      const startNodeId = loop.startNodeId;
      const endNodeId = loop.endNodeId;
      const conditionLabel = `[Loop Condition: ${loop.condition}]`;

      // Link the loop entry point to the loop start
      this.addLink("LoopEntry", startNodeId, "Enter Loop");
      // Link the loop end point back to the start, and add the condition link
      this.addLink(endNodeId, startNodeId, `Continue Loop ${conditionLabel}`);
    }

    // 3. Assemble Mermaid Syntax
    let mermaidCode = "graph TD\n";
    mermaidCode += "    %% Nodes Definition\n";
    this.graphDefinition.nodes.forEach((label, id) => {
      mermaidCode += `    ${id}["${label}"]\n`;
    });

    mermaidCode += "\n    %% Links Definition\n";
    this.graphDefinition.links.forEach(link => {
      mermaidCode += `    ${link}\n`;
    });

    return {
      mermaid: mermaidCode,
      nodes: this.graphDefinition.nodes,
      links: this.graphDefinition.links,
    };
  }
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV140 {
  static visualize(context: GraphContext): string {
    const builder = new GraphBuilder(context);
    const { mermaid } = builder.build();
    return mermaid;
  }
}