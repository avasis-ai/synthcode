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

interface ToolCallGraphNode {
  id: string;
  type: "user" | "assistant" | "tool_result";
  content: any;
  tool_uses?: ToolUseBlock[];
  fallback_to?: string;
}

interface ToolCallGraphEdges {
  from: string;
  to: string;
  condition?: string;
  fallback?: boolean;
}

type GraphData = {
  nodes: ToolCallGraphNode[];
  edges: ToolCallGraphEdges[];
};

export function generateMermaidGraph(graphData: GraphData): string {
  let mermaid = "graph TD\n";
  let nodeDefinitions: string[] = [];
  let edgeDefinitions: string[] = [];

  const getNodeDefinition = (node: ToolCallGraphNode, index: number): string => {
    const id = node.id;
    let content = "";

    if (node.type === "user") {
      const userMsg = node.content as UserMessage;
      content = `User: "${userMsg.content.substring(0, 30)}..."`;
    } else if (node.type === "assistant") {
      const assistantMsg = node.content as AssistantMessage;
      let blocksContent = assistantMsg.content.map(block => {
        if (block.type === "text") return `Text: "${(block as TextBlock).text.substring(0, 30)}..."`;
        if (block.type === "tool_use") {
          const toolUse = block as ToolUseBlock;
          return `Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`;
        }
        if (block.type === "thinking") {
          const thinkingBlock = block as ThinkingBlock;
          return `Thinking: "${thinkingBlock.thinking.substring(0, 30)}..."`;
        }
        return "";
      }).join("<br/>");
      content = `Assistant:<br/>${blocksContent}`;
    } else if (node.type === "tool_result") {
      const toolResult = node.content as ToolResultMessage;
      const errorIndicator = toolResult.is_error ? " (ERROR)" : "";
      content = `Tool Result (${toolResult.tool_use_id}): "${toolResult.content.substring(0, 30)}"${errorIndicator}`;
    }

    return `${id}["${content}"]`;
  };

  nodeDefinitions = graphData.nodes.map((node, index) => getNodeDefinition(node, index));
  mermaid += nodeDefinitions.join("\n");

  const getEdgeDefinition = (edge: ToolCallGraphEdges): string => {
    let edgeStr = `${edge.from} --> ${edge.to}`;

    if (edge.condition) {
      edgeStr = `${edge.from} -- ${edge.condition} --> ${edge.to}`;
    } else if (edge.fallback) {
      edgeStr = `${edge.from} -- FALLBACK --> ${edge.to}`;
    }

    return edgeStr;
  };

  edgeDefinitions = graphData.edges.map(getEdgeDefinition);
  mermaid += "\n";
  mermaid += edgeDefinitions.join("\n");

  return mermaid;
}

export const visualizeToolCallDependencyGraph = (graphData: GraphData): string => {
  return generateMermaidGraph(graphData);
};