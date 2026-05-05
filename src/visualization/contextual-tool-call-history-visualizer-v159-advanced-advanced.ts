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

interface ToolCallContext {
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
  startTime: number;
  endTime: number;
  resourceUsage: {
    cpuMs: number;
    memoryMb: number;
  };
  dependencies: string[];
}

interface AggregatedHistory {
  messages: Message[];
  toolCalls: ToolCallContext[];
  timeline: {
    timestamp: number;
    event: "message" | "tool_call" | "system";
    details: any;
  }[];
}

class ContextualToolCallHistoryVisualizer {
  private history: Message[];
  private toolCalls: ToolCallContext[];

  constructor(history: Message[], toolCalls: ToolCallContext[]) {
    this.history = history;
    this.toolCalls = toolCalls;
  }

  private aggregateContext(history: Message[]): AggregatedHistory {
    const timeline: any[] = [];
    const messages: Message[] = [];

    history.forEach((msg, index) => {
      if (msg.role === "user") {
        messages.push(msg as UserMessage);
        timeline.push({
          timestamp: Date.now() + index * 1000,
          event: "message",
          details: msg,
        });
      } else if (msg.role === "assistant") {
        messages.push(msg as AssistantMessage);
        timeline.push({
          timestamp: Date.now() + index * 1000 + 100,
          event: "message",
          details: msg,
        });
      } else if (msg.role === "tool") {
        messages.push(msg as ToolResultMessage);
        timeline.push({
          timestamp: Date.now() + index * 1000 + 200,
          event: "tool_call",
          details: msg,
        });
      }
    });

    return { messages, toolCalls: [], timeline };
  }

  private buildToolCallGraph(toolCalls: ToolCallContext[]): any[] {
    return toolCalls.map((call, index) => ({
      id: `tool-${index}`,
      source: "previous_step",
      target: "current_step",
      type: "tool_execution",
      data: {
        name: call.toolName,
        usage: `CPU: ${call.resourceUsage.cpuMs}ms, Mem: ${call.resourceUsage.memoryMb}MB`,
        dependencies: call.dependencies.join(", "),
        timeSpan: call.endTime - call.startTime,
      },
    }));
  }

  public visualize(
    history: Message[],
    toolCalls: ToolCallContext[],
    filter: {
      resource: 'cpu' | 'memory' | 'none';
      dependency: string | null;
    } = { resource: 'none', dependency: null }
  ): { graphData: any[]; timelineData: any[]; summary: string } {
    const aggregated = this.aggregateContext(history);
    const graphData = this.buildToolCallGraph(toolCalls);

    let summary = `Visualization Summary: Processed ${history.length} messages and ${toolCalls.length} tool calls.`;

    if (filter.resource !== 'none') {
      summary += ` Filtering by ${filter.resource} usage.`;
    }
    if (filter.dependency) {
      summary += ` Focusing on dependency: ${filter.dependency}.`;
    }

    const filteredGraphData = graphData.filter(node => {
      if (filter.resource === 'cpu') {
        return node.data.usage.includes('CPU');
      }
      if (filter.resource === 'memory') {
        return node.data.usage.includes('Mem');
      }
      return true;
    });

    return {
      graphData: filteredGraphData,
      timelineData: aggregated.timeline,
      summary: summary,
    };
  }
}

export { ContextualToolCallHistoryVisualizer };