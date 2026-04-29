import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface EnrichmentContext {
  resourceUsageMetrics: {
    cpuUsage: number;
    memoryUsage: number;
  };
  sessionConstraints: {
    maxTokens: number;
    requiredPermissions: string[];
  };
  history: Message[];
}

export interface ValidationContext {
  message: Message;
  enrichmentContext: EnrichmentContext;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  enrichedContext: Partial<EnrichmentContext>;
};

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    validationContext: ValidationContext,
    toolCall: ToolUseBlock
  ): ValidationResult {
    const { message, enrichmentContext } = validationContext;
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      enrichedContext: {
        ...enrichmentContext,
      },
    };

    const { resourceUsageMetrics, sessionConstraints, history } = enrichmentContext;

    // 1. Validate ToolUseBlock against session constraints
    if (toolCall.name.length === 0) {
      result.isValid = false;
      result.errors.push("ToolUseBlock must have a non-empty name.");
    }

    // 2. Validate ToolUseBlock input against potential resource constraints
    if (resourceUsageMetrics.cpuUsage > 0.9 && Object.keys(toolCall.input).length > 5) {
      result.isValid = false;
      result.errors.push(
        "High CPU usage detected. Consider simplifying tool input parameters."
      );
    }

    // 3. Check if the tool call is relevant based on recent history
    const recentHistory = history.slice(-3);
    const isRelevant = recentHistory.some(
      (msg) =>
        msg.role === "user" && msg.content.some(
          (block) =>
            block.type === "text" &&
            (
              block.text.toLowerCase().includes(toolCall.name.toLowerCase())
            )
          || block.text.toLowerCase().includes("tool call")
          )
        )
    );

    if (!isRelevant && recentHistory.length > 0) {
      result.isValid = false;
      result.errors.push(
        "Tool call seems out of context based on recent conversation history."
      );
    }

    // 4. Augment enriched context with validation findings (e.g., a flag)
    result.enrichedContext = {
      ...result.enrichedContext,
      isContextuallyValid: result.isValid,
    };

    return result;
  }
}