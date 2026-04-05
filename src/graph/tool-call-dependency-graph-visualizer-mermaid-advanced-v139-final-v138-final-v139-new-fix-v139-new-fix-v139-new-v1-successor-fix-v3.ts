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

interface GraphContext {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  // Placeholder for advanced graph state/context if needed
}

abstract class MermaidGraphVisualizer {
  abstract generateMermaid(context: GraphContext): string;
}

class ToolCallDependencyGraphVisualizer extends MermaidGraphVisualizer {
  generateMermaid(context: GraphContext): string {
    let mermaid = "graph TD\n";
    let nodeIdCounter = 1;
    const nodes: Map<string, string> = new Map();
    const edges: string[] = [];

    const getNode = (label: string, id: string): string => {
      if (!nodes.has(id)) {
        nodes.set(id, `${id}["${label}"]`);
      }
      return nodes.get(id)!;
    };

    const addEdge = (fromId: string, toId: string, label?: string): string => {
      edges.push(`${fromId} -->|${label || ""}| ${toId}`);
      return "";
    };

    const processMessage = (message: Message, index: number): {
      nodeId: string;
      mermaidNode: string;
    } => {
      let nodeId = `M${index}`;
      let label = `Message ${index + 1} (${message.role})`;
      let mermaidNode = getNode(label, nodeId);

      if (message.role === "user") {
        const userMsg = message as UserMessage;
        mermaidNode = getNode(`User Input: ${userMsg.content.substring(0, 30)}...`, nodeId);
      } else if (message.role === "assistant") {
        const assistantMsg = message as AssistantMessage;
        let contentLabel = "Assistant Response";
        let contentDetail = "";

        if (assistantMsg.content.length > 0) {
          const toolUses = assistantMsg.content.filter((block): block is ToolUseBlock =>
            (block as ToolUseBlock).type === "tool_use"
          );
          if (toolUses.length > 0) {
            contentLabel = `Assistant (Tools)`;
            contentDetail = `Calls: ${toolUses.map(t => t.name).join(", ")}`;
          } else {
            contentLabel = "Assistant Response";
            contentDetail = "Text Content";
          }
        }
        mermaidNode = getNode(`${contentLabel}\n(${contentDetail})`, nodeId);
      } else if (message.role === "tool") {
        const toolMsg = message as ToolResultMessage;
        const errorIndicator = toolMsg.is_error ? " (ERROR)" : "";
        let contentLabel = `Tool Result: ${toolMsg.tool_use_id}`;
        mermaidNode = getNode(`${contentLabel}${errorIndicator}`, nodeId);
      }

      return { nodeId, mermaidNode };
    };

    // 1. Process Messages to create primary nodes
    const messageNodes: {
      id: string;
      nodeId: string;
    }[] = [];

    context.messages.forEach((msg, index) => {
      const { nodeId } = processMessage(msg, index);
      messageNodes.push({ id: `MSG_${index}`, nodeId });
    });

    // 2. Process Tool Calls (if they exist outside the message flow, e.g., initial context)
    const toolCallNodes: {
      id: string;
      nodeId: string;
    }[] = [];

    context.toolCalls.forEach((tc, index) => {
      const nodeId = `TC${index}`;
      const label = `Tool Call: ${tc.name}`;
      const mermaidNode = getNode(label, nodeId);
      toolCallNodes.push({ id: `TCC_${index}`, nodeId });
    });

    // 3. Establish Edges (Simplified flow: User -> Assistant -> Tool Result)
    for (let i = 0; i < messageNodes.length; i++) {
      const current = messageNodes[i];
      const currentMsg = context.messages[i];

      // Link previous message to current message (if not the first)
      if (i > 0) {
        const prev = messageNodes[i - 1];
        addEdge(prev.nodeId, current.nodeId, "Continues From");
      }

      // Special handling for Tool Calls originating from the current message
      if (currentMsg.role === "assistant") {
        const assistantMsg = currentMsg as AssistantMessage;
        const toolUses = assistantMsg.content.filter((block): block is ToolUseBlock =>
          (block as ToolUseBlock).type === "tool_use"
        );

        if (toolUses.length > 0) {
          toolUses.forEach((toolUse, toolIndex) => {
            const tcId = `TCA_${i}_${toolIndex}`;
            const tcNodeId = `TCN_${tcId}`;
            const tcLabel = `Tool: ${toolUse.name}`;
            getNode(tcLabel, tcNodeId); // Ensure tool call node exists
            addEdge(current.nodeId, tcNodeId, "Requires Tool Call");
          });
        }
      }

      // Link Tool Result back to the next step (or end)
      if (currentMsg.role === "tool" && i + 1 < messageNodes.length) {
        const nextMsg = context.messages[i + 1];
        if (nextMsg.role === "assistant") {
          addEdge(current.nodeId, messageNodes[i + 1].nodeId, "Result Used By");
        }
      }
    }

    // 4. Assemble Mermaid String
    let finalMermaid = "";
    
    // Add all defined nodes (Mermaid syntax requires definition before use)
    nodes.forEach((definition, id) => {
        finalMermaid += `    ${definition};\n`;
    });

    // Add all edges
    finalMermaid += edges.join("\n") + "\n";

    return finalMermaid;
  }
}

export const createGraphVisualizer = (): ToolCallDependencyGraphVisualizer => {
  return new ToolCallDependencyGraphVisualizer();
};