import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface AdvancedGraphContext {
  messages: Message[];
  dependencies: {
    sourceId: string;
    targetId: string;
    type: "direct" | "conditional" | "loop";
    condition?: string;
    loopIterations?: number;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV159 {
  private graphContext: AdvancedGraphContext;

  constructor(context: AdvancedGraphContext) {
    this.graphContext = context;
  }

  private generateNodeId(message: Message, index: number): string {
    const role = message.role === "user" ? "User" : message.role === "assistant" ? "Assistant" : "Tool";
    return `${role}_${index}`;
  }

  private generateMessageNodes(messages: Message[]): string[] {
    const nodes: string[] = [];
    messages.forEach((msg, index) => {
      const nodeId = this.generateNodeId(msg, index);
      let content = "";

      if (msg.role === "user") {
        content = `User Input: "${msg.content}"`;
      } else if (msg.role === "assistant") {
        const blocks = msg.content as ContentBlock[];
        const textParts: string[] = [];
        blocks.forEach(block => {
          if (block.type === "text") {
            textParts.push(block.text);
          } else if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            textParts.push(`Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`);
          } else if (block.type === "thinking") {
            textParts.push(`Thinking: ${block.thinking}`);
          }
        });
        content = `Assistant Response:\n${textParts.join("\n")}`;
      } else if (msg.role === "tool") {
        content = `Tool Result (${msg.tool_use_id}): ${msg.content}`;
      }

      nodes.push(`  ${nodeId}["${content.replace(/"/g, "'")}"]`);
    });
    return nodes;
  }

  private generateDependencyEdges(dependencies: {
    sourceId: string;
    targetId: string;
    type: "direct" | "conditional" | "loop";
    condition?: string;
    loopIterations?: number;
  }[]): string[] {
    const edges: string[] = [];
    dependencies.forEach(dep => {
      let edgeSyntax = `${dep.sourceId} --> ${dep.targetId}`;

      if (dep.type === "conditional") {
        const conditionText = dep.condition || "Condition Met";
        edgeSyntax = `${dep.sourceId} -- "${conditionText}" --> ${dep.targetId}`;
      } else if (dep.type === "loop") {
        const iterations = dep.loopIterations ? ` (Loop ${dep.loopIterations}x)` : "";
        edgeSyntax = `${dep.sourceId} -- "Loop" --> ${dep.targetId}${iterations}`;
      }
      edges.push(edgeSyntax);
    });
    return edges;
  }

  public renderMermaidGraph(): string {
    const nodes = this.generateMessageNodes(this.graphContext.messages);
    const edges = this.generateDependencyEdges(this.graphContext.dependencies);

    let mermaid = "graph TD\n";
    mermaid += "%% Tool Call Dependency Graph\n";
    mermaid += "%% Nodes\n";
    mermaid += nodes.join("\n") + "\n";

    mermaid += "\n%% Edges\n";
    mermaid += edges.join("\n");

    return mermaid;
  }
}