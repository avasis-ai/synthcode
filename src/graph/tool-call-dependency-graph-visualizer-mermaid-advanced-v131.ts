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

interface ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(messages: Message[]): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV131 implements ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(messages: Message[]): string {
    let graph = "graph TD\n";
    let nodeDefinitions: Map<string, string> = new Map();
    let edges: string[] = [];
    let toolCategories: Set<string> = new Set();

    const getToolName = (block: ToolUseBlock): string => block.name;

    const processMessage = (message: Message, index: number) => {
      if (message.role === "user") {
        const nodeId = `U${index}`;
        nodeDefinitions.set(nodeId, `User Input (${message.content.text})`);
        graph += `    ${nodeId}["User Input"]\n`;
        return nodeId;
      }

      if (message.role === "assistant") {
        let currentId = `A${index}`;
        nodeDefinitions.set(currentId, "Assistant Response");
        graph += `    ${currentId}["Assistant Response"]\n`;

        let lastToolCallId: string | null = null;

        for (let i = 0; i < message.content.length; i++) {
          const block = message.content[i];
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const nodeId = `T${index}-${toolUseBlock.id}`;
            nodeDefinitions.set(nodeId, `Tool Call: ${toolUseBlock.name}`);
            graph += `    ${nodeId}["${toolUseBlock.name} (${toolUseBlock.id})"]\n`;
            toolCategories.add(toolUseBlock.name);
            lastToolCallId = nodeId;
          } else if (block.type === "thinking") {
            const nodeId = `TH${index}-${i}`;
            nodeDefinitions.set(nodeId, `Thinking: ${block.thinking.substring(0, 20)}...`);
            graph += `    ${nodeId}["Thinking Process"]\n`;
          }
        }
        return currentId;
      }

      if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const nodeId = `R${index}`;
        nodeDefinitions.set(nodeId, `Tool Result: ${toolResultMessage.tool_use_id}`);
        graph += `    ${nodeId}["Tool Result"]\n`;
        return nodeId;
      }
      return "";
    };

    let previousNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const currentNodeId = processMessage(message, i);

      if (previousNodeId && currentNodeId) {
        let edgeLabel = "";
        if (message.role === "tool") {
          edgeLabel = `Result for ${previousNodeId.includes("T") ? "Tool" : "Assistant"}`;
        } else if (message.role === "assistant" && previousNodeId && !previousNodeId.includes("T")) {
          edgeLabel = "Continues";
        } else if (message.role === "tool" && previousNodeId && previousNodeId.includes("T")) {
          edgeLabel = "Response";
        } else {
          edgeLabel = "Follows";
        }
        graph += `    ${previousNodeId} -->|${edgeLabel}| ${currentNodeId}\n`;
      }
      previousNodeId = currentNodeId;
    }

    // Advanced Feature: Grouping using Subgraphs (Swimlane-like grouping)
    let subgraphDirectives: string[] = [];
    if (toolCategories.size > 0) {
      let subgraph = "subgraph Tool Categories\n";
      toolCategories.forEach(category => {
        subgraph += `    ${category.replace(/\s/g, '')}_group[${category}] -->|Group| END\n`;
      });
      graph += "\n" + subgraph;
    }

    return graph;
  }
}