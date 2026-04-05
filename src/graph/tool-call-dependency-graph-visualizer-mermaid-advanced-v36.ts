import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface DependencyGraph {
  messages: Message[];
  dependencies: {
    from: string;
    to: string;
    type: "call" | "response" | "control";
    details?: Record<string, any>;
  }[];
}

interface MermaidConfig {
  graphType: "graph TD";
  advancedDirectives: string[];
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV36 {
  private readonly graph: DependencyGraph;
  private readonly config: MermaidConfig;

  constructor(graph: DependencyGraph, config: MermaidConfig) {
    this.graph = graph;
    this.config = config;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? JSON.stringify(message.content) : "empty";
    return `${rolePrefix}_${index}_${contentHash.substring(0, 10)}`;
  }

  private getNodeLabel(message: Message): string {
    if (message.role === "user") {
      return `User: "${message.content?.[0]?.text || ""}".`;
    }
    if (message.role === "assistant") {
      const toolUses = (message.content as ContentBlock[]).filter(block => block.type === "tool_use");
      if (toolUses.length > 0) {
        return `Assistant (Calls: ${toolUses.length})`;
      }
      return `Assistant: "${(message.content as ContentBlock[])[0]?.text || ""}".`;
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content}`;
    }
    return "Unknown Message";
  }

  private generateNodes(): string[] {
    const nodes: string[] = [];
    const nodeMap = new Map<string, string>();

    this.graph.messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      let label = this.getNodeLabel(message);
      let nodeDefinition = `${nodeId}["${label}"]`;

      if (message.role === "assistant" && (message.content as ContentBlock[])?.some(block => block.type === "tool_use")) {
        nodeDefinition += `:::tool-call`;
      } else if (message.role === "tool") {
        nodeDefinition += `:::tool-result`;
      } else {
        nodeDefinition += `:::message`;
      }
      nodes.push(nodeDefinition);
      nodeMap.set(nodeId, nodeDefinition);
    });
    return nodes;
  }

  private generateEdges(): string[] {
    const edges: string[] = [];
    this.graph.dependencies.forEach((dep, index) => {
      const edge = `${dep.from} -- "${dep.type}" --> ${dep.to}`;
      edges.push(edge);
    });
    return edges;
  }

  private generateAdvancedDirectives(): string[] {
    const directives: string[] = [];
    // Example: Detecting and visualizing a specific 'control' flow pattern
    const loopDependencies = this.graph.dependencies.filter(d => d.type === "control" && d.details?.loopDetected);
    if (loopDependencies.length > 0) {
      directives.push("%% Advanced: Loop Detected %%");
      directives.push("subgraph Loop_Control");
      loopDependencies.forEach((dep, i) => {
        directives.push(`L${i}["Loop Start"] --> L${i+1}["Loop End"]:::loop-flow`);
      });
      directives.push("end");
    }

    // Example: Highlighting temporal dependencies (requires specific 'details')
    const temporalDeps = this.graph.dependencies.filter(d => d.type === "call" && d.details?.temporal);
    if (temporalDeps.length > 0) {
      directives.push("%% Advanced: Temporal Flow %%");
      temporalDeps.forEach((dep, i) => {
        directives.push(`T${i}["Time Step ${i+1}"] --> T${i+1}["Time Step ${i+2}"]:::temporal-link`);
      });
    }

    return directives;
  }

  public renderMermaidGraph(): string {
    const nodeDeclarations = this.generateNodes().join('\n');
    const edgeDeclarations = this.generateEdges().join('\n');
    const advancedDirectives = this.generateAdvancedDirectives().join('\n');

    const mermaidCode = `
${this.config.graphType}
    %% --- Node Definitions ---
${nodeDeclarations}

    %% --- Edge Definitions ---
${edgeDeclarations}

    %% --- Advanced Directives & Styling ---
${advancedDirectives}

%% Styling for advanced elements
classDef tool-call fill:#ffddaa,stroke:#f90,stroke-width:2px;
classDef tool-result fill:#aaffaa,stroke:#0a0,stroke-width:2px;
classDef message fill:#ddddff,stroke:#00f,stroke-width:1px;
classDef loop-flow fill:#ffaaaa,stroke:#f00,stroke-width:3px;
classDef temporal-link stroke-dasharray: 5 5, stroke: #888;
`;

    return mermaidCode.trim();
  }
}

export { ToolCallDependencyGraphVisualizerMermaidAdvancedV36 };