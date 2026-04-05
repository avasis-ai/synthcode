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

interface GraphContext {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  executionTrace: {
    step: number;
    type: "user" | "assistant" | "tool";
    details: any;
    outcome: "success" | "failure" | "conditional";
    contextData: Record<string, any>;
  }[];
}

type MermaidGraphBuilder = {
  nodes: string[];
  edges: string[];
  graphTitle: string;
};

const initialGraphBuilder: MermaidGraphBuilder = {
  nodes: [],
  edges: [],
  graphTitle: "Tool Call Dependency Graph",
};

function processMessage(
  context: GraphContext,
  builder: MermaidGraphBuilder
): MermaidGraphBuilder {
  const lastMessage = context.messages[context.messages.length - 1];
  if (!lastMessage) {
    return builder;
  }

  if (lastMessage.role === "user") {
    builder.nodes.push(`User_Input[User Input: ${lastMessage.content.substring(0, 30)}...]`);
    builder.edges.push("Start --> User_Input");
  } else if (lastMessage.role === "assistant") {
    const assistantMsg = lastMessage as AssistantMessage;
    let nodeContent = "Assistant Response";
    if (assistantMsg.content.some((block) => block.type === "tool_use")) {
      nodeContent = "Tool Call Generation";
    }
    builder.nodes.push(`Assistant_Step[${nodeContent}]`);
    builder.edges.push("User_Input --> Assistant_Step");
  } else if (lastMessage.role === "tool") {
    const toolMsg = lastMessage as ToolResultMessage;
    const status = toolMsg.is_error ? "Error" : "Success";
    builder.nodes.push(`Tool_Result_${toolMsg.tool_use_id}[${status}: ${toolMsg.content.substring(0, 30)}...]`);
    builder.edges.push("Assistant_Step --> Tool_Result_${toolMsg.tool_use_id}");
  }
  return builder;
}

function processExecutionTrace(
  context: GraphContext,
  builder: MermaidGraphBuilder
): MermaidGraphBuilder {
  let currentBuilder = builder;

  context.executionTrace.forEach((traceStep, index) => {
    if (index === 0) {
      currentBuilder = { ...currentBuilder, nodes: [...currentBuilder.nodes, "Start"] };
      currentBuilder.edges = [...currentBuilder.edges, "Start"];
    }

    let stepNodeId: string;
    let stepNodeLabel: string;
    let incomingEdge: string;

    if (traceStep.type === "user") {
      stepNodeId = `Step_${index}_User`;
      stepNodeLabel = `User Action (${traceStep.contextData.action || "N/A"})`;
      incomingEdge = "Start --> " + stepNodeId;
    } else if (traceStep.type === "assistant") {
      stepNodeId = `Step_${index}_Assistant`;
      stepNodeLabel = `Assistant Logic (${traceStep.contextData.reason || "N/A"})`;
      incomingEdge = "User_Input --> " + stepNodeId;
    } else if (traceStep.type === "tool") {
      const toolId = traceStep.contextData.toolUseId || `Tool_${index}`;
      stepNodeId = `Step_${index}_Tool`;
      stepNodeLabel = `Tool Execution (${toolId})`;
      incomingEdge = "Assistant_Step --> " + stepNodeId;
    } else {
      return;
    }

    currentBuilder.nodes.push(`${stepNodeId}[${stepNodeLabel}]`);
    currentBuilder.edges.push(incomingEdge);

    if (traceStep.outcome === "conditional") {
      currentBuilder.edges.push(`${stepNodeId} -->|Condition Check| Decision_Point`);
      currentBuilder.nodes.push("Decision_Point[Decision Point]");
    }
  });

  return currentBuilder;
}

export function visualizeToolCallDependencyGraph(
  context: GraphContext
): string {
  let builder = initialGraphBuilder;

  // 1. Process message history for high-level context
  builder = processMessage(context, builder);

  // 2. Process detailed execution trace for flow control
  builder = processExecutionTrace(context, builder);

  // 3. Assemble Mermaid Syntax
  const graphDefinition = `graph TD\n${builder.graphTitle}\n`;

  const nodesString = builder.nodes.map((node, index) => {
    // Basic cleanup for Mermaid ID compatibility
    const safeId = node.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
    return `${safeId}["${node.replace(/[\r\n]/g, "\\n")}"]`;
  }).join('\n');

  const edgesString = builder.edges.map(edge => edge.trim()).join('\n');

  const mermaidCode = `${graphDefinition}\n${nodesString}\n${edgesString}`;

  return mermaidCode;
}