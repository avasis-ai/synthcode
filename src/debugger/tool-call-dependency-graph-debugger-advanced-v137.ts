import { EventEmitter } from "events";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_call"; tool_name: string; input: Record<string, unknown> };

interface DebugState {
  messageHistory: Message[];
  currentToolCall: ToolUseBlock | null;
  executionContext: Record<string, unknown>;
  dependencyGraph: Map<string, { inputs: Record<string, unknown>; outputs: Record<string, unknown>; dependencies: string[] }>;
}

export class ToolCallDependencyGraphDebuggerAdvancedV137 extends EventEmitter {
  private state: DebugState;

  constructor() {
    super();
    this.state = {
      messageHistory: [],
      currentToolCall: null,
      executionContext: {},
      dependencyGraph: new Map(),
    };
  }

  public initialize(initialMessages: Message[]): void {
    this.state.messageHistory = initialMessages;
    this.state.executionContext = {};
    this.state.dependencyGraph.clear();
    this.emit("initialized", this.state);
  }

  public recordToolCall(toolUseBlock: ToolUseBlock, inputs: Record<string, unknown>): void {
    this.state.currentToolCall = toolUseBlock;
    this.state.dependencyGraph.set(toolUseBlock.id, {
      inputs: inputs,
      outputs: {},
      dependencies: [],
    });
    this.emit("tool_call_recorded", {
      toolUseBlock,
      inputs,
      graph: this.state.dependencyGraph,
    });
  }

  public recordToolResult(toolUseId: string, resultContent: string, isError: boolean = false): void {
    const node = this.state.dependencyGraph.get(toolUseId);
    if (node) {
      node.outputs = { result: resultContent, error: isError };
      this.emit("tool_result_recorded", {
        toolUseId,
        resultContent,
        isError,
        graph: this.state.dependencyGraph,
      });
    }
  }

  public updateExecutionState(key: string, value: unknown): void {
    this.state.executionContext[key] = value;
    this.emit("state_updated", {
      key,
      value,
      context: { ...this.state.executionContext },
    });
  }

  public processLoopEvent(event: LoopEvent): void {
    if (event.type === "tool_call") {
      const toolUseBlock: ToolUseBlock = {
        type: "tool_use",
        id: `loop-${Date.now()}-${Math.random()}`,
        name: event.tool_name,
        input: event.input,
      };
      this.recordToolCall(toolUseBlock, event.input);
    } else if (event.type === "text") {
      this.state.messageHistory.push({ role: "user", content: event.text });
      this.emit("message_updated", { message: { role: "user", content: event.text } });
    } else if (event.type === "thinking") {
      this.state.messageHistory.push({ role: "assistant", content: [{ type: "thinking", thinking: event.thinking }] });
      this.emit("message_updated", { message: { role: "assistant", content: [{ type: "thinking", thinking: event.thinking }] } });
    }
  }

  public getGraphSnapshot(): Map<string, { inputs: Record<string, unknown>; outputs: Record<string, unknown>; dependencies: string[] }> {
    return new Map(this.state.dependencyGraph);
  }

  public getDebugState(): DebugState {
    return { ...this.state };
  }
}