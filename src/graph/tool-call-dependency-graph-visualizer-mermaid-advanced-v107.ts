import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GraphLayoutAlgorithm = "dagre" | "elk" | "force";

export interface ToolCallDependencyGraphConfig {
  messages: Message[];
  layoutAlgorithm?: GraphLayoutAlgorithm;
  customStyles?: Record<string, { node: string; edge: string }>;
}

export interface ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(config: ToolCallDependencyGraphConfig): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV107 implements ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(config: ToolCallDependencyGraphConfig): string {
    const { messages, layoutAlgorithm = "dagre", customStyles = {} } = config;

    let graphDefinition = "graph TD\n";
    let nodeDefinitions: Map<string, string> = new Map();
    let edgeDefinitions: string[] = [];

    const getUniqueId = (prefix: string): string => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

    const getNodeStyle = (id: string, type: string): string => {
      const style = customStyles[id]?.node || "";
      return `classDef ${id} fill:#f9f,stroke:#333,stroke-width:2px; ${style}`;
    };

    const getEdgeStyle = (sourceId: string, targetId: string): string => {
      const style = customStyles[`${sourceId}-${targetId}`]?.edge || "";
      return `linkStyle 1 ${style}`;
    };

    const processMessage = (message: Message, index: number) => {
      if (message.role === "user") {
        const nodeId = getUniqueId("user");
        nodeDefinitions.set(nodeId, `User Input ${index}`);
        graphDefinition += `${nodeId}["User: ${message.content.substring(0, 30)}..."]\n`;
        return nodeId;
      }

      if (message.role === "assistant") {
        const assistantNodeId = getUniqueId("assistant");
        nodeDefinitions.set(assistantNodeId, `Assistant Turn ${index}`);
        graphDefinition += `${assistantNodeId}["Assistant Response"]\n`;

        let lastToolCallId: string | null = null;

        for (const block of message.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolCallId = getUniqueId(`tool_${toolUseBlock.id}`);
            nodeDefinitions.set(toolCallId, `Tool Call: ${toolUseBlock.name}`);
            graphDefinition += `${toolCallId}["Call ${toolUseBlock.name}(${JSON.stringify(toolUseBlock.input)})"]\n`;
            lastToolCallId = toolCallId;
          } else if (block.type === "text") {
            const textNodeId = getUniqueId(`text_${index}_${Math.random()}`);
            nodeDefinitions.set(textNodeId, `Text Segment`);
            graphDefinition += `${textNodeId}["Text: ${block.text.substring(0, 30)}..."]\n`;
          } else if (block.type === "thinking") {
            const thinkingNodeId = getUniqueId(`thinking_${index}`);
            nodeDefinitions.set(thinkingNodeId, `Thinking Process`);
            graphDefinition += `${thinkingNodeId}["Thinking: ${block.thinking.substring(0, 30)}..."]\n`;
          }
        }
        return assistantNodeId;
      }

      if (message.role === "tool") {
        const toolResultId = getUniqueId(`tool_result_${message.tool_use_id}`);
        nodeDefinitions.set(toolResultId, `Tool Result: ${message.tool_use_id}`);
        graphDefinition += `${toolResultId}["Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}..."]\n`;
        return toolResultId;
      }
      return "";
    };

    // 1. Process Nodes and Build Edges
    let previousNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const currentNodeId = processMessage(message, i);

      if (previousNodeId && currentNodeId) {
        let edgeSource = previousNodeId;
        let edgeTarget = currentNodeId;

        // Simple sequential connection for demonstration
        if (message.role === "tool") {
          // Tool result connects back to the last tool call node in the assistant's turn
          // This is a simplification; real logic needs context tracking.
          const lastToolCallNode = Array.from(nodeDefinitions.keys()).find(k => k.startsWith("tool_") && k.includes("tool_use_id"));
          if (lastToolCallNode) {
             edgeSource = lastToolCallNode;
             edgeTarget = currentNodeId;
          } else {
             edgeSource = previousNodeId;
             edgeTarget = currentNodeId;
          }
        } else {
          edgeSource = previousNodeId;
          edgeTarget = currentNodeId;
        }

        graphDefinition += `${edgeSource} -->|Step ${i+1}| ${edgeTarget}\n`;
      }
      previousNodeId = currentNodeId;
    }

    // 2. Apply Layout and Styling Directives
    graphDefinition += `\n%% Configuration\n`;
    graphDefinition += `%% Layout Algorithm: ${layoutAlgorithm}\n`;
    graphDefinition += `%% Styling Hooks\n`;

    // Apply custom styles
    Object.keys(customStyles).forEach(key => {
      const style = customStyles[key];
      if (style.node) {
        graphDefinition += `${getNodeStyle(key, "custom")}\n`;
      }
      if (style.edge) {
        graphDefinition += `${getEdgeStyle(key.split('-')[0], key.split('-')[1])}\n`;
      }
    });

    // Apply global layout settings (Mermaid specific)
    graphDefinition += `%%{init: {'theme': 'base', 'flowchart': {'rankDir': '${layoutAlgorithm === 'dagre' ? 'LR' : 'TB'}'}}}\\n`;

    return graphDefinition.trim();
  }
}