import { ProjectContext } from "../context/project-context";
import { SessionManager } from "../context/session-manager";
import { ToolUsageMetrics } from "../context/tool-usage-metrics";
import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../types";

export interface EnrichedContext {
  baseContext: {
    messages: Message[];
    currentIntent: string;
    sessionId: string;
  };
  metadataFusion: {
    userIntentWeight: number;
    sessionStateWeight: number;
    historicalUsageWeight: number;
    fusedMetadata: Record<string, unknown>;
  };
  toolCallContext: {
    requiredTools: string[];
    constraints: Record<string, unknown>;
  };
}

export class StructuredToolCallValidatorContextEnricherV150 {
  private projectContext: ProjectContext;
  private sessionManager: SessionManager;
  private toolUsageMetrics: ToolUsageMetrics;

  constructor(
    projectContext: ProjectContext,
    sessionManager: SessionManager,
    toolUsageMetrics: ToolUsageMetrics
  ) {
    this.projectContext = projectContext;
    this.sessionManager = sessionManager;
    this.toolUsageMetrics = toolUsageMetrics;
  }

  enrich(
    baseMessages: Message[],
    currentToolCallCandidate: { name: string; input: Record<string, unknown> }
  ): EnrichedContext {
    const baseContext: {
      messages: Message[];
      currentIntent: string;
      sessionId: string;
    } = {
      messages: baseMessages,
      currentIntent: this.projectContext.getPrimaryIntent(),
      sessionId: this.sessionManager.getCurrentSessionId(),
    };

    const userIntentWeight = this.projectContext.getIntentConfidenceScore();
    const sessionStateWeight = this.sessionManager.getStabilityScore();
    const historicalUsageWeight = this.toolUsageMetrics.getToolUsageFrequencyScore();

    const metadataFusion = {
      userIntentWeight: userIntentWeight,
      sessionStateWeight: sessionStateWeight,
      historicalUsageWeight: historicalUsageWeight,
      fusedMetadata: {
        combinedScore: (userIntentWeight * 0.4) + (sessionStateWeight * 0.3) + (historicalUsageWeight * 0.3),
        lastKnownTool: this.toolUsageMetrics.getLastUsedToolName(),
        userProfileSummary: this.projectContext.getUserProfileSummary(),
      },
    };

    const toolCallContext = {
      requiredTools: this.projectContext.getSchemaForCandidateTool(currentToolCallCandidate.name),
      constraints: this.sessionManager.getToolCallConstraints(),
    };

    return {
      baseContext,
      metadataFusion,
      toolCallContext,
    };
  }
}