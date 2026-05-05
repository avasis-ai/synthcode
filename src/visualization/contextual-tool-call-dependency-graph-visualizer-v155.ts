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

export interface ContextualToolCall {
  tool_call_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  resource_constraints?: {
    resource: string;
    min_capacity: number;
    max_capacity: number;
  };
  time_window?: {
    start_time_ms: number;
    end_time_ms: number;
  };
}

export interface DependencyEdge {
  source_id: string;
  target_id: string;
  dependency_type: "calls" | "depends_on" | "contextual";
  contextual_data?: {
    reason: string;
    weight: number;
  };
}

export interface ContextualNode {
  id: string;
  type: "user" | "assistant" | "tool_call";
  content: string;
  contextual_data?: ContextualToolCall;
}

export interface DependencyGraphPayload {
  nodes: ContextualNode[];
  edges: DependencyEdge[];
}

export class ContextualToolCallDependencyGraphVisualizerV155 {
  constructor() {}

  visualize(payload: DependencyGraphPayload): void {
    console.log("--- Contextual Tool Call Dependency Graph Visualization V155 ---");
    console.log("Processing Graph Payload:");
    console.log(`Nodes found: ${payload.nodes.length}`);
    console.log(`Edges found: ${payload.edges.length}`);

    payload.nodes.forEach((node, index) => {
      console.log(`\n[Node ${index + 1}] ID: ${node.id}, Type: ${node.type}`);
      console.log(`  Content Snippet: ${node.content.substring(0, 50)}...`);
      if (node.contextual_data) {
        console.log("  Contextual Data Present:");
        console.log(`    Tool: ${node.contextual_data.tool_name}`);
        if (node.contextual_data.resource_constraints) {
          console.log(`    Resource Constraint: ${node.contextual_data.resource_constraints.resource} [${node.contextual_data.resource_constraints.min_capacity}-${node.contextual_data.resource_constraints.max_capacity}]`);
        }
        if (node.contextual_data.time_window) {
          console.log(`    Time Window: ${node.contextual_data.time_window.start_time_ms} to ${node.contextual_data.time_window.end_time_ms}`);
        }
      }
    });

    payload.edges.forEach((edge, index) => {
      console.log(`\n[Edge ${index + 1}] ${edge.source_id} -> ${edge.target_id}`);
      console.log(`  Type: ${edge.dependency_type}`);
      if (edge.contextual_data) {
        console.log(`  Context: ${edge.contextual_data.reason} (Weight: ${edge.contextual_data.weight})`);
      }
    });

    console.log("\nVisualization rendering complete. Contextual overlays successfully processed.");
  }
}