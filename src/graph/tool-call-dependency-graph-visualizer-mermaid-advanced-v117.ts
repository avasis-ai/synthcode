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

abstract class BaseGraphVisualizer {
  abstract visualize(messages: Message[]): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV117 extends BaseGraphVisualizer {
  visualize(messages: Message[]): string {
    let graphDefinition = "graph TD;\n";
    let nodes = new Map<string, string>();
    let edges = [];

    let currentStepId = 1;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let messageId = `M${i}`;
      let messageLabel = "";

      if (message.role === "user") {
        messageLabel = `User Input (${i})`;
        nodes.set(messageId, `${messageId}["${messageLabel}"]`);
        if (i > 0) {
          edges.push(`${messageId_prev} --> ${messageId}`);
        }
      } else if (message.role === "assistant") {
        messageLabel = `Assistant Response (${i})`;
        nodes.set(messageId, `${messageId}["${messageLabel}"]`);
        if (i > 0) {
          edges.push(`${messageId_prev} --> ${messageId}`);
        }
        const assistantMsg = message as AssistantMessage;
        assistantMsg.content.forEach((block, blockIndex) => {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolUseId = `T${toolUseBlock.id}`;
            nodes.set(toolUseId, `${toolUseId}["Tool Use: ${toolUseBlock.name}"]`);
            edges.push(`${messageId} --> ${toolUseId}`);
            // Simulate tool call execution step
            const toolCallStepId = `C${currentStepId++}`;
            nodes.set(toolCallStepId, `${toolCallStepId}["Executing ${toolUseBlock.name} with input: ${JSON.stringify(toolUseBlock.input)}"]`);
            edges.push(`${toolUseId} --> ${toolCallStepId}`);
          } else if (block.type === "thinking") {
            const thinkingBlock = block as ThinkingBlock;
            const thinkingId = `TH${i}-${blockIndex}`;
            nodes.set(thinkingId, `${thinkingId}["Thinking: ${thinkingBlock.thinking.substring(0, 30)}..."]`);
            edges.push(`${messageId} --> ${thinkingId}`);
          }
        });
      } else if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const toolResultId = `TR${message.tool_use_id}`;
        let resultLabel = `Tool Result (${toolResultMessage.tool_use_id})`;
        if (toolResultMessage.is_error) {
          resultLabel += " (ERROR)";
        }
        nodes.set(toolResultId, `${toolResultId}["${resultLabel}"]`);
        edges.push(`${messageId_prev} --> ${toolResultId}`);
      }

      // Update previous message ID for next iteration
      if (message.role === "user") {
        messageId_prev = messageId;
      } else if (message.role === "assistant") {
        messageId_prev = messageId;
      } else if (message.role === "tool") {
        messageId_prev = messageId;
      }
    }

    let mermaidGraph = "";
    mermaidGraph += "%% Tool Call Dependency Graph Visualization\n";
    mermaidGraph += "%% Advanced V1.17\n";
    mermaidGraph += "subgraph Graph Structure\n";

    mermaidGraph += "%% Nodes\n";
    nodes.forEach((nodeDef, nodeId) => {
      mermaidGraph += `${nodeDef}\n`;
    });

    mermaidGraph += "\n%% Edges\n";
    mermaidGraph += edges.join("\n") + "\n";

    mermaidGraph += "end\n";

    return mermaidGraph;
  }
}