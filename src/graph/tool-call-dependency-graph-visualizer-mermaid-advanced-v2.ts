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

interface DependencyGraph {
  nodes: string[];
  edges: {
    source: string;
    target: string;
    weight: number;
  }[];
}

type GraphTraversalResult = {
  cycles: string[][];
  confidenceScores: Map<string, number>;
};

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV2 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private detectCycles(graph: DependencyGraph): string[][] {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.edges
        .filter((edge) => edge.source === node)
        .map((edge) => edge.target);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, path);
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
        }
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    return cycles;
  }

  private calculateConfidence(graph: DependencyGraph): Map<string, number> {
    const confidenceScores = new Map<string, number>();

    for (const edge of graph.edges) {
      const edgeKey = `${edge.source} -> ${edge.target}`;
      const currentScore = confidenceScores.get(edgeKey) || 0;
      confidenceScores.set(edgeKey, currentScore + edge.weight);
    }
    return confidenceScores;
  }

  public generateMermaidDiagram(graph: DependencyGraph): string {
    const cycles = this.detectCycles(graph);
    const confidenceScores = this.calculateConfidence(graph);

    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    graph.nodes.forEach((node, index) => {
      mermaid += `    ${node}["${node}"];\n`;
    });

    // 2. Define Edges with Confidence and Cycle Markers
    graph.edges.forEach((edge, index) => {
      const confidence = confidenceScores.get(`${edge.source} -> ${edge.target}`) || "1";
      const label = `Confidence: ${confidence}`;
      
      let edgeDefinition = `${edge.source} -- "${label}" --> ${edge.target};`;

      // Simple styling for visualization enhancement (e.g., thicker lines for high confidence)
      if (parseFloat(confidence) > 5) {
        edgeDefinition = `${edge.source} -- "${label}" --> ${edge.target}:::high-confidence;`;
      } else {
        edgeDefinition = `${edge.source} -- "${label}" --> ${edge.target};`;
      }
      
      mermaid += `    ${edgeDefinition}\n`;
    });

    // 3. Cycle Detection Visualization (Subgraph/Styling)
    if (cycles.length > 0) {
      mermaid += "\n%% Cycle Detection Markers\n";
      cycles.forEach((cycle, index) => {
        const cycleNodes = cycle.join(" -> ");
        mermaid += `    subgraph Cycle ${index + 1}: ${cycleNodes}
        direction LR
        ${cycle.join(" --> ")}
        end\n`;
      });
    }

    // 4. Styling Definitions
    mermaid += "\n%% Styling\n";
    mermaid += "classDef high-confidence fill:#f9f,stroke:#333,stroke-width:2px;\n";

    return mermaid.trim();
  }
}