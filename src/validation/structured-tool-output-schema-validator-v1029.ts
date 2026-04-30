import {
  Message,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

abstract class BaseValidator {
  abstract validate(messages: Message[]): { isValid: boolean; errors: string[] };
}

interface ToolOutputContext {
  toolName: string;
  expectedInputSchema: Record<string, any>;
}

export class StructuredToolOutputSchemaValidatorV1029 extends BaseValidator {
  private readonly toolContexts: ToolOutputContext[];

  constructor(toolContexts: ToolOutputContext[]) {
    super();
    this.toolContexts = toolContexts;
  }

  validate(messages: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let lastToolOutput: ToolResultMessage | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "tool") {
        const toolMessage = message as ToolResultMessage;
        if (!this.validateSingleToolOutput(toolMessage, i, errors)) {
          // Error already added in validateSingleToolOutput
        }
        lastToolOutput = toolMessage;
      } else if (message.role === "assistant") {
        // Cross-tool consistency check after an assistant response that implies tool use
        this.checkCrossToolConsistency(messages, i, lastToolOutput, errors);
        lastToolOutput = null; // Reset context after assistant turn
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateSingleToolOutput(
    toolMessage: ToolResultMessage,
    index: number,
    errors: string[]
  ): boolean {
    let isValid = true;
    const toolUseId = toolMessage.tool_use_id;

    if (!toolUseId) {
      errors.push(`[Index ${index}] ToolResultMessage is missing tool_use_id.`);
      return false;
    }

    // 1. Basic structure check (Assuming content is the primary output)
    if (typeof toolMessage.content !== "string") {
      errors.push(`[Index ${index}] ToolResultMessage content must be a string.`);
      isValid = false;
    }

    // 2. Semantic/Schema Check (Simplified: checking if content looks like a JSON structure if expected)
    if (this.toolContexts.length > 0) {
      const expectedContext = this.toolContexts[0]; // Simplified: using the first context for demonstration
      try {
        const parsedJson = JSON.parse(toolMessage.content);
        // In a real scenario, we would validate 'parsedJson' against 'expectedContext.expectedInputSchema'
        // For this implementation, we just check if it parses as JSON.
        if (typeof parsedJson !== "object" || parsedJson === null) {
          errors.push(`[Index ${index}] ToolResultMessage content must be a JSON object.`);
          isValid = false;
        }
      } catch (e) {
        errors.push(`[Index ${index}] ToolResultMessage content is not valid JSON.`);
        isValid = false;
      }
    }

    return isValid;
  }

  private checkCrossToolConsistency(
    messages: Message[],
    currentIndex: number,
    lastToolOutput: ToolResultMessage | null,
    errors: string[]
  ): void {
    if (!lastToolOutput) return;

    // Example: If the last tool output indicated a specific failure mode,
    // the subsequent assistant message should acknowledge it.
    if (lastToolOutput.is_error && currentIndex > 0) {
      const assistantMessage = messages[currentIndex] as { role: "assistant", content: ContentBlock[] };
      const acknowledgesError = assistantMessage.content.some(block => {
        if (block.type === "text") {
          return block.text.toLowerCase().includes("error") || block.text.toLowerCase().includes("failed");
        }
        return false;
      });

      if (!acknowledgesError) {
        errors.push(
          `[Index ${currentIndex}] Cross-Tool Consistency Warning: Previous tool output was an error, but the subsequent assistant message does not explicitly acknowledge the failure.`
        );
      }
    }
  }
}