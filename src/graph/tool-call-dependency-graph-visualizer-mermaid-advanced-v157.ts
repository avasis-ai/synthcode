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

interface DependencyGraph {
  nodes: Message[];
  dependencies: {
    from: string;
    to: string;
    type: "calls" | "follows" | "conditional";
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV157 {
  private graphContext: DependencyGraph;

  constructor(graphContext: DependencyGraph) {
    this.graphContext = graphContext;
  }

  private getNodeId(message: Message): string {
    if (message.role === "user") {
      return `User:${message.content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
    }
    if (message.role === "assistant") {
      return `Assistant:${message.content.length}`;
    }
    if (message.role === "tool") {
      return `Tool:${message.tool_use_id}`;
    }
    return "UnknownNode";
  }

  private generateNodeLabel(message: Message): string {
    if (message.role === "user") {
      return `User Input: "${message.content.substring(0, 30)}..."`;
    }
    if (message.role === "assistant") {
      const toolUses = (message as AssistantMessage).content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );
      if (toolUses.length > 0) {
        return `Assistant Calls: ${toolUses.map(t => t.name).join(", ")}`;
      }
      return `Assistant Response: "${message.content.substring(0, 30)}..."`;
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
    }
    return "Generic Node";
  }

  private generateMermaidGraph(graph: DependencyGraph): string {
    let mermaid = "graph TD;\n";
    let nodeDefinitions: string[] = [];
    let links: string[] = [];

    // 1. Define Nodes
    const uniqueNodes = new Set<string>();
    graph.nodes.forEach(node => {
      const id = this.getNodeId(node);
      uniqueNodes.add(id);
      nodeDefinitions.push(`${id}["${this.generateNodeLabel(node)}"]`);
    });

    // 2. Define Links (Dependencies)
    graph.dependencies.forEach((dep) => {
      const fromId = this.getNodeId(graph.nodes.find(n => this.getNodeId(n) === dep.from) || { role: "user", content: "" } as Message);
      const toId = this.getNodeId(graph.nodes.find(n => this.getNodeId(n) === dep.to) || { role: "user", content: "" } as Message);

      let linkType = "-->";
      let linkLabel = "";

      if (dep.type === "calls") {
        linkType = "-->";
        linkLabel = "Calls";
      } else if (dep.type === "follows") {
        linkType = "-->";
        linkLabel = "Follows";
      } else if (dep.type === "conditional") {
        linkType = "-->";
        linkLabel = `Condition: ${dep.condition || "?"}`;
      }

      links.push(`${fromId} ${linkType} ${toId} :: ${linkLabel}`);
    });

    // 3. Assemble Mermaid String
    mermaid += nodeDefinitions.join("\n");
    mermaid += "\n";
    mermaid += links.join("\n");

    return mermaid;
  }

  public generateMermaidString(): string {
    return this.generateMermaidGraph(this.graphContext);
  }
}