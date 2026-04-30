import { describe, it, expect } from "vitest";
import {
  enrichStructuredToolOutputContext,
  HistoricalContext,
  SystemState,
  OverrideContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v166-advanced-advanced";

describe("enrichStructuredToolOutputContext", () => {
  it("should correctly enrich context when all parameters are provided", async () => {
    const historicalContext: HistoricalContext = {
      last_successful_tool_call_params: {
        tool_name: "search",
        params: { query: "test" },
      },
      average_latency_ms: 150,
    };
    const systemState: SystemState = {
      current_user_id: "user123",
      available_tools: ["search", "weather"],
      system_config_version: "v1.0",
    };
    const overrideContext: OverrideContext = {
      user_provided_defaults: {
        temperature: 0.7,
      },
      force_model: "gpt-4o",
    };

    const enrichedContext = await enrichStructuredToolOutputContext(
      historicalContext,
      systemState,
      overrideContext
    );

    expect(enrichedContext).toHaveProperty("historical_context");
    expect(enrichedContext).toHaveProperty("system_state");
    expect(enrichedContext).toHaveProperty("override_context");
    expect(enrichedContext.historical_context.average_latency_ms).toBe(150);
    expect(enrichedContext.system_state.current_user_id).toBe("user123");
    expect(enrichedContext.override_context.force_model).toBe("gpt-4o");
  });

  it("should handle missing optional parameters gracefully", async () => {
    const historicalContext: HistoricalContext = {};
    const systemState: SystemState = {
      current_user_id: "user456",
      available_tools: [],
      system_config_version: "v2.1",
    };
    const overrideContext: OverrideContext = {
      user_provided_defaults: undefined,
      force_model: undefined,
    };

    const enrichedContext = await enrichStructuredToolOutputContext(
      historicalContext,
      systemState,
      overrideContext
    );

    expect(enrichedContext.historical_context).toEqual({});
    expect(enrichedContext.system_state.current_user_id).toBe("user456");
    expect(enrichedContext.override_context).toEqual({});
  });

  it("should merge defaults correctly when provided", async () => {
    const historicalContext: HistoricalContext = {};
    const systemState: SystemState = {
      current_user_id: "user789",
      available_tools: ["calculator"],
      system_config_version: "v3.0",
    };
    const overrideContext: OverrideContext = {
      user_provided_defaults: {
        max_tokens: 2048,
      },
      force_model: "gpt-3.5-turbo",
    };

    const enrichedContext = await enrichStructuredToolOutputContext(
      historicalContext,
      systemState,
      overrideContext
    );

    expect(enrichedContext.override_context.user_provided_defaults).toEqual({
      max_tokens: 2048,
    });
    expect(enrichedContext.override_context.force_model).toBe("gpt-3.5-turbo");
  });
});