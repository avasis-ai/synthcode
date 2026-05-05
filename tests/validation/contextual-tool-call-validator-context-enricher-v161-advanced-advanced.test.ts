import { describe, it, expect } from "vitest";
import {
  ContextualToolCallValidatorContextEnricherV161AdvancedAdvanced,
} from "../src/validation/contextual-tool-call-validator-context-enricher-v161-advanced-advanced.js";
import { AgentContext } from "../src/validation/agent-context-service.js";
import { ResourceMetrics } from "../src/validation/resource-metrics-service.js";
import { ContextualStateDiff } from "../src/validation/contextual-state-diff-service.js";

describe("ContextualToolCallValidatorContextEnricherV161AdvancedAdvanced", () => {
  it("should enrich context when agent context is available", async () => {
    const mockAgentContext = {
      user_id: "user123",
      session_id: "session456",
      history: [{ role: "user", content: "Hello" }],
    } as AgentContext;
    const enricher = new ContextualToolCallValidatorContextEnricherV161AdvancedAdvanced(
      mockAgentContext,
      {},
      {},
    );
    const enrichedContext = await enricher.enrichContext(
      {
        tool_call_id: "call1",
        tool_name: "get_weather",
        parameters: { location: "Tokyo" },
      },
    );

    expect(enrichedContext).toHaveProperty("agentContext");
    expect(enrichedContext.agentContext).toEqual(mockAgentContext);
  });

  it("should enrich context when resource metrics are available", async () => {
    const mockResourceMetrics = {
      api_calls: 10,
      latency_ms: 150,
    } as ResourceMetrics;
    const enricher = new ContextualToolCallValidatorContextEnricherV161AdvancedAdvanced(
      {},
      mockResourceMetrics,
      {},
    );
    const enrichedContext = await enricher.enrichContext(
      {
        tool_call_id: "call2",
        tool_name: "get_stock_price",
        parameters: { symbol: "GOOGL" },
      },
    );

    expect(enrichedContext).toHaveProperty("resourceMetrics");
    expect(enrichedContext.resourceMetrics).toEqual(mockResourceMetrics);
  });

  it("should enrich context when state diff is available", async () => {
    const mockStateDiff = {
      changed_keys: ["user_profile.email"],
      diff: {
        user_profile: {
          email: "new@example.com",
        },
      },
    } as ContextualStateDiff;
    const enricher = new ContextualToolCallValidatorContextEnricherV161AdvancedAdvanced(
      {},
      {},
      mockStateDiff,
    );
    const enrichedContext = await enricher.enrichContext(
      {
        tool_call_id: "call3",
        tool_name: "update_user_profile",
        parameters: { email: "new@example.com" },
      },
    );

    expect(enrichedContext).toHaveProperty("stateDiff");
    expect(enrichedContext.stateDiff).toEqual(mockStateDiff);
  });
});