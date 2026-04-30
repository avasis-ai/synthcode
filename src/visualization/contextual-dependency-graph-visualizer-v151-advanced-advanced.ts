import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceUsage {
  resourceId: string;
  usageMetric: number;
  unit: string;
}

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  description: string;
}

export interface CapabilityLink {
  sourceCapability: string;
  targetCapability: string;
  strength: number;
}

export interface AdvancedContextPayload {
  messageHistory: Message[];
  temporalConstraints: TemporalConstraint[];
  resourceUsages: ResourceUsage[];
  capabilityLinks: CapabilityLink[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "message" | "tool" | "user" | "assistant";
  metadata: Record<string, any>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "dependency" | "temporal" | "capability";
  metadata: Record<string, any>;
}

export class ContextualDependencyGraphVisualizerAdvancedAdvanced {
  private payload: AdvancedContextPayload;

  constructor(payload: AdvancedContextPayload) {
    this.payload = payload;
  }

  private extractNodes(history: Message[]): GraphNode[] {
    const nodes: GraphNode[] = [];
    let nodeIdCounter = 0;

    history.forEach((message, index) => {
      let node: GraphNode;
      if ("user" === (message as UserMessage).role) {
        node = {
          id: `node-${nodeIdCounter++}`,
          label: `User Message ${index + 1}`,
          type: "user",
          metadata: { content: (message as UserMessage).content },
        };
      } else if ("assistant" === (message as AssistantMessage).role) {
        const content = (message as AssistantMessage).content.map(block => {
          if (block.type === "text") return (block as TextBlock).text;
          if (block.type === "tool_use") return `Tool Use: ${block.id}`;
          return "";
        }).join(" ");

        node = {
          id: `node-${nodeIdCounter++}`,
          label: `Assistant Response ${index + 1}`,
          type: "assistant",
          metadata: { content: content },
        };
      } else if ("tool" === (message as ToolResultMessage).role) {
        node = {
          id: `node-${nodeIdCounter++}`,
          label: `Tool Result (${(message as ToolResultMessage).tool_use_id})`,
          type: "tool",
          metadata: { content: (message as ToolResultMessage).content, error: (message as ToolResultMessage).is_error },
        };
      } else {
        return;
      }
      nodes.push(node);
    });
    return nodes;
  }

  private extractEdges(
    nodes: GraphNode[],
    payload: AdvancedContextPayload
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

    // 1. Message Dependencies (Sequential)
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        sourceId: nodes[i].id,
        targetId: nodes[i + 1].id,
        type: "dependency",
        metadata: { sequence: true },
      });
    }

    // 2. Temporal Constraints Edges
    payload.temporalConstraints.forEach((constraint, index) => {
      // For simplicity, link temporal constraints between the first and last relevant nodes
      if (nodes.length >= 2) {
        edges.push({
          sourceId: nodes[0].id,
          targetId: nodes[nodes.length - 1].id,
          type: "temporal",
          metadata: {
            constraint: constraint,
            index: index,
          },
        });
      }
    });

    // 3. Resource Usage Edges (Conceptual links from nodes to a conceptual resource hub)
    payload.resourceUsages.forEach((usage, index) => {
      // Link resource usage to the most recent node for context
      if (nodes.length > 0) {
        edges.push({
          sourceId: nodes[nodes.length - 1].id,
          targetId: "resource_hub", // Conceptual target
          type: "resource",
          metadata: { usage: usage, index: index },
        });
      }
    });

    // 4. Capability Links (Direct links between nodes if capabilities are mentioned)
    payload.capabilityLinks.forEach((link, index) => {
      // In a real scenario, we'd map capabilities to specific nodes. Here, we link to the last node.
      if (nodes.length > 0) {
        edges.push({
          sourceId: nodes[nodes.length - 1].id,
          targetId: "capability_hub", // Conceptual target
          type: "capability",
          metadata: { link: link, index: index },
        });
      }
    });

    return edges;
  }

  public visualize(): { nodes: GraphNode[]; edges: GraphEdge[]; } {
    const nodes = this.extractNodes(this.payload.messageHistory);
    const edges = this.extractEdges(nodes, this.payload);
    return { nodes, edges };
  }
}