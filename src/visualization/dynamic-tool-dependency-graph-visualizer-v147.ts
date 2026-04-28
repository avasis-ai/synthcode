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

interface ToolInvocationRecord {
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  context_data: Record<string, unknown>;
  control_flow_marker?: "if_true" | "if_false" | "default";
}

interface ControlFlowEdge {
  sourceToolName: string;
  targetToolName: string;
  condition: string;
}

interface VisualizationPayload {
  nodes: {
    id: string;
    label: string;
    type: "tool" | "user" | "assistant";
    data: Record<string, unknown>;
  }[];
  dataDependencies: {
    sourceId: string;
    targetId: string;
    dataKey: string;
  }[];
  controlFlowEdges: ControlFlowEdge[];
}

abstract class BaseVisualizer {
  abstract visualize(
    messages: Message[],
    invocationRecords: ToolInvocationRecord[]
  ): VisualizationPayload;
}

export class DynamicToolDependencyGraphVisualizerV147 extends BaseVisualizer {
  visualize(
    messages: Message[],
    invocationRecords: ToolInvocationRecord[]
  ): VisualizationPayload {
    const nodes: {
      id: string;
      label: string;
      type: "tool" | "user" | "assistant";
      data: Record<string, unknown>;
    }[] = [];
    const dataDependencies: {
      sourceId: string;
      targetId: string;
      dataKey: string;
    }[] = [];
    const controlFlowEdges: ControlFlowEdge[] = [];

    const recordToNode = (record: ToolInvocationRecord, index: number): {
      id: string;
      label: string;
      type: "tool";
      data: Record<string, unknown>;
    } => {
      const id = `tool_${record.tool_name}_${index}`;
      return {
        id: id,
        label: `${record.tool_name} (Run ${index})`,
        type: "tool",
        data: {
          input: record.input,
          output: record.output,
          context_data: record.context_data,
        },
      };
    };

    // 1. Process Tool Invocation Records to build nodes and data dependencies
    const toolNodes = invocationRecords.map(
      (record, index) => recordToNode(record, index)
    );
    nodes.push(...toolNodes);

    // Simulate data dependencies between consecutive tool runs
    for (let i = 0; i < invocationRecords.length - 1; i++) {
      const source = invocationRecords[i];
      const target = invocationRecords[i + 1];
      dataDependencies.push({
        sourceId: `tool_${source.tool_name}_${i}`,
        targetId: `tool_${target.tool_name}_${i + 1}`,
        dataKey: "output_to_input",
      });
    }

    // 2. Analyze for Control Flow Edges
    for (let i = 0; i < invocationRecords.length - 1; i++) {
      const currentRecord = invocationRecords[i];
      const nextRecord = invocationRecords[i + 1];

      if (currentRecord.control_flow_marker) {
        let condition = "";
        let sourceToolName = currentRecord.tool_name;
        let targetToolName = nextRecord.tool_name;

        if (currentRecord.control_flow_marker === "if_true") {
          condition = "if_true";
        } else if (currentRecord.control_flow_marker === "if_false") {
          condition = "if_false";
        } else if (currentRecord.control_flow_marker === "default") {
          condition = "default";
        }

        if (condition) {
          controlFlowEdges.push({
            sourceToolName: sourceToolName,
            targetToolName: targetToolName,
            condition: condition,
          });
        }
      }
    }

    // 3. Incorporate User/Assistant context nodes (Simplified for this scope)
    // In a real scenario, we'd map messages to nodes.
    if (messages.length > 0) {
      nodes.push({
        id: "user_start",
        label: "User Input",
        type: "user",
        data: { content: messages[0].role === "user" ? messages[0].content : "N/A" },
      });
    }

    // Final structure assembly
    return {
      nodes: nodes,
      dataDependencies: dataDependencies,
      controlFlowEdges: controlFlowEdges,
    };
  }
}