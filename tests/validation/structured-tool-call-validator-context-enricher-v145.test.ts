import { describe, it, expect } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV145,
  EnrichedContext,
  HistoryStep,
} from "../src/validation/structured-tool-call-validator-context-enricher-v145";

describe("StructuredToolCallValidatorContextEnricherV145", () => {
  it("should correctly enrich context with basic history and resource usage", async () => {
    const mockHistory: HistoryStep[] = [
      {
        step_id: "step1",
        timestamp: 1678886400000,
        message: {
          role: "user",
          content: [{ type: "text", text: "Hello world" }],
        },
        resource_usage: {
          cpu_time_ms: 10,
          memory_usage_bytes: 1024,
          network_latency_ms: 5,
        },
      },
    ];
    const mockContext: {
      messages: Message[];
      current_tool_call: {
        id: string;
        name: string;
        input: Record<string, any>;
      };
    } = {
      messages: [
        {
          role: "assistant",
          content: [{ type: "tool_use", tool_call_id: "call1", name: "get_weather", input: {} }],
        },
      ],
      current_tool_call: {
        id: "call1",
        name: "get_weather",
        input: {},
      },
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV145();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      mockHistory
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.history).toEqual(mockHistory);
    expect(enrichedContext?.base_context).toEqual(mockContext);
  });

  it("should handle empty history gracefully", async () => {
    const mockHistory: HistoryStep[] = [];
    const mockContext: {
      messages: Message[];
      current_tool_call: {
        id: string;
        name: string;
        input: Record<string, any>;
      };
    } = {
      messages: [],
      current_tool_call: {
        id: "call1",
        name: "get_weather",
        input: {},
      },
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV145();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      mockHistory
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.history).toEqual([]);
    expect(enrichedContext?.base_context).toEqual(mockContext);
  });

  it("should correctly merge context when multiple history steps are present", async () => {
    const mockHistory: HistoryStep[] = [
      {
        step_id: "step1",
        timestamp: 1678886400000,
        message: {
          role: "user",
          content: [{ type: "text", text: "First turn" }],
        },
        resource_usage: {
          cpu_time_ms: 10,
          memory_usage_bytes: 1024,
          network_latency_ms: 5,
        },
      },
      {
        step_id: "step2",
        timestamp: 1678886500000,
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Second turn" }],
        },
        resource_usage: {
          cpu_time_ms: 20,
          memory_usage_bytes: 2048,
          network_latency_ms: 10,
        },
      },
    ];
    const mockContext: {
      messages: Message[];
      current_tool_call: {
        id: string;
        name: string;
        input: Record<string, any>;
      };
    } = {
      messages: [{
        role: "user",
        content: [{ type: "text", text: "Initial prompt" }],
      }],
      current_tool_call: {
        id: "call1",
        name: "get_weather",
        input: {},
      },
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV145();
    const enrichedContext = await enricher.enrichContext(
      mockContext,
      mockHistory
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.history).toHaveLength(2);
    expect(enrichedContext?.history[1].step_id).toBe("step2");
    expect(enrichedContext?.base_context).toEqual(mockContext);
  });
});