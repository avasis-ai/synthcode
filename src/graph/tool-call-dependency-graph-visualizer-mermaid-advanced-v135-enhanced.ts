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

interface AdvancedVisualizerOptions {
  graphTitle: string;
  nodeStyles?: (nodeMetadata: any) => string;
  edgeStyles?: (edgeMetadata: any) => string;
  onNodeRender?: (nodeMetadata: any, element: HTMLElement) => void;
  onEdgeRender?: (edgeMetadata: any, element: HTMLElement) => void;
}

interface GraphContext {
  messages: Message[];
  toolCalls: {
    sourceMessageId: string;
    targetToolUseId: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV135Enhanced {
  private options: AdvancedVisualizerOptions;

  constructor(options: AdvancedVisualizerOptions) {
    this.options = options;
  }

  private generateMermaidGraph(context: GraphContext): string {
    const { messages, toolCalls } = context;
    let mermaidCode = `graph TD\n`;
    mermaidCode += `    %% Graph Title: ${this.options.graphTitle || "Tool Call Dependency Graph"}\n`;

    const nodeMap = new Map<string, string>();
    const nodes: { id: string; label: string; metadata: any }[] = [];

    // 1. Process Messages to create primary nodes
    messages.forEach((message, index) => {
      let nodeId: string;
      let label: string;

      if (message.role === "user") {
        nodeId = `user_${index}`;
        label = `User Input (${index})`;
        nodes.push({ id: nodeId, label: label, metadata: { role: "user", index: index } });
      } else if (message.role === "assistant") {
        nodeId = `assistant_${index}`;
        label = `Assistant Response (${index})`;
        nodes.push({ id: nodeId, label: label, metadata: { role: "assistant", index: index } });
      } else if (message.role === "tool") {
        nodeId = `tool_result_${index}`;
        label = `Tool Result (${index})`;
        nodes.push({ id: nodeId, label: label, metadata: { role: "tool", index: index } });
      } else {
        return;
      }
      nodeMap.set(message.role + index, nodeId);
    });

    // 2. Process Tool Uses within Assistant Messages
    let toolUseCounter = 0;
    for (const message of messages) {
      if (message.role === "assistant" && Array.isArray((message as AssistantMessage).content)) {
        for (const block of (message as AssistantMessage).content) {
          if (block.type === "tool_use" && block.id) {
            const toolUseId = `tool_use_${block.id}_${toolUseCounter++}`;
            nodes.push({
              id: toolUseId,
              label: `${block.name}(${block.id.substring(0, 4)}...)`,
              metadata: {
                type: "tool_use",
                blockId: block.id,
                name: block.name,
                sourceMessageId: `assistant_${messages.indexOf(message)}`,
              },
            });
            nodeMap.set(toolUseId, toolUseId);
          }
        }
      }
    }

    // 3. Define Edges (Tool Call Dependencies)
    let edgeCode = "";
    toolCalls.forEach((call, index) => {
      const sourceNodeId = `assistant_${call.sourceMessageId.split('_')[1]}`; // Simplified source lookup
      const targetNodeId = `tool_result_${index}`; // Simplified target lookup
      const edgeLabel = `Calls ${call.targetToolUseId}`;
      edgeCode += `    ${sourceNodeId} -- "${edgeLabel}" --> ${targetNodeId};\n`;
    });

    // 4. Assemble Final Graph Structure
    let nodeDefinitions = nodes.map(node => {
      const style = this.options.nodeStyles ? this.options.nodeStyles(node.metadata) : "";
      return `${node.id}${style}["${node.label}"]`;
    }).join("\n");

    let edgeDefinitions = edgeCode;

    let finalMermaid = `
    ${nodeDefinitions}
    ${edgeDefinitions}
    `;

    return finalMermaid.trim();
  }

  public render(context: GraphContext): { mermaidCode: string, options: AdvancedVisualizerOptions } {
    const mermaidCode = this.generateMermaidGraph(context);
    return { mermaidCode, options: this.options };
  }
}

export function createToolCallDependencyGraphVisualizerMermaidAdvancedV135Enhanced(
  options?: AdvancedVisualizerOptions
): ToolCallDependencyGraphVisualizerMermaidAdvancedV135Enhanced {
  return new ToolCallDependencyGraphVisualizerMermaidAdvancedV135Enhanced(options || {})
}