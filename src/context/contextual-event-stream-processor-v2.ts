import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StreamProcessingRule {
  id: string;
  process(event: Message, context: Record<string, any>): {
    output: Message | null;
    newContext: Record<string, any>;
  };
}

export class ContextualEventStreamProcessorV2 {
  private rules: StreamProcessingRule[] = [];

  registerRule(rule: StreamProcessingRule): void {
    this.rules.push(rule);
  }

  processStream(initialEvent: Message, initialContext: Record<string, any>): {
    finalOutput: Message | null;
    finalContext: Record<string, any>;
  } {
    let currentEvent: Message | null = initialEvent;
    let currentContext: Record<string, any> = { ...initialContext };

    for (const rule of this.rules) {
      if (currentEvent === null) {
        break;
      }

      const result = rule.process(currentEvent, currentContext);
      currentEvent = result.output;
      currentContext = result.newContext;
    }

    return {
      finalOutput: currentEvent,
      finalContext: currentContext,
    };
  }
}