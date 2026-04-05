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

export interface DependencyEdge {
  from: string;
  to: string;
  type: "conditional" | "loop" | "sequence";
  condition?: string;
  loopCondition?: string;
}

export interface ToolCallDependencyGraph {
  nodes: Record<string, {
    description: string;
    type: "user" | "assistant" | "tool_call" | "tool_result";
    metadata?: Record<string, any>;
  }>;
  edges: DependencyEdge[];
}

type MermaidGraphType = "graph TD";

export function generateMermaidGraph(
  graph: ToolCallDependencyGraph
): string {
  let mermaid = `\`\`\`mermaid\n${MermaidGraphType}\n`;

  const nodeDefinitions: string[] = [];
  const edgeDefinitions: string[] = [];

  for (const nodeId in graph.nodes) {
    const node = graph.nodes[nodeId];
    let nodeContent = `[${nodeId}]`;
    let nodeShape = "rectangle";

    switch (node.type) {
      case "user":
        nodeContent = `(User Input: ${node.description})`;
        nodeShape = "rounded";
        break;
      case "assistant":
        nodeContent = `{{Assistant Response: ${node.description.substring(0, 30)}...}}`;
        nodeShape = "stadium";
        break;
      case "tool_call":
        nodeContent = `[Tool Call: ${node.description}]`;
        nodeShape = "rectangle";
        break;
      case "tool_result":
        nodeContent = `[Tool Result: ${node.description}]`;
        nodeShape = "rectangle";
        break;
    }

    nodeDefinitions.push(`${nodeId} -->|${node.type.toUpperCase()}| ${nodeContent}`);
  }

  for (const edge of graph.edges) {
    let edgeSyntax = "";
    let label = "";

    if (edge.type === "conditional") {
      edgeSyntax = `${edge.from} -->|${edge.condition}| ${edge.to}`;
      label = `Condition: ${edge.condition}`;
    } else if (edge.type === "loop") {
      edgeSyntax = `${edge.from} --o ${edge.to}`;
      label = `Loop (${edge.loopCondition || "N/A"})`;
    } else {
      edgeSyntax = `${edge.from} --> ${edge.to}`;
      label = `Sequence`;
    }

    edgeDefinitions.push(`${edgeSyntax} [${label}]`);
  }

  mermaid += nodeDefinitions.join("\n") + "\n";
  mermaid += edgeDefinitions.join("\n");
  mermaid += "\n\`\`\`";

  return mermaid;
}

export function visualizeToolCallDependencyGraph(
  graph: ToolCallDependencyGraph
): string {
  return generateMermaidGraph(graph);
}