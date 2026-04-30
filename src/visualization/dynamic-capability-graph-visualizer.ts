import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type CapabilityName = string;

interface CompatibilityEdge {
  source: CapabilityName;
  target: CapabilityName;
  type: "supports" | "requires" | "compatible_with";
  metadata?: Record<string, unknown>;
}

interface CapabilityNode {
  name: CapabilityName;
  description: string;
  metadata: Record<string, unknown>;
}

interface GraphPayload {
  nodes: CapabilityNode[];
  edges: CompatibilityEdge[];
}

class DynamicCapabilityGraphVisualizer {
  private capabilities: CapabilityNode[];
  private edges: CompatibilityEdge[];

  constructor() {
    this.capabilities = [];
    this.edges = [];
  }

  public addCapability(node: CapabilityNode): void {
    if (!this.capabilities.some(c => c.name === node.name)) {
      this.capabilities.push(node);
    }
  }

  public addCompatibilityEdge(edge: CompatibilityEdge): void {
    this.edges.push(edge);
  }

  public buildGraphPayload(): GraphPayload {
    return {
      nodes: this.capabilities,
      edges: this.edges,
    };
  }

  public static createVisualizer(): DynamicCapabilityGraphVisualizer {
    return new DynamicCapabilityGraphVisualizer();
  }
}

export {
  DynamicCapabilityGraphVisualizer,
  GraphPayload,
  CompatibilityEdge,
  CapabilityNode,
}