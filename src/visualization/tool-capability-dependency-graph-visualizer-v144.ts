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

export interface CapabilityEdge {
  sourceCapabilityId: string;
  targetCapabilityId: string;
  dependencyType: "requires" | "provides";
  metadata: Record<string, unknown>;
}

export interface CapabilityNode {
  capabilityId: string;
  name: string;
  description: string;
  inputs: Record<string, { required: boolean; type: string }>;
  outputs: Record<string, { provided: boolean; type: string }>;
}

export interface CapabilityGraphPayload {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
  metadata: {
    workflowId: string;
    timestamp: number;
  };
}

export class ToolCapabilityDependencyGraphVisualizer {
  private payload: CapabilityGraphPayload;

  constructor(payload: CapabilityGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): void {
    console.log("--- Rendering Tool Capability Dependency Graph ---");
    console.log(`Workflow ID: ${this.payload.metadata.workflowId}`);
    console.log(`Total Nodes: ${this.payload.nodes.length}`);
    console.log(`Total Edges: ${this.payload.edges.length}`);

    this.renderNodes();
    this.renderEdges();
    console.log("--------------------------------------------------");
  }

  private renderNodes(): void {
    console.log("\n[Capability Nodes]");
    for (const node of this.payload.nodes) {
      console.log(`  - ${node.name} (${node.capabilityId}):`);
      console.log("    Description: " + node.description);
      console.log("    Inputs:", Object.keys(node.inputs).map(k => `${k} (${node.inputs[k].required ? 'Req' : 'Opt'})`).join(", "));
      console.log("    Outputs:", Object.keys(node.outputs).map(k => `${k} (${node.outputs[k].provided ? 'Prov' : 'Opt'})`).join(", "));
    }
  }

  private renderEdges(): void {
    console.log("\n[Dependencies Edges]");
    for (const edge of this.payload.edges) {
      console.log(`  -> ${edge.sourceCapabilityId} --(${edge.dependencyType})--> ${edge.targetCapabilityId}`);
      console.log(`     Metadata: ${JSON.stringify(edge.metadata)}`);
    }
  }

  public static createExamplePayload(): CapabilityGraphPayload {
    const nodes: CapabilityNode[] = [
      {
        capabilityId: "A1",
        name: "DataIngestion",
        description: "Fetches raw data from external sources.",
        inputs: { sourceUrl: { required: true, type: "string" } },
        outputs: { rawData: { provided: true, type: "string" } },
      },
      {
        capabilityId: "B2",
        name: "DataTransformation",
        description: "Cleans and structures raw data.",
        inputs: { rawData: { required: true, type: "string" } },
        outputs: { structuredData: { provided: true, type: "object" } },
      },
      {
        capabilityId: "C3",
        name: "ReportGeneration",
        description: "Generates final user-facing reports.",
        inputs: { structuredData: { required: true, type: "object" } },
        outputs: { finalReport: { provided: true, type: "string" } },
      },
    ];

    const edges: CapabilityEdge[] = [
      {
        sourceCapabilityId: "A1",
        targetCapabilityId: "B2",
        dependencyType: "requires",
        metadata: { compatibilityScore: 0.9, reason: "rawData is input for transformation" },
      },
      {
        sourceCapabilityId: "B2",
        targetCapabilityId: "C3",
        dependencyType: "requires",
        metadata: { compatibilityScore: 0.95, reason: "structuredData is required for reporting" },
      },
    ];

    return {
      nodes: nodes,
      edges: edges,
      metadata: {
        workflowId: "WF-20240515-001",
        timestamp: Date.now(),
      },
    };
  }
}