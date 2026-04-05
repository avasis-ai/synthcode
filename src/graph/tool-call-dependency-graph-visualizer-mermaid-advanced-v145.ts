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

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV145 {
  private graph: Message[];

  constructor(graph: Message[]) {
    this.graph = graph;
  }

  private getNodeLabel(message: Message): string {
    if ("user" in message) {
      return `User Input: "${(message as UserMessage).content.substring(0, 30)}..."`;
    }
    if ("assistant" in message) {
      const assistantMessage = message as AssistantMessage;
      const toolUses = (assistantMessage.content as ContentBlock[]).filter(
        (block) => (block as ToolUseBlock).type === "tool_use"
      );
      if (toolUses.length > 0) {
        return `Assistant Calls: ${toolUses.map(t => t.name).join(", ")}`;
      }
      return `Assistant Response: "${(assistantMessage.content as ContentBlock[]).map(b => b.type === "text" ? (b as TextBlock).text : "").join(" ") || "No text content"}"`;
    }
    if ("tool" in message) {
      const toolResultMessage = message as ToolResultMessage;
      return `Tool Result (${toolResultMessage.tool_use_id}): ${toolResultMessage.content.substring(0, 30)}...`;
    }
    return "Unknown Message";
  }

  private getMermaidNodeId(message: Message): string {
    const index = this.graph.indexOf(message);
    return `node${index}`;
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD\n";
    let nodeDefinitions: Record<string, string> = {};
    let edges: string[] = [];

    this.graph.forEach((message, index) => {
      const nodeId = this.getMermaidNodeId(message);
      const label = this.getNodeLabel(message).replace(/"/g, '\\"');
      nodeDefinitions[nodeId] = `    ${nodeId}["${label}"]`;
    });

    // Simple sequential edges (A -> B -> C)
    for (let i = 0; i < this.graph.length - 1; i++) {
      const sourceId = this.getMermaidNodeId(this.graph[i]);
      const targetId = this.getMermaidNodeId(this.graph[i + 1]);
      edges.push(`${sourceId} --> ${targetId}`);
    }

    // Advanced logic placeholder: In a real scenario, this would analyze ToolUseBlock dependencies
    // and conditional logic within the content blocks to create complex flows.
    // For this advanced version, we simulate a conditional branch after the first tool call.
    if (this.graph.length > 2) {
      const node1Id = this.getMermaidNodeId(this.graph[1]);
      const node2Id = this.getMermaidNodeId(this.graph[2]);
      if (node1Id.includes("tool_use") && node2Id.includes("tool")) {
        mermaid += "\n%% Advanced Flow Simulation (Conditional/Branching)\n";
        mermaid += `    ${node1Id} -->|Success| branchA\n`;
        mermaid += `    ${node1Id} -->|Failure| branchB\n`;
        mermaid += `    branchA["Conditional Success Path"] --> ${node2Id}\n`;
        mermaid += `    branchB["Conditional Failure Path"] --> ${node2Id}\n`;
      }
    }

    mermaid += "\n%% Node Definitions\n";
    Object.values(nodeDefinitions).forEach(def => {
      mermaid += def + "\n";
    });

    mermaid += "\n%% Edges\n";
    edges.forEach(edge => {
      mermaid += edge + "\n";
    });

    return mermaid;
  }

  public generateMermaidSyntax(): string {
    return this.generateMermaidGraph();
  }
}