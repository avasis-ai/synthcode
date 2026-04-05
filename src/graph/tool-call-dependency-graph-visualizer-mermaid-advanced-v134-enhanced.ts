import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type ConditionalEdge = {
  from: string;
  to: string;
  condition: string;
};

export interface GraphConfig {
  messages: Message[];
  conditionalEdges?: ConditionalEdge[];
  enableConditionalPathRendering?: boolean;
}

export class ToolCallDependencyGraphVisualizer {
  private config: GraphConfig;

  constructor(config: GraphConfig) {
    this.config = config;
  }

  private getNodeLabel(nodeId: string, message: Message | undefined): string {
    if (!message) {
      return `Node ${nodeId}`;
    }
    switch (message.role) {
      case "user":
        return `User Input: "${message.content.substring(0, 20)}..."`;
      case "assistant":
        return `Assistant Response: "${message.content.find(block => block.type === 'text')?.text.substring(0, 20) || '...'}"`;
      case "tool":
        return `Tool Result (${message.tool_use_id}): ${message.content}`;
      default:
        return `Message ${nodeId}`;
    }
  }

  private buildMermaidGraph(graph: string): string {
    return `graph TD\n${graph}`;
  }

  public visualize(title: string): string {
    const { messages, conditionalEdges, enableConditionalPathRendering } = this.config;

    let graphBuilder = `%% Mermaid Graph for ${title} %%
graph TD
    %% Nodes Definition %%`;

    const nodeMap: Map<string, Message> = new Map();
    const nodeIds: string[] = [];

    messages.forEach((msg, index) => {
      const nodeId = `M${index}`;
      nodeIds.push(nodeId);
      nodeMap.set(nodeId, msg);
    });

    // Add nodes for tool calls if they are the primary focus, otherwise rely on message nodes
    const toolCallNodes: Map<string, string> = new Map();
    const toolCallIds: string[] = [];

    messages.filter(m => m.role === "assistant" && m.content.some((block): block is ToolUseBlock => block.type === "tool_use")).forEach((msg, index) => {
      const toolUseBlock = msg.content.find((block): block is ToolUseBlock => block.type === "tool_use");
      if (toolUseBlock) {
        const nodeId = `T${toolUseBlock.id}`;
        toolCallNodes.set(toolUseBlock.id, nodeId);
        toolCallIds.push(nodeId);
        graphBuilder += `    ${nodeId}["Tool Use: ${toolUseBlock.name} (${toolUseBlock.id})"]\n`;
      }
    });

    // Add message nodes
    nodeIds.forEach((id, index) => {
      const msg = messages[index];
      const label = this.getNodeLabel(id, msg);
      graphBuilder += `    ${id}["${label}"]\n`;
    });

    // Edges (Simple Flow)
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = `M${i}`;
      const toId = `M${i + 1}`;
      graphBuilder += `    ${fromId} --> ${toId} : Sequential Flow\n`;
    }

    // Edges (Tool Call Dependencies)
    if (toolCallIds.length > 0) {
      // Link message nodes to tool call nodes if applicable (simplified linkage)
      messages.forEach((msg, index) => {
        const msgNodeId = `M${index}`;
        const toolUseBlock = msg.content.find((block): block is ToolUseBlock => block.type === "tool_use");
        if (toolUseBlock) {
          const toolNodeId = toolCallNodes.get(toolUseBlock.id);
          if (toolNodeId) {
            graphBuilder += `    ${msgNodeId} --> ${toolNodeId} : Calls Tool\n`;
          }
        }
      });
    }

    // Conditional Edges (Advanced Feature)
    if (conditionalEdges && conditionalEdges.length > 0 && enableConditionalPathRendering) {
      graphBuilder += "\n%% Conditional Paths %%";
      conditionalEdges.forEach((edge, index) => {
        const formattedCondition = edge.condition.replace(/[\.\w]+/g, (match) => match.charAt(0).toUpperCase() + match.slice(1));
        const label = `[${formattedCondition}]`;
        graphBuilder += `    ${edge.from} -- ${label} --> ${edge.to}\n`;
      });
    } else if (conditionalEdges && conditionalEdges.length > 0 && !enableConditionalPathRendering) {
        graphBuilder += "\n%% Conditional Edges Defined but Rendering Disabled %%";
    }


    return this.buildMermaidGraph(graphBuilder);
  }
}