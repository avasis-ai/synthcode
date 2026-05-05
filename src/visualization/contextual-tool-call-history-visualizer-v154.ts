import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolCallHistory {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    output?: string;
    isError?: boolean;
  }[];
  reasoningSteps: string[];
}

export class ContextualToolCallHistoryVisualizer {
  private history: ToolCallHistory;

  constructor(history: ToolCallHistory) {
    this.history = history;
  }

  public getVisualizationData(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
    let nodeIdCounter = 0;

    const addNode = (label: string, type: string, data: Record<string, any> = {}) => {
      nodes.push({
        id: `node-${nodeIdCounter++}`,
        label: label,
        type: type,
        data: { ...data, id: `node-${nodeIdCounter - 1}` },
      });
    };

    const addEdge = (sourceId: string, targetId: string, relationship: string) => {
      edges.push({
        source: sourceId,
        target: targetId,
        relationship: relationship,
      });
    };

    // 1. Visualize Reasoning Steps (Sequential Flow)
    this.history.reasoningSteps.forEach((step, index) => {
      const nodeId = `reasoning-${index}`;
      addNode(`Reasoning Step ${index + 1}`, "thinking", { content: step });
    });

    // 2. Visualize Messages and Tool Calls (Core Interaction)
    let lastNodeId: string | null = null;

    this.history.messages.forEach((message, messageIndex) => {
      if (message.role === "user") {
        const userNodeId = `user-${messageIndex}`;
        addNode("User Input", "user", { content: message.content.map(block => block.text).join("") });
        if (lastNodeId) {
          addEdge(lastNodeId, userNodeId, "FOLLOWS");
        }
        lastNodeId = userNodeId;
      } else if (message.role === "assistant") {
        const assistantNodeId = `assistant-${messageIndex}`;
        addNode("Assistant Response", "assistant", { content: message.content.map(block => block.text).join("") });
        if (lastNodeId) {
          addEdge(lastNodeId, assistantNodeId, "GENERATES");
        }
        lastNodeId = assistantNodeId;
      } else if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const toolNodeId = `tool-result-${messageIndex}`;
        const errorStatus = toolResultMessage.is_error ? "ERROR" : "SUCCESS";
        addNode(`Tool Result (${toolResultMessage.tool_use_id})`, "tool_result", {
          content: toolResultMessage.content,
          status: errorStatus,
        });
        if (lastNodeId) {
          addEdge(lastNodeId, toolNodeId, "RECEIVES_RESULT");
        }
        lastNodeId = toolNodeId;
      }
    });

    // 3. Visualize Tool Calls (Specific Actions within Assistant/Thinking)
    this.history.toolCalls.forEach((toolCall, index) => {
      const toolCallNodeId = `tool-call-${index}`;
      const callLabel = `${toolCall.name} Call`;
      const callData = {
        name: toolCall.name,
        input: JSON.stringify(toolCall.input),
        id: toolCall.id,
      };
      addNode(callLabel, "tool_call", callData);

      // Connect tool call to the preceding step (usually assistant generation)
      if (lastNodeId) {
        addEdge(lastNodeId, toolCallNodeId, "INITIATES_CALL");
      }
    });

    return { nodes: nodes, edges: edges };
  }
}