import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ResourceMetrics {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
}

interface TemporalContext {
  timeSinceLastActionMs: number;
  timestamp: number;
}

interface OperationalContext {
  resourceMetrics: ResourceMetrics;
  temporalContext: TemporalContext;
}

interface ValidationContext {
  baseContext: {
    messages: Message[];
    // Potentially other base context fields
  };
  operationalContext: OperationalContext;
}

class StructuredToolOutputValidationContextEnricher {
  private readonly operationalContext: OperationalContext;

  constructor(operationalContext: OperationalContext) {
    this.operationalContext = operationalContext;
  }

  enrich(baseContext: { messages: Message[] }): ValidationContext {
    return {
      baseContext: baseContext,
      operationalContext: this.operationalContext,
    };
  }
}

export { StructuredToolOutputValidationContextEnricher };