import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface DependencyEdge {
  sourceCapabilityId: string;
  targetCapabilityId: string;
  dependencyType: "requires" | "compatible_with" | "optional";
  metadata: {
    requiredContext?: string;
    versionCompatibility?: {
      min: string;
      max: string;
    };
    description?: string;
  };
}

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
}

export interface CapabilityDependencyGraphPayload {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

type GraphRenderer = (payload: CapabilityDependencyGraphPayload) => void;

const createMockGraphRenderer: GraphRenderer = (payload) => {
  console.log("--- Rendering Tool Capability Dependency Graph ---");
  console.log(`Nodes found: ${payload.nodes.length}`);
  console.log(`Edges found: ${payload.edges.length}`);

  payload.nodes.forEach(node => {
    console.log(`\n[Node] ${node.name} (${node.id})`);
    console.log(`  Version: ${node.version}`);
    console.log(`  Capabilities: ${node.capabilities.join(', ')}`);
  });

  payload.edges.forEach((edge, index) => {
    const meta = edge.metadata;
    console.log(`\n[Edge ${index + 1}] ${edge.sourceCapabilityId} --(${edge.dependencyType})--> ${edge.targetCapabilityId}`);
    if (meta.requiredContext) {
      console.log(`  Context Required: ${meta.requiredContext}`);
    }
    if (meta.versionCompatibility) {
      console.log(`  Version Range: ${meta.versionCompatibility.min} to ${meta.versionCompatibility.max}`);
    }
  });
  console.log("--------------------------------------------------");
};

export const renderToolCapabilityDependencyGraph = (
  payload: CapabilityDependencyGraphPayload,
  renderer: GraphRenderer = createMockGraphRenderer
): void => {
  if (!payload || (!payload.nodes.length && !payload.edges.length)) {
    console.warn("Cannot render graph: Payload is empty.");
    return;
  }
  renderer(payload);
};