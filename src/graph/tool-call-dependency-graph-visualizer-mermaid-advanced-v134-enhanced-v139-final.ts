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

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  label: string;
  details: Record<string, any>;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  label: string;
  type: "call" | "response" | "flow";
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type MermaidDiagram = string;

const createNodeId = (message: Message, index: number): string => {
  if ("user" in message) {
    return `user_${message.role}_${index}`;
  }
  if ("assistant" in message) {
    return `assistant_${message.role}_${index}`;
  }
  if ("tool" in message) {
    return `tool_${message.role}_${index}`;
  }
  return `node_${index}`;
};

const processContentBlock = (block: ContentBlock, nodeId: string, index: number): {
  mermaidNodeId: string;
  mermaidLabel: string;
} => {
  if ("text" in block) {
    return {
      mermaidNodeId: `${nodeId}_text`,
      mermaidLabel: `Text: ${block.text.substring(0, 30)}...`,
    };
  }
  if ("tool_use" in block) {
    const toolUseBlock = block as ToolUseBlock;
    return {
      mermaidNodeId: `${nodeId}_tool_${toolUseBlock.id}`,
      mermaidLabel: `Tool Call: ${toolUseBlock.name}(${JSON.stringify(toolUseBlock.input)})`,
    };
  }
  if ("thinking" in block) {
    const thinkingBlock = block as ThinkingBlock;
    return {
      mermaidNodeId: `${nodeId}_thinking`,
      mermaidLabel: `Thinking: ${thinkingBlock.thinking.substring(0, 30)}...`,
    };
  }
  throw new Error("Unknown content block type");
};

const buildGraphFromMessages = (messages: Message[]): DependencyGraph => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap: Map<string, GraphNode> = new Map();

  messages.forEach((message, msgIndex) => {
    const baseNodeId = createNodeId(message, msgIndex);
    let currentNode: GraphNode;

    if ("user" in message) {
      currentNode = {
        id: baseNodeId,
        type: "user",
        label: "User Input",
        details: { content: message.content },
      };
      nodes.push(currentNode);
      nodeMap.set(baseNodeId, currentNode);
    } else if ("assistant" in message) {
      const assistantMsg = message as AssistantMessage;
      let currentAssistantNode: GraphNode = {
        id: baseNodeId,
        type: "assistant",
        label: "Assistant Response",
        details: { content_blocks: assistantMsg.content },
      };
      nodes.push(currentAssistantNode);
      nodeMap.set(baseNodeId, currentAssistantNode);

      // Process content blocks for detailed nodes/edges
      let lastBlockNodeId: string | null = null;
      assistantMsg.content.forEach((block, blockIndex) => {
        const { mermaidNodeId, mermaidLabel } = processContentBlock(block, baseNodeId, blockIndex);
        const blockNode: GraphNode = {
          id: mermaidNodeId,
          type: "content",
          label: mermaidLabel,
          details: { block_type: typeof block },
        };
        nodes.push(blockNode);
        nodeMap.set(mermaidNodeId, blockNode);

        if (lastBlockNodeId) {
          edges.push({
            fromId: lastBlockNodeId,
            toId: mermaidNodeId,
            label: "->",
            type: "flow",
          });
        }
        lastBlockNodeId = mermaidNodeId;
      });
    } else if ("tool" in message) {
      const toolMsg = message as ToolResultMessage;
      const toolNode: GraphNode = {
        id: baseNodeId,
        type: "tool",
        label: `Tool Result (${toolMsg.tool_use_id})`,
        details: { content: toolMsg.content, is_error: toolMsg.is_error },
      };
      nodes.push(toolNode);
      nodeMap.set(baseNodeId, toolNode);
    }

    // Add edges between sequential messages
    if (msgIndex > 0) {
      const prevMessage = messages[msgIndex - 1];
      const prevBaseNodeId = createNodeId(prevMessage, msgIndex - 1);

      if (prevMessage.role === "assistant" && message.role === "tool") {
        edges.push({
          fromId: prevBaseNodeId,
          toId: baseNodeId,
          label: "Calls Tool",
          type: "call",
        });
      } else if (prevMessage.role === "user" && message.role === "assistant") {
        edges.push({
          fromId: prevBaseNodeId,
          toId: baseNodeId,
          label: "Responds To",
          type: "response",
        });
      }
    }
  });

  return { nodes, edges };
};

const generateMermaidDiagram = (graph: DependencyGraph): MermaidDiagram => {
  let mermaid = "graph TD;\n";

  // 1. Define Nodes
  const nodeDefinitions: string[] = graph.nodes.map(node => {
    let shape = "rectangle";
    let classDef = "";
    let content = node.label;

    if (node.type === "user") {
      shape = "hexagon";
      classDef = "classDef user fill:#aaffaa,stroke:#333,stroke-width:2px";
    } else if (node.type === "assistant") {
      shape = "rounded";
      classDef = "classDef assistant fill:#aaddff,stroke:#333,stroke-width:2px";
    } else if (node.type === "tool") {
      shape = "stadium";
      classDef = "classDef tool fill:#ffddaa,stroke:#333,stroke-width:2px";
    } else if (node.type === "content") {
      shape = "subgraph";
      classDef = "classDef content fill:#e0e0ff,stroke:#666,stroke-width:1px";
    }

    return `${node.id}["${content}"]:::${node.type === 'content' ? 'content' : node.type}`;
  }).join("\n");

  mermaid += nodeDefinitions + "\n";

  // 2. Define Edges
  const edgeDefinitions: string[] = graph.edges.map(edge => {
    let style = "";
    if (edge.type === "call") {
      style = "-->";
    } else if (edge.type === "response") {
      style = "-->";
    } else if (edge.type === "flow") {
      style = "-->";
    }
    return `${edge.fromId} ${style} ${edge.toId} [${edge.label}]`;
  }).join("\n");

  mermaid += "\n";
  mermaid += "%% Styles\n";
  mermaid += "classDef user fill:#aaffaa,stroke:#333,stroke-width:2px;\n";
  mermaid += "classDef assistant fill:#aaddff,stroke:#333,stroke-width:2px;\n";
  mermaid += "classDef tool fill:#ffddaa,stroke:#333,stroke-width:2px;\n";
  mermaid += "classDef content fill:#e0e0ff,stroke:#666,stroke-width:1px;\n";

  mermaid += "\n";
  mermaid += edgeDefinitions;

  return mermaid;
};

export const visualizeToolCallDependencyGraph = (messages: Message[]): MermaidDiagram => {
  if (!messages || messages.length === 0) {
    return "graph TD\nA[\nNo messages provided to visualize.\n]\n";
  }

  const graph = buildGraphFromMessages(messages);
  return generateMermaidDiagram(graph);
};