import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface EnrichedContext {
  messages: Message[];
  intended_tool_call: {
    name: string;
    input: Record<string, unknown>;
  } | null;
  execution_path: {
    step: number;
    tool_name: string;
    input_summary: string;
  }[];
}

export class StructuredToolCallValidatorContextEnricherV168 {
  enrich(
    messages: Message[],
    intendedToolCall: { name: string; input: Record<string, unknown> } | null
  ): EnrichedContext {
    const executionPath: {
      step: number;
      tool_name: string;
      input_summary: string;
    }[] = [];
    let step = 0;

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as { role: "assistant", content: ContentBlock[] };
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            executionPath.push({
              step: step++,
              tool_name: toolUseBlock.name,
              input_summary: JSON.stringify(toolUseBlock.input),
            });
          }
        }
      }
    }

    const enrichedContext: EnrichedContext = {
      messages: messages,
      intended_tool_call: intendedToolCall,
      execution_path: executionPath,
    };

    return enrichedContext;
  }
}