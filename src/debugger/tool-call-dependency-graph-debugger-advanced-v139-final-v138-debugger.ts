import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContentBlock {
  type: "text" | "tool_use" | "thinking";
}

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
  | { type: "tool_result"; result: string; is_error?: boolean };

export type ExecutionStep = {
  stepId: string;
  type: "start" | "node_enter" | "edge_traverse" | "node_exit" | "finish";
  message: Message | null;
  context: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    history: string[];
  };
  details: Record<string, unknown>;
};

export interface DebuggerState {
  currentStepIndex: number;
  executionTrace: ExecutionStep[];
  breakpoints: Set<string>;
}

export class ToolCallDependencyGraphDebugger {
  private state: DebuggerState;
  private history: ExecutionStep[] = [];

  constructor() {
    this.state = {
      currentStepIndex: -1,
      executionTrace: [],
      breakpoints: new Set<string>(),
    };
  }

  public setBreakpoint(stepId: string): void {
    this.state.breakpoints.add(stepId);
  }

  public clearBreakpoint(stepId: string): void {
    this.state.breakpoints.delete(stepId);
  }

  public initializeTrace(initialMessage: Message): void {
    this.state.executionTrace = [];
    this.history = [];
    this.state.breakpoints.clear();
    this.recordStep("start", null, {
      inputs: { initial_message: initialMessage },
      outputs: {},
      history: [],
    });
  }

  private recordStep(
    type: "start" | "node_enter" | "edge_traverse" | "node_exit" | "finish",
    message: Message | null,
    context: {
      inputs: Record<string, unknown>;
      outputs: Record<string, unknown>;
      history: string[];
    },
    details: Record<string, unknown> = {}
  ): void {
    const stepId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const step: ExecutionStep = {
      stepId,
      type,
      message,
      context,
      details,
    };
    this.history.push(step);
    this.state.executionTrace.push(step);
    this.state.currentStepIndex = this.state.executionTrace.length - 1;
  }

  public stepExecution(
    message: Message,
    nodeId: string,
    inputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    history: string[]
  ): void {
    if (this.state.executionTrace.length === 0) {
      this.initializeTrace(message);
    }

    const currentStep = this.state.executionTrace[this.state.currentStepIndex];

    if (this.state.breakpoints.has(currentStep.stepId)) {
      this.recordStep("node_enter", message, {
        inputs: inputs,
        outputs: {},
        history: [...history, `Breakpoint hit at ${nodeId}`],
      });
      return;
    }

    this.recordStep("node_enter", message, {
      inputs: inputs,
      outputs: {},
      history: [...history],
    });

    this.recordStep("edge_traverse", null, {
      inputs: inputs,
      outputs: {},
      history: [...history],
    }, { edge_source: "previous_node", edge_target: nodeId });

    this.recordStep("node_exit", message, {
      inputs: inputs,
      outputs: outputs,
      history: [...history],
    });
  }

  public finishExecution(): void {
    this.recordStep("finish", null, {
      inputs: {},
      outputs: {},
      history: ["Execution finished successfully."],
    });
  }

  public getCurrentState(): DebuggerState {
    return {
      currentStepIndex: this.state.currentStepIndex,
      executionTrace: [...this.state.executionTrace],
      breakpoints: new Set(this.state.breakpoints),
    };
  }

  public getExecutionTrace(): ExecutionStep[] {
    return [...this.history];
  }
}