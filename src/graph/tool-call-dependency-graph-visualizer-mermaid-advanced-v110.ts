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

export interface AdvancedGraphOptions {
  direction?: "TD" | "LR";
  subgraphTitle?: string;
  showDependencies?: boolean;
  conditionalEdgeRules?: {
    from: string;
    to: string;
    condition: (fromContent: any, toContent: any) => boolean;
    label?: string;
  }[];
}

export interface ToolCallDependencyGraphVisualizer {
  generateMermaid(
    messages: Message[],
    options: AdvancedGraphOptions
  ): string;
}

const createNodeId = (message: Message, index: number): string => {
  if (message.role === "user") {
    return `user_${index}`;
  }
  if (message.role === "assistant") {
    return `assistant_${index}`;
  }
  if (message.role === "tool") {
    return `tool_${index}`;
  }
  return `node_${index}`;
};

const extractToolUseId = (block: ContentBlock): string | null => {
  if (block.type === "tool_use" && typeof block === "object" && "id" in block) {
    return block.id;
  }
  return null;
};

const buildMermaidGraph = (
  messages: Message[],
  options: AdvancedGraphOptions
): string => {
  const graphLines: string[] = [];
  const graphId = "ToolCallDependencyGraph";

  graphLines.push(`graph ${options.direction || "TD"} ${graphId}`);

  const nodes: Record<string, string> = {};

  const processMessage = (message: Message, index: number): {
    nodeId: string;
    mermaidContent: string;
  } => {
    const nodeId = createNodeId(message, index);
    let mermaidContent = `node_${nodeId}["${message.role.toUpperCase()}"]`;

    if (message.role === "assistant") {
      const contentBlocks = (message as AssistantMessage).content;
      let contentDetails = "";
      let toolUseNodes: string[] = [];

      contentBlocks.forEach((block, blockIndex) => {
        if (block.type === "text") {
          contentDetails += `\n  - Text: ${block.text.substring(0, 30)}...`;
        } else if (block.type === "tool_use") {
          const toolUseBlock = block as ToolUseBlock;
          const toolUseId = `${nodeId}_tool_${toolUseBlock.id}`;
          toolUseNodes.push(toolUseId);
          contentDetails += `\n  - Tool Use: ${toolUseBlock.name} (${toolUseBlock.id})`;
          mermaidContent += `\n  subgraph ${toolUseId} ${toolUseId} { ${toolUseBlock.name} Input: ${JSON.stringify(toolUseBlock.input)} }`;
        } else if (block.type === "thinking") {
          contentDetails += `\n  - Thinking: ${block.thinking.substring(0, 30)}...`;
        }
      });
      mermaidContent += `\n  ${contentDetails}`;
    } else if (message.role === "tool") {
      const toolResultMessage = message as ToolResultMessage;
      const toolNodeId = `${nodeId}_tool_result`;
      mermaidContent = `node_${toolNodeId}["Tool Result (${toolResultMessage.tool_use_id})"]\n  Content: ${toolResultMessage.content.substring(0, 30)}... ${toolResultMessage.is_error ? "(ERROR)" : ""}`;
    }

    nodes[nodeId] = mermaidContent;
    return { nodeId, mermaidContent };
  };

  const processedNodes: { nodeId: string; mermaidContent: string }[] = [];
  messages.forEach((msg, index) => {
    processedNodes.push(processMessage(msg, index));
  });

  graphLines.push("%% --- Node Definitions ---");
  processedNodes.forEach(({ nodeId, mermaidContent }) => {
    graphLines.push(`${nodeId} { ${mermaidContent} }`);
  });

  graphLines.push("%% --- Edges and Dependencies ---");

  for (let i = 0; i < messages.length - 1; i++) {
    const currentMsg = messages[i];
    const nextMsg = messages[i + 1];
    const currentId = createNodeId(currentMsg, i);
    const nextId = createNodeId(nextMsg, i + 1);

    // Basic sequential dependency edge
    graphLines.push(`${currentId} --> ${nextId}: Sequence`);

    // Advanced dependency checking (Tool Use -> Tool Result)
    if (currentMsg.role === "assistant" && nextMsg.role === "tool") {
      const assistantMsg = currentMsg as AssistantMessage;
      const toolUseBlocks = (assistantMsg as AssistantMessage).content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );

      if (toolUseBlocks.length > 0) {
        const firstToolUseId = toolUseBlocks[0].id;
        const toolResultNodeId = `${nextId}_tool_result`;

        // Assuming the first tool use triggers the next tool result
        graphLines.push(`${currentId} --> ${toolResultNodeId}: Calls Tool (${firstToolUseId})`);
      }
    }
  }

  if (options.conditionalEdgeRules && options.conditionalEdgeRules.length > 0) {
    graphLines.push("%% --- Conditional Edges ---");
    options.conditionalEdgeRules.forEach((rule, index) => {
      const conditionMet = rule.condition(null, null); // Simplified check for structure
      if (conditionMet) {
        graphLines.push(`${rule.from} --> ${rule.to}: ${rule.label || "Conditional Link"}`);
      }
    });
  }

  return graphLines.join("\n");
};

export const createToolCallDependencyGraphVisualizer = (): ToolCallDependencyGraphVisualizer => {
  return {
    generateMermaid: (messages: Message[], options: AdvancedGraphOptions = {}) => {
      if (!messages || messages.length === 0) {
        return "graph TD\n    A[No messages provided]";
      }
      return buildMermaidGraph(messages, options);
    },
  };
};