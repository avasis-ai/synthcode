import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ContextEnricherService {
  enrichContext(
    currentContext: {
      state: Record<string, unknown>;
      history: Message[];
      globalConstraints: Record<string, any>;
    },
    toolCallDetails: {
      toolName: string;
      arguments: Record<string, unknown>;
    }
  ): {
    enrichedContext: Record<string, any>;
    validationPayload: Record<string, any>;
  };
}

class StructuredToolCallValidatorContextEnricherV162 implements ContextEnricherService {
  enrichContext(
    currentContext: {
      state: Record<string, unknown>;
      history: Message[];
      globalConstraints: Record<string, any>;
    },
    toolCallDetails: {
      toolName: string;
      arguments: Record<string, unknown>;
    }
  ): {
    enrichedContext: Record<string, any>;
    validationPayload: Record<string, any>;
  } {
    const enrichedContext: Record<string, any> = {
      ...currentContext.state,
      ...currentContext.globalConstraints,
      history: currentContext.history,
    };

    const validationPayload: Record<string, any> = {
      toolCall: {
        name: toolCallDetails.toolName,
        arguments: toolCallDetails.arguments,
      },
      context: {
        state: currentContext.state,
        history: currentContext.history,
        globalConstraints: currentContext.globalConstraints,
      },
      enrichedData: {
        // Example of deriving context from history
        lastUserMessage: currentContext.history.filter(
          (msg) => msg.role === "user"
        ).pop()?.content || null,
        // Example of merging state and constraints
        combinedState: {
          ...currentContext.state,
          ...currentContext.globalConstraints,
        },
      },
    };

    return {
      enrichedContext,
      validationPayload,
    };
  }
}

export const structuredToolCallValidatorContextEnricherV162: ContextEnricherService = new StructuredToolCallValidatorContextEnricherV162();