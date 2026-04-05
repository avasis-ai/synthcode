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

interface DependencyNode {
  id: string;
  description: string;
  type: "start" | "process" | "tool_call" | "conditional" | "end";
  metadata: Record<string, unknown>;
}

interface DependencyEdge {
  fromId: string;
  toId: string;
  condition?: string;
  loop?: boolean;
}

interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

type GraphVisualizer = {
  visualize: (graph: DependencyGraph) => string;
};

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV141FinalV138FinalV139NewFixV139NewFixV139NewV1SuccessorFixV2 implements GraphVisualizer {
  visualize(graph: DependencyGraph): string {
    let mermaidCode = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: string[] = graph.nodes.map(node => {
      let definition = `${node.id}["${node.description}"]`;

      if (node.type === "tool_call") {
        const toolUse = node.metadata as { toolUse: ToolUseBlock };
        if (toolUse && toolUse.toolUse) {
          definition = `${node.id}["Tool: ${toolUse.toolUse.name} (ID: ${toolUse.toolUse.id})"]`;
        }
      } else if (node.type === "conditional") {
        definition = `${node.id}["Decision Point"]`;
      }

      return definition;
    });

    mermaidCode += nodeDefinitions.join('\n') + "\n";

    // 2. Define Edges (Handling advanced logic)
    const edgeDefinitions: string[] = graph.edges.map(edge => {
      let edgeSyntax = `${edge.fromId} --> ${edge.toId}`;

      if (edge.condition) {
        edgeSyntax = `${edge.fromId} -- "${edge.condition}" --> ${edge.toId}`;
      } else if (edge.loop) {
        // Mermaid doesn't have native loop syntax for simple edges,
        // we simulate it by adding a note or using subgraph structure if possible,
        // but for pure Mermaid syntax, we'll use a descriptive edge and rely on the graph structure.
        edgeSyntax = `${edge.fromId} -- Loop Back --> ${edge.toId}`;
      }

      return edgeSyntax;
    });

    mermaidCode += edgeDefinitions.join('\n') + "\n";

    // 3. Add advanced structure wrappers (e.g., IF/ELSE blocks)
    // This part assumes the graph structure implies these blocks,
    // which is a simplification for pure Mermaid output.
    const conditionalEdges = graph.edges.filter(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.fromId);
      const toNode = graph.nodes.find(n => n.id === edge.toId);
      return fromNode?.type === "conditional" && toNode?.type !== "conditional";
    });

    if (conditionalEdges.length > 0) {
      mermaidCode += "\n%% --- Conditional Flow Simulation ---\n";
      mermaidCode += "subgraph Conditional Logic\n";
      // Assuming the first node after a conditional point is the 'True' path
      const startConditional = graph.nodes.find(n => n.type === "conditional");
      if (startConditional) {
        mermaidCode += `${startConditional.id} -->|True| ${conditionalEdges[0].toId};\n`;
        // Assuming the second path is the 'False' path
        mermaidCode += `${startConditional.id} -->|False| ${conditionalEdges.length > 1 ? conditionalEdges[1].toId : 'END_FALLBACK'};\n`;
      }
      mermaidCode += "end\n";
    }

    return mermaidCode.trim();
  }
}