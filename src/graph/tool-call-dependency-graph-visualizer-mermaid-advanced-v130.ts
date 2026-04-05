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

interface GraphNode {
  id: string;
  description: string;
  type: "user_input" | "assistant_thought" | "tool_call" | "tool_result";
  metadata: Record<string, unknown>;
}

interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  type: "direct" | "conditional" | "precondition";
  condition?: string;
}

interface ToolCallDependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

type MermaidSyntax = {
  graphType: "graph TD";
  nodes: string[];
  links: string[];
};

const renderNodeId = (id: string): string => `N${id.replace(/[^a-zA-Z0-9]/g, '')}`;

const renderGraphAdvancedV130 = (graph: ToolCallDependencyGraph): string => {
  const nodeMap = new Map<string, string>();
  const mermaidNodes: string[] = [];
  const mermaidLinks: string[] = [];

  graph.nodes.forEach((node, index) => {
    const nodeId = renderNodeId(node.id);
    nodeMap.set(node.id, nodeId);

    let nodeContent = "";
    switch (node.type) {
      case "user_input":
        nodeContent = `User Input: ${node.description.substring(0, 30)}...`;
        break;
      case "assistant_thought":
        nodeContent = `Thinking: ${node.description.substring(0, 30)}...`;
        break;
      case "tool_call":
        const toolCall = node.metadata as { name: string; input: Record<string, unknown> };
        nodeContent = `Tool Call: ${toolCall.name} (Input: ${JSON.stringify(toolCall.input)})`;
        break;
      case "tool_result":
        const result = node.metadata as { content: string; isError: boolean };
        const status = result.isError ? "ERROR" : "SUCCESS";
        nodeContent = `Tool Result (${status}): ${result.content.substring(0, 30)}...`;
        break;
    }

    mermaidNodes.push(`${nodeId}["${nodeContent}"]`);
  });

  graph.edges.forEach((edge, index) => {
    const fromId = nodeMap.get(edge.fromNodeId);
    const toId = nodeMap.get(edge.toNodeId);

    if (!fromId || !toId) return;

    let linkSyntax = `${fromId} --> ${toId}`;

    if (edge.type === "conditional") {
      linkSyntax = `${fromId} -- ${edge.condition || "Condition"} --> ${toId}`;
    } else if (edge.type === "precondition") {
      linkSyntax = `${fromId} -.-> ${toId} [Precondition: ${edge.condition || "N/A"}]`;
    } else {
      linkSyntax = `${fromId} --> ${toId}`;
    }
    mermaidLinks.push(linkSyntax);
  });

  const mermaidSyntax: MermaidSyntax = {
    graphType: "graph TD",
    nodes: mermaidNodes,
    links: mermaidLinks,
  };

  let output = `graph TD\n`;
  output += mermaidNodes.join('\n');
  output += '\n';
  output += mermaidLinks.join('\n');

  return output;
};

export {
  renderGraphAdvancedV130,
};