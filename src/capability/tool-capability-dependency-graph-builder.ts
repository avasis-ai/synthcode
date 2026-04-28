import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  dependencyType: "output_required" | "input_required" | "structural_dependency";
  reason: string;
  payload?: Record<string, unknown>;
}

export interface ToolCapabilityDependencyGraph {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export class ToolCapabilityDependencyGraphBuilder {
  private nodes: Map<string, CapabilityNode> = new Map();
  private edges: DependencyEdge[] = [];

  constructor(initialCapabilities: CapabilityNode[]) {
    initialCapabilities.forEach(capability => this.addNode(capability));
  }

  private addNode(capability: CapabilityNode): void {
    if (!this.nodes.has(capability.id)) {
      this.nodes.set(capability.id, capability);
    }
  }

  public addNode(capability: CapabilityNode): this {
    this.addNode(capability);
    return this;
  }

  public addDependency(
    fromCapabilityId: string,
    toCapabilityId: string,
    dependencyType: "output_required" | "input_required" | "structural_dependency",
    reason: string,
    payload?: Record<string, unknown>
  ): this {
    if (!this.nodes.has(fromCapabilityId) || !this.nodes.has(toCapabilityId)) {
      throw new Error(
        `Cannot create dependency: One or both capabilities (${fromCapabilityId}, ${toCapabilityId}) are not registered.`
      );
    }

    const edge: DependencyEdge = {
      from: fromCapabilityId,
      to: toCapabilityId,
      dependencyType,
      reason,
      payload,
    };
    this.edges.push(edge);
    return this;
  }

  public build(): ToolCapabilityDependencyGraph {
    const nodesArray: CapabilityNode[] = Array.from(this.nodes.values());
    return {
      nodes: nodesArray,
      edges: this.edges,
    };
  }
}