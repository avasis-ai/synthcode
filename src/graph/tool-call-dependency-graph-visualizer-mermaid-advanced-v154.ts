import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphConfig {
  layoutAlgorithm?: "hierarchical" | "radial" | "dagetic";
  styleClass?: string;
  colorPalette?: string;
}

interface ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(
    messages: Message[],
    config: GraphConfig
  ): string;
}

class MermaidAdvancedGraphVisualizer implements ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(
    messages: Message[],
    config: GraphConfig
  ): string {
    let graphDefinition = "graph TD\n";
    let nodeDefinitions: Map<string, string> = new Map();
    let edges: string[] = [];

    const {
      layoutAlgorithm = "dagetic",
      styleClass = "",
      colorPalette = "default",
    } = config;

    if (layoutAlgorithm === "hierarchical") {
      graphDefinition = "graph LR\n";
    } else if (layoutAlgorithm === "radial") {
      graphDefinition = "graph TD\n";
    }

    let nodeIdCounter = 1;

    const getNodeId = (prefix: string): string => `node${nodeIdCounter++}`;

    const processMessage = (message: Message, index: number) => {
      let currentId = getNodeId(`msg${index}`);
      let content = "";

      if (message.role === "user") {
        const userNodeId = getNodeId(`user${index}`);
        nodeDefinitions.set(userNodeId, `User Input: ${message.content}`);
        content = `A[User Input ${index}] --> ${userNodeId};`;
        return { id: userNodeId, content: content };
      }

      if (message.role === "assistant") {
        let blockContent = "";
        let toolUseBlockIds: string[] = [];
        let hasToolUse = false;

        message.content.forEach((block, blockIndex) => {
          if (block.type === "text") {
            blockContent += `Text Block ${blockIndex}: ${block.text}\n`;
          } else if (block.type === "tool_use") {
            const toolUseId = `tool_use_${blockIndex}`;
            const toolUseNodeId = getNodeId(toolUseId);
            nodeDefinitions.set(toolUseNodeId, `Tool Call: ${block.name}(${JSON.stringify(block.input)})`);
            toolUseBlockIds.push(toolUseNodeId);
            hasToolUse = true;
          } else if (block.type === "thinking") {
            const thinkingNodeId = getNodeId(`think${blockIndex}`);
            nodeDefinitions.set(thinkingNodeId, `Thinking Process: ${block.thinking.substring(0, 30)}...`);
            blockContent += `Thinking Block ${blockIndex}: ${block.thinking.substring(0, 30)}...\n`;
          }
        });

        const assistantNodeId = getNodeId(`assistant${index}`);
        nodeDefinitions.set(assistantNodeId, `Assistant Response`);
        
        let connections = "";
        if (toolUseBlockIds.length > 0) {
          toolUseBlockIds.forEach((toolId, i) => {
            connections += `${toolId} -->|Calls| ${assistantNodeId};`;
          });
        }
        
        const finalConnections = `${currentId} -->|Generates| ${assistantNodeId};${connections}`;
        return { id: assistantNodeId, content: finalConnections };
      }

      if (message.role === "tool") {
        const toolResultNodeId = getNodeId(`tool_result_${message.tool_use_id}`);
        nodeDefinitions.set(toolResultNodeId, `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`);
        
        const connections = `${currentId} -->|Result| ${toolResultNodeId};`;
        return { id: toolResultNodeId, content: connections };
      }
      return { id: "", content: "" };
    };

    let previousNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const result = processMessage(message, i);
      
      if (result.content) {
        edges.push(result.content);
      }
      
      // Simple sequential connection for visualization flow
      if (previousNodeId && result.id) {
        edges.push(`${previousNodeId} -->|Flow| ${result.id};`);
      }
      previousNodeId = result.id;
    }

    const styleDefinition = `classDef ${styleClass} fill:#f9f,stroke:#333,stroke-width:2px;`;
    const graphBody = [
      ...Array.from(nodeDefinitions.entries()).map(([id, definition]) => `${id}["${definition}"]`),
      ...edges
    ].join("\n");

    const mermaidCode = `
${graphDefinition}
${styleDefinition}
${graphBody}
`;

    return mermaidCode.trim();
  }
}

export const createToolCallDependencyGraphVisualizer = (): ToolCallDependencyGraphVisualizer => {
  return new MermaidAdvancedGraphVisualizer();
};