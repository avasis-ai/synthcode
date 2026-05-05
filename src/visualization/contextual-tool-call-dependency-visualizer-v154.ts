import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ToolCallContext {
  tool_call_id: string;
  tool_name: string;
  input_params: Record<string, unknown>;
  required_resources: Record<string, { cost: number; unit: string }>;
  temporal_metadata: {
    start_time_ms: number;
    estimated_duration_ms: number;
  };
}

export interface DependencyEdge {
  source_id: string;
  target_id: string;
  dependency_type: "contextual" | "resource" | "temporal";
  metadata: Record<string, unknown>;
}

export interface ToolCallDependencyPayload {
  messages: Message[];
  tool_calls: ToolCallContext[];
  dependencies: DependencyEdge[];
}

export class ContextualToolCallDependencyVisualizer {
  private payload: ToolCallDependencyPayload;

  constructor(payload: ToolCallDependencyPayload) {
    this.payload = payload;
  }

  public visualize(): void {
    console.log("--- Contextual Tool Call Dependency Visualization ---");
    console.log(`Total Messages Processed: ${this.payload.messages.length}`);
    console.log(`Total Tool Calls Identified: ${this.payload.tool_calls.length}`);
    console.log(`Total Dependencies Mapped: ${this.payload.dependencies.length}`);

    this.renderToolCallNodes();
    this.renderDependencies();
  }

  private renderToolCallNodes(): void {
    console.log("\n[Nodes: Tool Calls & Context]");
    this.payload.tool_calls.forEach((call, index) => {
      console.log(`  Tool Call ${index + 1} (${call.tool_name}):`);
      console.log(`    ID: ${call.tool_call_id}`);
      console.log(`    Input: ${JSON.stringify(call.input_params)}`);
      console.log(`    Resources: ${JSON.stringify(call.required_resources)}`);
      console.log(`    Time Est: ${call.temporal_metadata.estimated_duration_ms}ms`);
    });
  }

  private renderDependencies(): void {
    console.log("\n[Edges: Dependencies]");
    this.payload.dependencies.forEach((edge, index) => {
      let typeInfo = "";
      switch (edge.dependency_type) {
        case "contextual":
          typeInfo = " (Contextual Link)";
          break;
        case "resource":
          typeInfo = " (Resource Constraint)";
          break;
        case "temporal":
          typeInfo = " (Temporal Flow)";
          break;
      }
      console.log(`  ${index + 1}. ${edge.source_id} -> ${edge.target_id}${typeInfo}`);
      if (edge.metadata) {
        console.log(`     Metadata: ${JSON.stringify(edge.metadata)}`);
      }
    });
  }
}