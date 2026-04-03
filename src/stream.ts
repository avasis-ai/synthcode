import type { TokenUsage } from "./types.js";

export interface StreamEvent {
  type: "text_delta" | "tool_use_start" | "tool_use_delta" | "tool_result" | "done" | "error";
  text?: string;
  id?: string;
  name?: string;
  input?: string;
  output?: string;
  usage?: TokenUsage;
  error?: Error;
}

export function createStreamAggregator() {
  let text = "";
  const toolCalls: Map<string, { id: string; name: string; input: string }> = new Map();
  let usage: TokenUsage | undefined;
  let stopReason: "end_turn" | "tool_use" | "max_tokens" = "end_turn";

  function push(event: StreamEvent): void {
    switch (event.type) {
      case "text_delta":
        text += event.text ?? "";
        break;
      case "tool_use_start":
        if (event.id) {
          toolCalls.set(event.id, { id: event.id, name: event.name ?? "", input: event.input ?? "" });
        }
        stopReason = "tool_use";
        break;
      case "tool_use_delta":
        if (event.id && toolCalls.has(event.id)) {
          toolCalls.get(event.id)!.input += event.input ?? "";
        }
        break;
      case "done":
        usage = event.usage;
        break;
      case "tool_result":
        break;
      case "error":
        break;
    }
  }

  function getResponse(): {
    text: string;
    toolCalls: { id: string; name: string; input: string }[];
    usage?: TokenUsage;
    stopReason: string;
  } {
    return { text, toolCalls: Array.from(toolCalls.values()), usage, stopReason };
  }

  return { push, getResponse };
}
