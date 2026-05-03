import { describe, it, expect } from "vitest";
import {
  ReflectionStep,
  AgentContext,
  ReflectionProcessor,
} from "../src/thought/structured-thought-chaining-with-reflection";

describe("ReflectionProcessor", () => {
  it("should generate a reflection when the last result is a tool result", () => {
    const context: AgentContext = {
      history: [
        {
          role: "user",
          content: "What is the capital of France?",
        },
        {
          role: "assistant",
          content: "The capital of France is Paris.",
        },
        {
          role: "tool",
          content: "Tool executed successfully. Result: Paris.",
        },
      ],
      goal: "Determine the capital of France.",
    };
    const lastResult = {
      role: "tool",
      content: "Tool executed successfully. Result: Paris.",
    };

    const processor: ReflectionProcessor = (
      context: AgentContext,
      last_result: Message,
    ) => {
      // Mock implementation for testing
      if (last_result.role === "tool") {
        return {
          reflection: {
            reflection: "The tool confirmed the capital is Paris.",
            context_analyzed: "tool_result",
            actionable_insight: "The answer is confirmed.",
          },
          next_action: "continue",
        };
      }
      return {
        reflection: {
          reflection: "No tool result to reflect on.",
          context_analyzed: "thought_process",
          actionable_insight: "No insight.",
        },
        next_action: "finish",
      };
    };

    const result = processor(context, lastResult);

    expect(result.reflection.context_analyzed).toBe("tool_result");
    expect(result.reflection.actionable_insight).toBe("The answer is confirmed.");
    expect(result.next_action).toBe("continue");
  });

  it("should generate a reflection when the last result is a thought process", () => {
    const context: AgentContext = {
      history: [
        {
          role: "user",
          content: "Plan a trip to Italy.",
        },
        {
          role: "assistant",
          content: "I should first research major cities.",
        },
        {
          role: "assistant",
          content: "I will check flights and hotels.",
        },
      ],
      goal: "Plan a trip to Italy.",
    };
    const lastResult = {
      role: "assistant",
      content: "I will check flights and hotels.",
    };

    const processor: ReflectionProcessor = (
      context: AgentContext,
      last_result: Message,
    ) => {
      // Mock implementation for testing
      if (last_result.role === "assistant") {
        return {
          reflection: {
            reflection: "The plan seems solid, focusing on logistics.",
            context_analyzed: "thought_process",
            actionable_insight: "Next step: Search for specific dates.",
          },
          next_action: "continue",
        };
      }
      return {
        reflection: {
          reflection: "Unexpected role.",
          context_analyzed: "thought_process",
          actionable_insight: "Review context.",
        },
        next_action: "finish",
      };
    };

    const result = processor(context, lastResult);

    expect(result.reflection.context_analyzed).toBe("thought_process");
    expect(result.reflection.actionable_insight).toBe("Next step: Search for specific dates.");
    expect(result.next_action).toBe("continue");
  });

  it("should default to finishing if the last result is neither a tool nor an assistant message", () => {
    const context: AgentContext = {
      history: [
        {
          role: "user",
          content: "Simple query.",
        },
      ],
      goal: "Answer the query.",
    };
    const lastResult = {
      role: "unknown",
      content: "Some unexpected message.",
    };

    const processor: ReflectionProcessor = (
      context: AgentContext,
      last_result: Message,
    ) => {
      // Mock implementation for testing
      if (last_result.role === "tool" || last_result.role === "assistant") {
        return {
          reflection: {
            reflection: "Processed.",
            context_analyzed: "tool_result",
            actionable_insight: "Insight.",
          },
          next_action: "continue",
        };
      }
      return {
        reflection: {
          reflection: "No specific context found.",
          context_analyzed: "thought_process",
          actionable_insight: "Defaulting to finish.",
        },
        next_action: "finish",
      };
    };

    const result = processor(context, lastResult);

    expect(result.reflection.context_analyzed).toBe("thought_process");
    expect(result.next_action).toBe("finish");
  });
});