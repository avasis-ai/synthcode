import { describe, it, expect, vi } from "vitest";
import { AgentActionLogger, AgentActionPayload } from "../src/logging/agent-action-logger";

describe("AgentActionLogger", () => {
  it("should log the action payload correctly using the provided logSink", () => {
    const mockLogSink = vi.fn();
    const logger = new AgentActionLogger(mockLogSink);

    const payload: AgentActionPayload = {
      actionType: "DECISION",
      sourceComponent: "AgentCore",
      actionDetails: { decision: "Use Tool A" },
      metadata: { traceId: "xyz123" },
      confidenceScore: 0.95,
    };

    logger.logAction(payload);

    expect(mockLogSink).toHaveBeenCalledTimes(1);
    expect(mockLogSink).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DECISION",
        sourceComponent: "AgentCore",
        actionDetails: { decision: "Use Tool A" },
        metadata: { traceId: "xyz123" },
        confidenceScore: 0.95,
      })
    );
  });

  it("should log an action payload without optional fields gracefully", () => {
    const mockLogSink = vi.fn();
    const logger = new AgentActionLogger(mockLogSink);

    const payload: AgentActionPayload = {
      actionType: "INTERNAL_STEP",
      sourceComponent: "Planner",
      actionDetails: { step: "Thinking" },
    };

    logger.logAction(payload);

    expect(mockLogSink).toHaveBeenCalledTimes(1);
    expect(mockLogSink).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "INTERNAL_STEP",
        sourceComponent: "Planner",
        actionDetails: { step: "Thinking" },
      })
    );
  });

  it("should default to console.log if no logSink is provided", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new AgentActionLogger();

    const payload: AgentActionPayload = {
      actionType: "TOOL_CALL",
      sourceComponent: "ToolExecutor",
      actionDetails: { toolName: "Search" },
    };

    logger.logAction(payload);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});