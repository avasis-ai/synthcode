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

export interface GraphVisualizerOptions {
  title?: string;
  direction?: "TD" | "LR";
  // Advanced styling hooks
  nodeStyleMap?: Record<string, { shape: string; style?: string }>;
  edgeStyleMap?: Record<string, { style?: string }>;
}

export interface ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138 {
  visualizeGraph(
    messages: Message[],
    options: GraphVisualizerOptions = {}
  ): string;
}

export const toolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138: ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138 = {
  visualizeGraph(messages, options) {
    let mermaidGraph = `graph ${options.direction || "TD"} "${options.title || "Tool Call Dependency Graph"}"\n`;

    const nodeStyleMap = options.nodeStyleMap || {};
    const edgeStyleMap = options.edgeStyleMap || {};

    const nodes: Map<string, string> = new Map();
    const edges: string[] = [];

    const processMessage = (message: Message, index: number) => {
      let nodeId = `msg${index}`;
      let nodeLabel = `Message ${index}`;
      let nodeContent = "";

      if (message.role === "user") {
        nodeLabel = "User Input";
        nodeContent = message.content.map(block => {
          if (block.type === "text") return block.text;
          return "";
        }).join("\n");
        nodes.set(nodeId, `User: ${nodeContent.substring(0, 50)}...`);
        return { nodeId, nodeLabel, nodeContent };
      }

      if (message.role === "assistant") {
        let contentText = "";
        let toolUses: ToolUseBlock[] = [];
        message.content.forEach(block => {
          if (block.type === "text") {
            contentText += block.text + "\n";
          } else if (block.type === "tool_use") {
            toolUses.push(block as ToolUseBlock);
          } else if (block.type === "thinking") {
            contentText += `\n[Thinking]: ${block.thinking.substring(0, 50)}...`;
          }
        });

        const assistantId = `msg${index}`;
        nodes.set(assistantId, `Assistant: ${contentText.substring(0, 50)}...`);
        return { nodeId: assistantId, nodeLabel: "Assistant Response", nodeContent: contentText };
      }

      if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const toolId = `tool_${toolResultMessage.tool_use_id}`;
        nodes.set(toolId, `Tool Result (${toolResultMessage.tool_use_id}): ${toolResultMessage.content.substring(0, 50)}...`);
        return { nodeId: toolId, nodeLabel: "Tool Result", nodeContent: `Tool Result (${toolResultMessage.tool_use_id})` };
      }
      return { nodeId: "", nodeLabel: "", nodeContent: "" };
    };

    messages.forEach((message, index) => {
      const { nodeId, nodeLabel, nodeContent } = processMessage(message, index);
      if (nodeId) {
        mermaidGraph += `    ${nodeId}["${nodeLabel}\\n${nodeContent.replace(/[\r\n]/g, "\\\\n")}"]\n`;
      }
    });

    // Process Tool Calls and Dependencies
    let lastToolUseId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        const toolUses: ToolUseBlock[] = assistantMessage.content.filter(
          (block): block is ToolUseBlock => block.type === "tool_use"
        );

        if (toolUses.length > 0) {
          const sourceNodeId = `msg${i}`;
          toolUses.forEach((toolUse, toolIndex) => {
            const toolCallId = `call_${toolUse.id}`;
            nodes.set(toolCallId, `Call: ${toolUse.name} (Input: ${JSON.stringify(toolUse.input).substring(0, 30)}...)`);
            
            // Edge from Assistant to Tool Call
            edges.push(`${sourceNodeId} -->|Calls| ${toolCallId}`);
            lastToolUseId = toolUse.id;
          });
        }
      }

      if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const toolResultNodeId = `tool_${toolResultMessage.tool_use_id}`;
        
        // Edge from Tool Call (if applicable) to Tool Result
        if (lastToolUseId) {
          const sourceToolCallId = `call_${lastToolUseId}`;
          edges.push(`${sourceToolCallId} -->|Result| ${toolResultNodeId}`);
        } else {
          // Fallback edge if tool result exists without explicit preceding call node (shouldn't happen in ideal flow)
          edges.push(`msg${i-1} -->|Result| ${toolResultNodeId}`);
        }
        lastToolUseId = null;
      }
    }

    // Assemble Edges
    edges.forEach(edge => {
      let styledEdge = edge;
      // Simple heuristic to apply edge styling if needed (e.g., based on content)
      if (edge.includes("Result")) {
        styledEdge = edgeStyleMap["result"] ? edge.replace("-->", `-->[style=\"${edgeStyleMap["result"]?.style || ""}\"]`) : edge;
      }
      mermaidGraph += `    ${styledEdge}\n`;
    });

    // Apply Node Styling (This is complex in pure Mermaid, so we apply basic structure)
    // Note: Full dynamic styling requires Mermaid's class/style directives which are hard to inject generically.
    // We rely on the node definition structure for basic styling hooks if provided.
    
    // Final structure assembly
    mermaidGraph += "\n%% Styling Notes: Advanced styling hooks (nodeStyleMap/edgeStyleMap) are conceptually applied here. " +
                      "Mermaid syntax limitations may require manual adjustment for complex dynamic styling.\n";

    return mermaidGraph.trim();
  }
};