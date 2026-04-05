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

export interface ConditionalEdge {
  sourceId: string;
  targetId: string;
  condition: string;
}

export interface LoopEdge {
  sourceId: string;
  loopTargetId: string;
  loopCondition: string;
}

export interface GraphStructure {
  nodes: Record<string, {
    id: string;
    description: string;
    type: "call" | "result" | "decision";
  }>;
  edges: ConditionalEdge[] & LoopEdge[];
}

type GraphVisualizer = (structure: GraphStructure) => string;

export const createToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139: GraphVisualizer = (structure) => {
  let mermaidCode = "graph TD;\n";

  // 1. Define Nodes
  for (const nodeId in structure.nodes) {
    const node = structure.nodes[nodeId];
    let nodeDefinition = `${nodeId}["${node.description}"];\n`;

    if (node.type === "call") {
      nodeDefinition = `${nodeId}["Tool Call: ${node.description}"];\n`;
    } else if (node.type === "result") {
      nodeDefinition = `${nodeId}["Tool Result: ${node.description}"];\n`;
    } else if (node.type === "decision") {
      nodeDefinition = `${nodeId}["Decision Point"];\n`;
    }
    mermaidCode += nodeDefinition;
  }

  // 2. Define Edges (Linear, Conditional, Loop)
  const allEdges: (string & { source: string, target: string, label: string })[] = [];

  // Process Conditional Edges
  structure.edges.filter((edge): edge is ConditionalEdge => 'condition' in edge)
    .forEach((edge) => {
      allEdges.push({
        source: edge.sourceId,
        target: edge.targetId,
        label: `|${edge.condition}|`,
      });
    });

  // Process Loop Edges
  structure.edges.filter((edge): edge is LoopEdge => 'loopCondition' in edge)
    .forEach((edge) => {
      // For loops, we model the back edge explicitly
      allEdges.push({
        source: edge.sourceId,
        target: edge.loopTargetId,
        label: `|Loop: ${edge.loopCondition}|`,
      });
    });

  // Add simple linear edges if necessary (assuming structure might imply some)
  // For this advanced version, we rely on the explicit edges provided in the structure.

  // 3. Render Edges
  allEdges.forEach((edge) => {
    mermaidCode += `${edge.source} --> ${edge.target} ${edge.label};\n`;
  });

  return mermaidCode.trim();
};