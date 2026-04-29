import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherV150 } from "../src/validation/structured-tool-call-validator-context-enricher-v150";
import { ProjectContext } from "../src/context/project-context";
import { SessionManager } from "../src/context/session-manager";
import { ToolUsageMetrics } from "../src/context/tool-usage-metrics";
import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../src/types";

describe("StructuredToolCallValidatorContextEnricherV150", () => {
  it("should correctly enrich context when all components are present", async () => {
    const mockProjectContext: ProjectContext = {
      projectName: "TestProject",
      projectScope: "API_CALLS",
    };
    const mockSessionManager: SessionManager = {
      getLatestSessionId: () => "session-123",
      getLatestMessages: () => [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] }
      ],
    };
    const mockToolUsageMetrics: ToolUsageMetrics = {
      getToolUsageCount: (toolName: string) => 1,
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV150(
      mockProjectContext,
      mockSessionManager,
      mockToolUsageMetrics
    );

    const enrichedContext = await enricher.enrichContext(
      {
        messages: [
          { role: "user", content: [{ type: "text", text: "What is the weather?" }] }
        ],
        currentIntent: "weather_query",
      }
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.baseContext?.sessionId).toBe("session-123");
    expect(enrichedContext?.metadataFusion?.userIntentWeight).toBeGreaterThanOrEqual(0);
  });

  it("should handle missing session data gracefully", async () => {
    const mockProjectContext: ProjectContext = {
      projectName: "TestProject",
      projectScope: "API_CALLS",
    };
    const mockSessionManager: SessionManager = {
      getLatestSessionId: () => "session-456",
      getLatestMessages: () => [], // Empty messages
    };
    const mockToolUsageMetrics: ToolUsageMetrics = {
      getToolUsageCount: (toolName: string) => 0,
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV150(
      mockProjectContext,
      mockSessionManager,
      mockToolUsageMetrics
    );

    const enrichedContext = await enricher.enrichContext(
      {
        messages: [],
        currentIntent: "unknown_intent",
      }
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.baseContext?.messages).toEqual([]);
    expect(enrichedContext?.metadataFusion?.sessionStateWeight).toBe(0);
  });

  it("should correctly incorporate tool usage metrics", async () => {
    const mockProjectContext: ProjectContext = {
      projectName: "TestProject",
      projectScope: "API_CALLS",
    };
    const mockSessionManager: SessionManager = {
      getLatestSessionId: () => "session-789",
      getLatestMessages: () => [
        { role: "tool", content: [{ type: "tool_use", toolCall: { name: "get_weather", arguments: {} } }] }
      ],
    };
    const mockToolUsageMetrics: ToolUsageMetrics = {
      getToolUsageCount: (toolName: string) => (toolName === "get_weather" ? 5 : 0),
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV150(
      mockProjectContext,
      mockSessionManager,
      mockToolUsageMetrics
    );

    const enrichedContext = await enricher.enrichContext(
      {
        messages: [
          { role: "user", content: [{ type: "text", text: "Weather?" }] }
        ],
        currentIntent: "weather_query",
      }
    );

    expect(enrichedContext).toBeDefined();
    // Assuming the enricher uses tool usage count in metadataFusion
    expect(enrichedContext?.metadataFusion?.toolUsageWeight).toBe(5);
  });
});