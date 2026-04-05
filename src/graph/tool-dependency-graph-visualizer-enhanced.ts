import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface ToolNodeMetadata {
  estimated_token_cost: number;
  execution_guard_status: "PASS" | "WARN" | "FAIL";
  required_context_state: string[];
}

export interface EnhancedToolNode {
  tool_use_id: string;
  name: string;
  input: Record<string, unknown>;
  metadata: ToolNodeMetadata;
}

export interface DependencyGraph {
  nodes: EnhancedToolNode[];
  edges: {
    source: string;
    target: string;
    dependency_type: "CALL" | "DATA_FLOW";
  }[];
}

export type VisualizationOutput = {
  mermaid_diagram: string;
  json_data: any;
};

export class ToolCallDependencyGraphVisualizerEnhanced {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private generateMermaidDiagram(): string {
    let mermaid = "graph TD;\n";
    
    this.graph.nodes.forEach(node => {
      const id = `T${node.tool_use_id.substring(0, 4)}`;
      let style = "";
      if (node.metadata.execution_guard_status === "FAIL") {
        style = " style fill:#f99,stroke:#333,stroke-width:2px";
      } else if (node.metadata.execution_guard_status === "WARN") {
        style = " style fill:#ffc,stroke:#333,stroke-width:2px";
      } else {
        style = " style fill:#ccf,stroke:#333,stroke-width:2px";
      }
      
      mermaid += `${id}["${node.name}\\n(Cost: ${node.metadata.estimated_token_cost} tokens)"]${style};\n`;
    });

    this.graph.edges.forEach(edge => {
      const sourceId = `T${edge.source.substring(0, 4)}`;
      const targetId = `T${edge.target.substring(0, 4)}`;
      mermaid += `${sourceId} -->|${edge.dependency_type}| ${targetId};\n`;
    });

    return mermaid;
  }

  private generateJsonData(): any {
    const nodeJson = this.graph.nodes.map(node => ({
      id: node.tool_use_id,
      label: `${node.name} (Cost: ${node.metadata.estimated_token_cost})`,
      metadata: {
        guardStatus: node.metadata.execution_guard_status,
        requiredContext: node.metadata.required_context_state,
      }
    }));

    const edgeJson = this.graph.edges.map(edge => ({
      sourceId: edge.source,
      targetId: edge.target,
      type: edge.dependency_type,
    }));

    return {
      nodes: nodeJson,
      edges: edgeJson,
    };
  }

  public visualize(): VisualizationOutput {
    const mermaid = this.generateMermaidDiagram();
    const json = this.generateJsonData();
    return {
      mermaid_diagram: mermaid,
      json_data: json,
    };
  }
}