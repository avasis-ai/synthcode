import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface AdvancedStyleOptions {
  defaultNodeClass?: string;
  toolNodeClass?: string;
  dependencyEdgeClass?: string;
  conditionalBranchStyle?: {
    startNodeId: string;
    endNodeId: string;
    label: string;
    style?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV21 {
  private styleOptions: AdvancedStyleOptions;

  constructor(styleOptions: AdvancedStyleOptions = {}) {
    this.styleOptions = {
      defaultNodeClass: "default",
      toolNodeClass: "tool-call",
      dependencyEdgeClass: "dependency",
      conditionalBranchStyle: [],
      ...styleOptions,
    };
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? message.content.substring(0, 5).replace(/[^a-zA-Z0-9]/g, '') : "empty";
    return `${rolePrefix}-${contentHash}-${index}`;
  }

  private generateMermaidNode(message: Message, index: number, nodeId: string): string {
    let content = "";
    let nodeClass = this.styleOptions.defaultNodeClass || "";

    if (message.role === "user") {
      content = `User Input: ${message.content.substring(0, 50)}...`;
      nodeClass = this.styleOptions.defaultNodeClass || "user";
    } else if (message.role === "assistant") {
      const toolUses = (message as any).content?.filter((block: ContentBlock) => block.type === "tool_use") || [];
      if (toolUses.length > 0) {
        content = `Assistant Action (Tool Calls: ${toolUses.length})`;
        nodeClass = this.styleOptions.toolNodeClass || "assistant-tool";
      } else {
        content = `Assistant Response: ${message.content.length > 0 ? message.content[0].text.substring(0, 50) + "..." : "No content."}`;
      }
    } else if (message.role === "tool") {
      content = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 50)}...`;
      nodeClass = this.styleOptions.toolNodeClass || "tool-result";
    }

    return `    ${nodeId}["${content}"]:::${nodeClass}`;
  }

  private generateMermaidEdge(fromId: string, toId: string, label: string = ""): string {
    const edgeClass = this.styleOptions.dependencyEdgeClass || "dependency";
    return `    ${fromId} -- "${label}" --> ${toId}:::${edgeClass}`;
  }

  private generateConditionalBranchMermaid(branch: AdvancedStyleOptions["conditionalBranchStyle"][number]): string {
    const { startNodeId, endNodeId, label, style } = branch;
    let mermaid = `    ${startNodeId} -- "${label}" --> ${endNodeId}`;
    if (style) {
      mermaid += `:::${style}`;
    }
    return mermaid;
  }

  public renderMermaidGraph(messages: Message[], advancedBranches: AdvancedStyleOptions["conditionalBranchStyle"][] = []): string {
    let mermaidCode = "graph TD\n";
    let nodeDeclarations: string[] = [];
    let edgeDeclarations: string[] = [];

    // 1. Generate Nodes
    messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      nodeDeclarations.push(this.generateMermaidNode(message, index, nodeId));
    });

    // 2. Generate Edges (Sequential Dependencies)
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = this.generateNodeId(messages[i], i);
      const toId = this.generateNodeId(messages[i + 1], i + 1);
      let label = "";

      if (messages[i].role === "assistant" && messages[i+1].role === "tool") {
        label = "Calls Tool";
      } else if (messages[i].role === "tool" && messages[i+1].role === "assistant") {
        label = "Tool Output";
      } else if (messages[i].role === "user" && messages[i+1].role === "assistant") {
        label = "Responds To";
      }

      edgeDeclarations.push(this.generateMermaidEdge(fromId, toId, label));
    }

    // 3. Generate Advanced Branches (Conditional Logic)
    advancedBranches.forEach(branch => {
      edgeDeclarations.push(this.generateConditionalBranchMermaid(branch));
    });

    // 4. Assemble Final Graph
    mermaidCode += nodeDeclarations.join("\n") + "\n";
    mermaidCode += edgeDeclarations.join("\n");

    return mermaidCode;
  }
}