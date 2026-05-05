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

export interface ContextualDependencyPayload {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    dependencies: {
      sourceId: string;
      targetId: string;
      type: "direct" | "contextual" | "resource";
      context?: {
        stateDiff: Record<string, any>;
        resourceConstraint: string;
        temporalLink: { from: string; to: string };
      };
    }[];
  };
  stateChanges: Record<string, any>;
  resourceUsage: Record<string, { usage: number; limit: number }>;
}

export interface GraphNode {
  id: string;
  type: "message" | "tool_call" | "context_state" | "resource";
  label: string;
  position: { x: number; y: number };
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "dependency" | "contextual_flow" | "resource_flow";
  weight: number;
}

export class ContextualToolCallDependencyGraphVisualizer {
  private payload: ContextualDependencyPayload;

  constructor(payload: ContextualDependencyPayload) {
    this.payload = payload;
  }

  private extractNodes(payload: ContextualDependencyPayload): GraphNode[] {
    const nodes: GraphNode[] = [];

    // 1. Message Nodes
    this.payload.messages.forEach((msg, index) => {
      let label = "";
      let type: "message" = "message";
      if (msg.role === "user") {
        label = `User Input (${index})`;
      } else if (msg.role === "assistant") {
        label = `Assistant Response (${index})`;
      } else if (msg.role === "tool") {
        label = `Tool Result (${index})`;
      }
      nodes.push({
        id: `msg-${index}`,
        type: type,
        label: label,
        position: { x: 0, y: 0 }, // Placeholder, layout engine handles this
      });
    });

    // 2. Tool Call Nodes
    this.payload.toolCalls.forEach((tc, index) => {
      nodes.push({
        id: `tool-${tc.id}`,
        type: "tool_call",
        label: `${tc.name} (ID: ${tc.id.substring(0, 4)})`,
        position: { x: 0, y: 0 },
      });
    });

    // 3. Context State Nodes
    Object.keys(payload.stateChanges).forEach((key, index) => {
      nodes.push({
        id: `state-${key}`,
        type: "context_state",
        label: `State: ${key}`,
        position: { x: 0, y: 0 },
      });
    });

    // 4. Resource Nodes
    Object.keys(payload.resourceUsage).forEach((key, index) => {
      nodes.push({
        id: `resource-${key}`,
        type: "resource",
        label: `Resource: ${key}`,
        position: { x: 0, y: 0 },
      });
    });

    return nodes;
  }

  private extractEdges(payload: ContextualDependencyPayload): GraphEdge[] {
    const edges: GraphEdge[] = [];

    // 1. Direct Tool Call Dependencies
    payload.toolCalls.forEach((tc, index) => {
      tc.dependencies.forEach((dep, depIndex) => {
        if (dep.type === "direct") {
          edges.push({
            sourceId: dep.sourceId,
            targetId: dep.targetId,
            type: "dependency",
            weight: 1.0,
          });
        }
      });
    });

    // 2. Contextual Dependencies (State/Resource Links)
    payload.toolCalls.forEach((tc, index) => {
      tc.dependencies.forEach((dep, depIndex) => {
        if (dep.type === "contextual") {
          const context = dep.context!;
          // Link Tool Call -> State Dependency
          edges.push({
            sourceId: `tool-${tc.id}`,
            targetId: `state-${Object.keys(payload.stateChanges).find(k => context.stateDiff[k] !== undefined) || 'unknown'}`,
            type: "contextual_flow",
            weight: 0.8,
          });
          // Link Tool Call -> Resource Constraint
          edges.push({
            sourceId: `tool-${tc.id}`,
            targetId: `resource-${Object.keys(payload.resourceUsage).find(k => context.resourceConstraint.includes(k)) || 'unknown'}`,
            type: "resource_flow",
            weight: 0.7,
          });
        }
      });
    });

    // 3. Temporal/General Flow (Simplified: Link last message to next tool call)
    // This requires complex temporal logic, simplified here for structure completeness.
    // A real implementation would use timestamps from the payload.

    return edges;
  }

  public visualizeGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = this.extractNodes(this.payload);
    const edges = this.extractEdges(this.payload);

    // In a real scenario, this method would invoke a layout engine (e.g., D3 force simulation)
    // to calculate and update the 'position' property of all nodes.
    // For this implementation, we return the structure ready for external rendering.

    return { nodes, edges };
  }
}