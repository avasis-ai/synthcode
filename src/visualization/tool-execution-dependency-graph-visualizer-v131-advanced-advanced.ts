import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: "CPU" | "Memory" | "Network";
}

export interface TemporalRelationship {
  predecessorId: string;
  successorId: string;
  minDelayMs: number;
  maxDelayMs: number;
}

export interface CapabilityLink {
  sourceToolId: string;
  targetToolId: string;
  capability: string;
  strength: number;
}

export interface ToolExecutionNode {
  toolId: string;
  name: string;
  inputs: Record<string, unknown>;
  executionTimeMs: number;
  resourceUsage: ResourceConstraint[];
  capabilitiesProvided: string[];
}

export interface DependencyGraphPayload {
  nodes: ToolExecutionNode[];
  edges: {
    dependencyId: string;
    sourceId: string;
    targetId: string;
    relationshipType: "depends_on" | "follows" | "constrains";
    temporal?: TemporalRelationship;
    capability?: CapabilityLink;
  }[];
  globalConstraints: ResourceConstraint[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public visualizeGraph(): void {
    console.log("--- Advanced Tool Execution Dependency Graph Visualization ---");
    console.log(`Total Nodes: ${this.payload.nodes.length}`);
    console.log(`Total Edges: ${this.payload.edges.length}`);
    console.log("----------------------------------------------------------");

    this.visualizeNodes();
    this.visualizeEdges();
    this.visualizeConstraints();
  }

  private visualizeNodes(): void {
    console.log("\n[Nodes Visualization]");
    this.payload.nodes.forEach(node => {
      console.log(`  Tool: ${node.name} (${node.toolId})`);
      console.log(`    Execution Time: ${node.executionTimeMs}ms`);
      console.log(`    Resources: ${node.resourceUsage.map(r => `${r.requiredAmount}${r.unit}`).join(', ')}`);
      console.log(`    Capabilities: ${node.capabilitiesProvided.join(', ')}`);
    });
  }

  private visualizeEdges(): void {
    console.log("\n[Dependency Edges Visualization]");
    this.payload.edges.forEach(edge => {
      let relationship = `Type: ${edge.relationshipType} (${edge.dependencyId})`;
      if (edge.temporal) {
        relationship += ` | Temporal: ${edge.temporal.minDelayMs}-${edge.temporal.maxDelayMs}ms`;
      }
      if (edge.capability) {
        relationship += ` | Capability Link: ${edge.capability.capability} (Strength: ${edge.capability.strength})`;
      }
      console.log(`  ${relationship}: ${edge.sourceId} -> ${edge.targetId}`);
    });
  }

  private visualizeConstraints(): void {
    console.log("\n[Global Resource Constraints]");
    if (this.payload.globalConstraints.length === 0) {
      console.log("  No global resource constraints detected.");
      return;
    }
    this.payload.globalConstraints.forEach(constraint => {
      console.log(`  Constraint: ${constraint.resourceName} requires ${constraint.requiredAmount} ${constraint.unit}`);
    });
  }

  public updatePayload(newPayload: DependencyGraphPayload): void {
    this.payload = newPayload;
    console.log("\n--- Payload Updated. Re-visualizing Graph. ---");
    this.visualizeGraph();
  }
}