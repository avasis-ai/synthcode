import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ToolNode {
  id: string;
  name: string;
  description: string;
  inputs: {
    name: string;
    type: string;
    required: boolean;
  }[];
  outputs: {
    name: string;
    type: string;
  }[];
}

export interface ToolDependencyEdge {
  source: string;
  target: string;
  type: "INPUT_REQUIRED" | "OUTPUT_CONSUMED" | "CAPABILITY_LINK";
  description: string;
}

export interface ToolDependencyGraphPayload {
  nodes: ToolNode[];
  edges: ToolDependencyEdge[];
}

export type GraphVisualizationData = {
  mermaidDiagram: string;
  graphvizDot: string;
};

export class ToolDependencyGraphVisualizer {
  private payload: ToolDependencyGraphPayload;

  constructor(payload: ToolDependencyGraphPayload) {
    this.payload = payload;
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    const nodeDefinitions = this.payload.nodes.map(node => {
      let inputsStr = node.inputs.map(input => `  - ${input.name} (${input.type}) ${input.required ? "(Req)" : ""}`).join('\n');
      let outputsStr = node.outputs.map(output => `  - ${output.name} (${output.type})`).join('\n');

      return `${node.id}["${node.name}\\n${node.description}\\nInputs:\\n${inputsStr}\\nOutputs:\\n${outputsStr}"]`;
    }).join('\n');

    mermaid += nodeDefinitions + "\n";

    const edgeDefinitions = this.payload.edges.map(edge => {
      let link = "";
      switch (edge.type) {
        case "INPUT_REQUIRED":
          link = `${edge.source} -- "${edge.description}" (Requires ${edge.target}) --> ${edge.target}`;
          break;
        case "OUTPUT_CONSUMED":
          link = `${edge.source} -- "Uses Output: ${edge.description}" --> ${edge.target}`;
          break;
        case "CAPABILITY_LINK":
          link = `${edge.source} -.-> ${edge.target} (Capability Link: ${edge.description})`;
          break;
      }
      return link;
    }).join('\n');

    mermaid += "\n";
    mermaid += edgeDefinitions;

    return mermaid;
  }

  private generateGraphvizDot(): string {
    let dot = "graph ToolDependencyGraph {\n";

    const nodeDefinitions = this.payload.nodes.map(node => {
      let inputsStr = node.inputs.map(input => `${input.name}:${input.type}${input.required ? " [required]" : ""}`).join(", ");
      let outputsStr = node.outputs.map(output => `${output.name}:${output.type}`).join(", ");

      return `  ${node.id} [label="${node.name}\\n${node.description}\\nInputs: {${inputsStr}}\\nOutputs: {${outputsStr}}"];`;
    }).join('\n');

    dot += nodeDefinitions + "\n";

    const edgeDefinitions = this.payload.edges.map(edge => {
      let label = edge.description;
      let style = "";
      let edgeType = "";

      switch (edge.type) {
        case "INPUT_REQUIRED":
          edgeType = "-->";
          style = "bold";
          break;
        case "OUTPUT_CONSUMED":
          edgeType = "-->";
          style = "dashed";
          break;
        case "CAPABILITY_LINK":
          edgeType = "-.-";
          style = "dotted";
          break;
      }
      return `  ${edge.source} ${edgeType} ${edge.target} [label="${label}", style=${style}];`;
    }).join('\n');

    dot += "\n" + edgeDefinitions;
    dot += "\n}";

    return dot;
  }

  public visualize(): GraphVisualizationData {
    return {
      mermaidDiagram: this.generateMermaidGraph(),
      graphvizDot: this.generateGraphvizDot(),
    };
  }
}