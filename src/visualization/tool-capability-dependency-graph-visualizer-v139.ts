import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
}

export interface CapabilityEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "requires" | "compatible_with" | "conflicts_with";
  details: string;
}

export interface CapabilityGraphPayload {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
}

export type VisualizationInstructions = {
  mermaidGraph: string;
  metadata: Record<string, any>;
};

export function renderToolCapabilityDependencyGraph(
  payload: CapabilityGraphPayload
): VisualizationInstructions {
  const nodeDefinitions: string[] = payload.nodes.map(
    (node) => `    ${node.id}["${node.name}\\n(${node.description})"]`
  );

  const edgeDefinitions: string[] = payload.edges.map((edge) => {
    let relationship = "";
    switch (edge.dependencyType) {
      case "requires":
        relationship = "-->";
        break;
      case "compatible_with":
        relationship = "---";
        break;
      case "conflicts_with":
        relationship = "-.->";
        break;
    }
    return `    ${edge.sourceId} ${relationship} ${edge.targetId} : ${edge.dependencyType} (${edge.details})`;
  });

  const mermaidGraph = `graph TD\n${nodeDefinitions.join('\n')}\n\n${edgeDefinitions.join('\n')}`;

  return {
    mermaidGraph: mermaidGraph,
    metadata: {
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      description: "Dependency graph visualizing tool capability relationships."
    }
  };
}