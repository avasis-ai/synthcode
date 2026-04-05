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

export type DependencyLink = {
  sourceToolId: string;
  sourceField: string;
  targetToolId: string;
  targetField: string;
};

export class ToolCallDependencyGraphVisualizerMermaidEnhanced {
  private messages: Message[];
  private dependencies: DependencyLink[];

  constructor(messages: Message[], dependencies: DependencyLink[] = []) {
    this.messages = messages;
    this.dependencies = dependencies;
  }

  private extractToolCalls(messages: Message[]): Record<string, { name: string; input: Record<string, unknown> }[]> {
    const toolCalls: Record<string, { name: string; input: Record<string, unknown> }[]> = {};

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        const toolUses: ToolUseBlock[] = (assistantMessage.content as ContentBlock[]).filter(
          (block) => (block as ToolUseBlock).type === "tool_use"
        ) as ToolUseBlock[];

        for (const toolUse of toolUses) {
          const toolCallInfo = {
            name: toolUse.name,
            input: toolUse.input,
          };

          if (!toolCalls[toolUse.id]) {
            toolCalls[toolUse.id] = [];
          }
          toolCalls[toolUse.id].push(toolCallInfo);
        }
      }
    }
    return toolCalls;
  }

  private generateToolNodes(toolCalls: Record<string, { name: string; input: Record<string, unknown> }[]>): string {
    let nodes = "graph TD\n";
    let toolIdCounter = 1;

    for (const [id, calls] of Object.entries(toolCalls)) {
      const toolNodeId = `Tool_${id.substring(0, 4).toUpperCase()}_${toolIdCounter++}`;
      const toolName = calls[0].name;
      const inputJson = JSON.stringify(calls[0].input);

      nodes += `  ${toolNodeId}["${toolName} (ID: ${id.substring(0, 4).toUpperCase()})"]\n`;
      nodes += `  ${toolNodeId} --> |Input: ${inputJson}| Tool_Input_Placeholder\n`;
    }
    return nodes;
  }

  private generateDataFlowEdges(dependencies: DependencyLink[]): string {
    let edges = "";
    for (const dep of dependencies) {
      const sourceNode = `Tool_${dep.sourceToolId.substring(0, 4).toUpperCase()}_${dep.sourceToolId.length + 1}`;
      const targetNode = `Tool_${dep.targetToolId.substring(0, 4).toUpperCase()}_${dep.targetToolId.length + 1}`;
      const label = `${dep.sourceField} -> ${dep.targetField}`;
      edges += `  ${sourceNode} -- "${label}" --> ${targetNode};\n`;
    }
    return edges;
  }

  public generateMermaidGraph(): string {
    const toolCalls = this.extractToolCalls(this.messages);
    const toolNodes = this.generateToolNodes(toolCalls);
    const dataFlowEdges = this.generateDataFlowEdges(this.dependencies);

    return `${toolNodes}\n${dataFlowEdges}`;
  }
}