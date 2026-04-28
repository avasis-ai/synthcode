import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface NodePayload {
  id: string;
  label: string;
  type: "tool" | "agent" | "data";
  position: { x: number; y: number };
  resourceUsage?: { cpu: number; memory: number };
}

export interface EdgePayload {
  source: string;
  target: string;
  relationship: string;
  startTime: number;
  endTime: number;
  weight: number;
}

export interface TemporalConstraint {
  nodeId: string;
  constraint: "precedes" | "follows" | "concurrent";
  relatedNodeId: string;
  duration?: number;
}

export interface EnrichedGraphPayload {
  nodes: NodePayload[];
  edges: EdgePayload[];
  temporalConstraints: TemporalConstraint[];
}

export class DynamicDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  public visualize(): void {
    console.log("--- Dynamic Dependency Graph Visualization ---");
    this.renderNodes();
    this.renderEdges();
    this.renderTemporalConstraints();
    console.log("Visualization rendering complete.");
  }

  private renderNodes(): void {
    console.log("\n[Nodes]");
    this.payload.nodes.forEach(node => {
      let resourceInfo = node.resourceUsage
        ? ` | Resources: CPU=${node.resourceUsage.cpu.toFixed(2)}, Mem=${node.resourceUsage.memory.toFixed(2)}`
        : "";
      console.log(`  ID: ${node.id}, Label: ${node.label}, Type: ${node.type}, Position: (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)})${resourceInfo}`);
    });
  }

  private renderEdges(): void {
    console.log("\n[Edges]");
    this.payload.edges.forEach(edge => {
      console.log(`  ${edge.source} --(${edge.relationship})--> ${edge.target}`);
      console.log(`    Time: [${edge.startTime.toFixed(0)} - ${edge.endTime.toFixed(0)}], Weight: ${edge.weight.toFixed(2)}`);
    });
  }

  private renderTemporalConstraints(): void {
    console.log("\n[Temporal Constraints]");
    this.payload.temporalConstraints.forEach(constraint => {
      let constraintType = "";
      switch (constraint.constraint) {
        case "precedes":
          constraintType = "MUST PRECEDE";
          break;
        case "follows":
          constraintType = "MUST FOLLOW";
          break;
        case "concurrent":
          constraintType = "MUST BE CONCURRENT WITH";
          break;
      }
      console.log(`  Constraint: ${constraint.nodeId} ${constraintType} ${constraint.relatedNodeId}`);
      if (constraint.duration) {
        console.log(`    Duration Hint: ${constraint.duration.toFixed(1)} units.`);
      }
    });
  }
}