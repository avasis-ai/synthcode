import { Message, ToolUseBlock, ContentBlock } from "./types";

export class ToolDependencyGraphVisualizerAdvanced {
  private toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  private dependencies: {
    fromId: string;
    toId: string;
  }[];

  constructor(toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[], dependencies: {
    fromId: string;
    toId: string;
  }[] = []) {
    this.toolCalls = toolCalls;
    this.dependencies = dependencies;
  }

  private getToolCallNodeId(toolCall: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }): string {
    return `Tool_${toolCall.id}`;
  }

  private getToolCallLabel(toolCall: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }): string {
    return `${toolCall.name}(${toolCall.id})`;
  }

  private buildNodes(): string {
    if (this.toolCalls.length === 0) {
      return "";
    }

    const nodes = this.toolCalls.map(toolCall => {
      const nodeId = this.getToolCallNodeId(toolCall);
      const label = this.getToolCallLabel(toolCall);
      return `${nodeId}["${label}\\nInput: ${JSON.stringify(toolCall.input)}"]`;
    }).join("\n");

    return `graph TD;\n${nodes}\n`;
  }

  private buildLinks(): string {
    if (this.dependencies.length === 0) {
      return "";
    }

    const links = this.dependencies.map(dep => {
      const fromNode = this.getToolCallNodeId({
        id: dep.fromId,
        name: "",
        input: {}
      });
      const toNode = this.getToolCallNodeId({
        id: dep.toId,
        name: "",
        input: {}
      });
      return `${fromNode} --> ${toNode};`;
    }).join("\n");

    return links + "\n";
  }

  public serializeGraph(): string {
    let mermaidString = "";
    mermaidString += this.buildNodes();
    mermaidString += this.buildLinks();
    return mermaidString.trim();
  }
}