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

export interface ReflectionStep {
  reflection: string;
  context_analyzed: "tool_result" | "thought_process";
  actionable_insight: string;
}

interface AgentContext {
  history: Message[];
  goal: string;
}

type ReflectionProcessor = (
  context: AgentContext,
  last_result: Message,
) => {
  reflection: ReflectionStep;
  next_action: "continue_thought" | "call_tool" | "finish";
};

export class StructuredThoughtChainer {
  private readonly reflectionProcessor: ReflectionProcessor;

  constructor(reflectionProcessor: ReflectionProcessor) {
    this.reflectionProcessor = reflectionProcessor;
  }

  public async processStep(
    context: AgentContext,
    last_result: Message,
  ): Promise<{
    reflection: ReflectionStep;
    next_action: "continue_thought" | "call_tool" | "finish";
    next_context_update: Message | null;
  }> {
    const { reflection, next_action } = this.reflectionProcessor(
      context,
      last_result,
    );

    let next_context_update: Message | null = null;

    if (next_action === "continue_thought") {
      next_context_update = {
        role: "assistant",
        tool_use_id: "",
        content: [{ type: "thinking", thinking: `[Reflection]: ${reflection.reflection}\n[Insight]: ${reflection.actionable_insight}` }],
      } as unknown as AssistantMessage;
    } else if (next_action === "call_tool") {
      // In a real scenario, the processor would guide the tool call details.
      // Here we simulate the guidance by returning a placeholder structure.
      next_context_update = {
        role: "assistant",
        tool_use_id: "placeholder_tool_id",
        content: [{ type: "thinking", thinking: `[Reflection]: ${reflection.reflection}\n[Insight]: ${reflection.actionable_insight}\n[Next Step]: Calling tool based on insight.` }],
      } as unknown as AssistantMessage;
    } else if (next_action === "finish") {
      next_context_update = {
        role: "assistant",
        tool_use_id: "",
        content: [{ type: "thinking", thinking: `[Reflection]: ${reflection.reflection}\n[Insight]: ${reflection.actionable_insight}\n[Conclusion]: Goal achieved or process complete.` }],
      } as unknown as AssistantMessage;
    }

    return {
      reflection,
      next_action,
      next_context_update,
    };
  }
}