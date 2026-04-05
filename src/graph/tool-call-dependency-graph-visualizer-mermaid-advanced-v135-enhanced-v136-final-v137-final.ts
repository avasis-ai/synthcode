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

export interface AdvancedNodeMetadata {
  nodeId: string;
  description: string;
  metadata: Record<string, any>;
  flowControl?: {
    type: "loop" | "conditional";
    exitPoints: string[];
    condition?: string;
  };
}

export interface AdvancedEdgeMetadata {
  sourceId: string;
  targetId: string;
  label: string;
  metadata: Record<string, any>;
  flowControl?: {
    type: "conditional_path";
    condition: string;
  };
}

export interface DependencyGraphStructure {
  nodes: Record<string, AdvancedNodeMetadata>;
  edges: AdvancedEdgeMetadata[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private structure: DependencyGraphStructure;

  constructor(structure: DependencyGraphStructure) {
    this.structure = structure;
  }

  private getNodeMermaidId(nodeId: string): string {
    return `node_${nodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private getEdgeMermaidLink(sourceId: string, targetId: string): string {
    const sourceNode = this.structure.nodes[sourceId];
    const targetNode = this.structure.nodes[targetId];

    if (!sourceNode || !targetNode) {
      return "";
    }

    const sourceMermaidId = this.getNodeMermaidId(sourceId);
    const targetMermaidId = this.getNodeMermaidId(targetId);

    let link = `${sourceMermaidId} --> ${targetMermaidId}`;

    const edgeMeta = this.structure.edges.find(e =>
      e.sourceId === sourceId && e.targetId === targetId
    );

    if (edgeMeta) {
      let label = edgeMeta.label || "";
      if (edgeMeta.flowControl) {
        if (edgeMeta.flowControl.type === "conditional_path") {
          label = `[${edgeMeta.flowControl.condition}]`;
        }
      }
      return `${link} : ${label}`;
    }
    return "";
  }

  private generateNodeDefinition(nodeId: string, metadata: AdvancedNodeMetadata): string {
    const mermaidId = this.getNodeMermaidId(nodeId);
    let definition = `    ${mermaidId}["${metadata.description}"]\n`;

    if (metadata.flowControl) {
      if (metadata.flowControl.type === "loop") {
        definition += `    ${mermaidId} -- Loop Start --> ${mermaidId} : Loop\n`;
        if (metadata.flowControl.exitPoints.length > 0) {
          definition += `    ${mermaidId} -- Exit --> ${metadata.flowControl.exitPoints.join(', ')} : Exit\n`;
        }
      } else if (metadata.flowControl.type === "conditional") {
        definition += `    ${mermaidId} -- Condition --> ${mermaidId} : Check\n`;
        if (metadata.flowControl.condition) {
          definition += `    ${mermaidId} -- ${metadata.flowControl.condition} --> ${mermaidId} : Path\n`;
        }
      }
    }
    return definition;
  }

  private generateEdgeDefinitions(): string {
    let edgeDefinitions = "";
    const uniqueEdges = new Set<string>();

    for (const edge of this.structure.edges) {
      const key = `${edge.sourceId}-${edge.targetId}`;
      if (!uniqueEdges.has(key)) {
        edgeDefinitions += this.getEdgeMermaidLink(edge.sourceId, edge.targetId) + "\n";
        uniqueEdges.add(key);
      }
    }
    return edgeDefinitions;
  }

  public renderMermaidDiagram(): string {
    let mermaidCode = "graph TD\n";
    mermaidCode += "%% Advanced Tool Call Dependency Graph\n";

    // 1. Define Nodes
    let nodeDefinitions = "";
    for (const nodeId in this.structure.nodes) {
      const metadata = this.structure.nodes[nodeId];
      nodeDefinitions += this.generateNodeDefinition(nodeId, metadata);
    }
    mermaidCode += nodeDefinitions;

    // 2. Define Edges
    mermaidCode += "\n%% Edges\n";
    mermaidCode += this.generateEdgeDefinitions();

    // 3. Styling (Optional but good practice for advanced visualization)
    mermaidCode += "\n%% Styling\n";
    mermaidCode += "classDef loop fill:#ffdddd,stroke:#f00,stroke-width:2px;\n";
    mermaidCode += "classDef conditional fill:#ddffdd,stroke:#0a0,stroke-width:2px;\n";

    // Apply classes based on metadata (simplified application for demonstration)
    for (const nodeId in this.structure.nodes) {
      const metadata = this.structure.nodes[nodeId];
      const mermaidId = this.getNodeMermaidId(nodeId);
      if (metadata.flowControl) {
        if (metadata.flowControl.type === "loop") {
          mermaidCode += `class ${mermaidId} loop;\n`;
        } else if (metadata.flowControl.type === "conditional") {
          mermaidCode += `class ${mermaidId} conditional;\n`;
        }
      }
    }

    return mermaidCode;
  }
}