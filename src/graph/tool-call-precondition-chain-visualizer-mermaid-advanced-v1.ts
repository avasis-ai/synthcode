import { Message, ToolUseBlock } from "./types";

export interface PreconditionCheck {
  name: string;
  description: string;
  dependsOn?: string;
}

export class ToolCallPreconditionChainVisualizerMermaidAdvancedV1 {
  private preconditions: PreconditionCheck[];

  constructor(preconditions: PreconditionCheck[]) {
    this.preconditions = preconditions;
  }

  private generateNodeId(precondition: PreconditionCheck): string {
    return `P_${precondition.name.replace(/\s/g, '_').toUpperCase()}`;
  }

  private generateGraphDefinition(): string {
    let graph = "graph TD;\n";
    let nodes = "";
    let links = "";

    const startNodeId = "START";
    const endNodeId = "END";

    nodes += `  ${startNodeId}[Start Precondition Check]\n`;
    nodes += `  ${endNodeId}[End Tool Call Preparation]\n`;

    const nodeMap: Record<string, string> = {};

    this.preconditions.forEach((precondition, index) => {
      const nodeId = this.generateNodeId(precondition);
      nodeMap[precondition.name] = nodeId;

      // Define the check node
      nodes += `  ${nodeId}["${precondition.name}\\n(${precondition.description})"]\n`;

      // Define success/fail paths for this check
      links += `  ${nodeId} -- Success --> ${this.generateNodeId(precondition).replace('P_', 'P_SUCCESS')};\n`;
      links += `  ${nodeId} -- Failure --> FAIL_PATH;\n`;
    });

    // Define intermediate success/fail nodes for clarity
    let currentSuccessNodeId = startNodeId;

    this.preconditions.forEach((precondition, index) => {
      const nodeId = this.generateNodeId(precondition);
      const nextSuccessNodeId = `P_SUCCESS_${index + 1}`;

      // Link previous success to current check
      links += `  ${currentSuccessNodeId} --> ${nodeId};\n`;

      // Link current success to the next stage (or end if last)
      if (index < this.preconditions.length - 1) {
        links += `  ${nodeId} -- Success --> ${nextSuccessNodeId};\n`;
        currentSuccessNodeId = nextSuccessNodeId;
      } else {
        links += `  ${nodeId} -- Success --> ${endNodeId};\n`;
        currentSuccessNodeId = endNodeId;
      }
    });

    // Define failure path aggregation
    links += `  FAIL_PATH[Precondition Failed] --> ${endNodeId};\n`;

    // Final structure assembly
    graph += nodes;
    graph += links;

    return graph;
  }

  public renderMermaidGraph(): string {
    return this.generateGraphDefinition();
  }
}