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

interface GraphNode {
  id: string;
  type: "start" | "process" | "condition" | "parallel" | "end";
  label: string;
  metadata: Record<string, any>;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  constructor() {}

  private addNode(id: string, type: GraphNode["type"], label: string, metadata: Record<string, any> = {}): void {
    this.nodes.push({ id, type, label, metadata });
  }

  private addEdge(from: string, to: string, label: string, condition?: string): void {
    this.edges.push({ from, to, label, condition });
  }

  public buildGraph(
    messages: Message[],
    initialNodeId: string = "Start",
  ): void {
    this.nodes = [];
    this.edges = [];

    this.addNode(initialNodeId, "start", "Start");

    let currentNodeId: string = initialNodeId;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let nextNodeId: string;

      if (message.role === "user") {
        const nodeId = `User_${i}`;
        this.addNode(nodeId, "process", `User Input: ${message.content.substring(0, 30)}...`);
        this.addEdge(currentNodeId, nodeId, "Triggers", undefined);
        currentNodeId = nodeId;
      } else if (message.role === "assistant") {
        const nodeId = `Assistant_${i}`;
        this.addNode(nodeId, "process", "Assistant Response");
        this.addEdge(currentNodeId, nodeId, "Generates", undefined);
        currentNodeId = nodeId;

        if (message.content.some(block => block.type === "tool_use")) {
          const toolUseBlock = message.content.find(
            (block) => block.type === "tool_use"
          ) as ToolUseBlock;
          const toolCallNodeId = `ToolCall_${toolUseBlock.id}`;
          this.addNode(toolCallNodeId, "process", `Call Tool: ${toolUseBlock.name}`, {
            tool_id: toolUseBlock.id,
            name: toolUseBlock.name,
          });
          this.addEdge(nodeId, toolCallNodeId, "Calls Tool", undefined);
          currentNodeId = toolCallNodeId;
        }
      } else if (message.role === "tool") {
        const nodeId = `ToolResult_${message.tool_use_id}`;
        this.addNode(nodeId, "process", `Tool Result Received: ${message.content.substring(0, 30)}...`);
        this.addEdge(currentNodeId, nodeId, "Receives Result", undefined);
        currentNodeId = nodeId;
      }
    }

    this.addNode("End", "end", "End");
    this.addEdge(currentNodeId, "End", "Completes");
  }

  public addConditionalBranch(
    fromId: string,
    conditionLabel: string,
    toTrueId: string,
    toFalseId: string,
  ): void {
    this.addNode(
      "Condition",
      "condition",
      `Check Condition: ${conditionLabel}`,
      { condition: conditionLabel }
    );
    this.addEdge(fromId, "Condition", "Evaluates", undefined);
    this.addEdge("Condition", toTrueId, "True", conditionLabel);
    this.addEdge("Condition", toFalseId, "False", undefined);
  }

  public addParallelSplit(
    fromId: string,
    splitLabel: string,
    targets: string[],
  ): void {
    const splitNodeId = `Parallel_${Date.now()}`;
    this.addNode(splitNodeId, "parallel", `Parallel Split: ${splitLabel}`, {
      targets: targets,
    });
    this.addEdge(fromId, splitNodeId, "Splits Into", undefined);

    for (const targetId of targets) {
      this.addEdge(splitNodeId, targetId, "Path", undefined);
    }
  }

  public generateMermaidDiagram(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions = new Map<string, string>();
    for (const node of this.nodes) {
      let label = node.label;
      let style = "";

      switch (node.type) {
        case "start":
          style = "fill:#ccf,stroke:#333,stroke-width:2px";
          break;
        case "end":
          style = "fill:#cfc,stroke:#333,stroke-width:2px";
          break;
        case "condition":
          style = "fill:#ffc,stroke:#f90,stroke-width:2px";
          break;
        case "parallel":
          style = "fill:#cff,stroke:#09f,stroke-width:2px";
          break;
        case "process":
          break;
      }
      nodeDefinitions.set(node.id, `${node.id["${node.type.toUpperCase()}"]${style}`);
    }

    // 2. Define Edges
    for (const edge of this.edges) {
      let link = `${edge.from} -->|${edge.label}| ${edge.to}`;
      if (edge.condition) {
        link = `${edge.from} -->|${edge.label} (${edge.condition})| ${edge.to}`;
      }
      mermaid += `  ${link};\n`;
    }

    // 3. Handle advanced flow control syntax (subgraphs/links)
    // For simplicity in this advanced version, we rely on the explicit node definitions
    // and the structure defined by addConditionalBranch/addParallelSplit.

    return mermaid.trim();
  }

  public generateAdvancedMermaidDiagram(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions = new Map<string, string>();
    for (const node of this.nodes) {
      let label = node.label;
      let style = "";

      switch (node.type) {
        case "start":
          style = "fill:#ccf,stroke:#333,stroke-width:2px";
          break;
        case "end":
          style = "fill:#cfc,stroke:#333,stroke-width:2px";
          break;
        case "condition":
          style = "fill:#ffc,stroke:#f90,stroke-width:2px";
          break;
        case "parallel":
          style = "fill:#cff,stroke:#09f,stroke-width:2px";
          break;
        case "process":
          break;
      }
      nodeDefinitions.set(node.id, `${node.id["${node.type.toUpperCase()}"]${style}`);
    }

    // 2. Define Edges
    for (const edge of this.edges) {
      let link = `${edge.from} -->|${edge.label}| ${edge.to}`;
      if (edge.condition) {
        link = `${edge.from} -->|${edge.label} (${edge.condition})| ${edge.to}`;
      }
      mermaid += `  ${link};\n`;
    }

    // 3. Structure for advanced flow (Mermaid Subgraphs/Grouping)
    // This section ensures that parallel/conditional logic is visually grouped if possible.
    // Since Mermaid doesn't have native 'if/else' nodes, we simulate it with subgraphs or explicit links.

    // Check for conditional branches added via the helper method
    const conditionNodes = this.nodes.filter(n => n.type === "condition");
    for (const node of conditionNodes) {
        const conditionEdges = this.edges.filter(e => e.from === node.id);
        if (conditionEdges.length === 2) {
            const trueEdge = conditionEdges.find(e => e.label.includes("True"));
            const falseEdge = conditionEdges.find(e => e.label.includes("False"));

            if (trueEdge && falseEdge) {
                mermaid += `\nsubgraph Conditional Branch (${node.metadata.condition})\n`;
                mermaid += `  ${node.id} -->|True| ${trueEdge.to};\n`;
                mermaid += `  ${node.id} -->|False| ${falseEdge.to};\n`;
                mermaid += `end\n`;
            }
        }
    }

    // Check for parallel splits
    const parallelNodes = this.nodes.filter(n => n.type === "parallel");
    for (const node of parallelNodes) {
        mermaid += `\nsubgraph Parallel Execution (${node.metadata.targets.join(', ')})\n`;
        const outgoingEdges = this.edges.filter(e => e.from === node.id);
        for (const edge of outgoingEdges) {
            mermaid += `  ${node.id} -->|${edge.label}| ${edge.to};\n`;
        }
        mermaid += `end\n`;
    }


    return mermaid.trim();
  }
}