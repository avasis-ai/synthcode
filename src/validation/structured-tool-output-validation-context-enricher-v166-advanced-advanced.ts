import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface HistoricalContext {
  last_successful_tool_call_params?: Record<string, unknown>;
  average_latency_ms?: number;
}

export interface SystemState {
  current_user_id: string;
  available_tools: string[];
  system_config_version: string;
}

export interface OverrideContext {
  user_provided_defaults?: Record<string, unknown>;
  force_mode_enabled: boolean;
}

export interface EnrichedValidationContext {
  source_history: HistoricalContext;
  source_system: SystemState;
  source_override: OverrideContext;
  merged_context: Record<string, unknown>;
  confidence_score: number;
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly history: HistoricalContext;
  private readonly systemState: SystemState;
  private readonly overrideContext: OverrideContext;

  constructor(
    history: HistoricalContext,
    systemState: SystemState,
    overrideContext: OverrideContext,
  ) {
    this.history = history;
    this.systemState = systemState;
    this.overrideContext = overrideContext;
  }

  private mergeContext(
    history: HistoricalContext,
    system: SystemState,
    override: OverrideContext,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {
      history: history,
      system: system,
      override: override,
    };

    // Prioritization logic: Override > System > History
    const mergedParams: Record<string, unknown> = {
      ...history.last_successful_tool_call_params,
      ...system.available_tools.reduce((acc, toolName) => ({ ...acc, [toolName]: true }), {}),
      ...(override.user_provided_defaults || {}),
    };

    return {
      tool_params: mergedParams,
      user_id: system.current_user_id,
      config_version: system.system_config_version,
      force_mode: override.force_mode_enabled,
    };
  }

  public enrichContext(): EnrichedValidationContext {
    const mergedContext = this.mergeContext(
      this.history,
      this.systemState,
      this.overrideContext,
    );

    const confidenceScore = this.calculateConfidenceScore();

    return {
      source_history: this.history,
      source_system: this.systemState,
      source_override: this.overrideContext,
      merged_context: mergedContext,
      confidence_score: confidenceScore,
    };
  }

  private calculateConfidenceScore(): number {
    let score = 0.5; // Base score

    // Boost score if system state is fully defined
    if (this.systemState.available_tools.length > 0 && this.systemState.system_config_version) {
      score += 0.2;
    }

    // Boost score if overrides are explicitly set
    if (this.overrideContext.force_mode_enabled || this.overrideContext.user_provided_defaults) {
      score += 0.25;
    }

    // Slight boost if historical data exists
    if (this.history.last_successful_tool_call_params) {
      score += 0.1;
    }

    // Clamp score between 0.0 and 1.0
    return Math.min(1.0, Math.max(0.0, score));
  }
}