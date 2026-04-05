import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface DebuggerContext {
  currentStep: number;
  callStack: { functionName: string; depth: number }[];
  variableScope: Record<string, any>;
  graphState: Map<string, any>;
  history: Message[];
}

export interface DebugEvent {
  type: "step_start" | "step_end" | "continue_end";
  context: DebuggerContext;
  details: Record<string, any>;
}

export class ToolCallDependencyGraphDebugger {
  private context: DebuggerContext;

  constructor(initialContext: DebuggerContext) {
    this.context = {
      currentStep: 0,
      callStack: [],
      variableScope: {},
      graphState: new Map(),
      history: [],
    };
    Object.assign(this.context, initialContext);
  }

  private emitEvent(type: "step_start" | "step_end" | "continue_end", details: Record<string, any>): DebugEvent {
    return {
      type,
      context: { ...this.context },
      details,
    };
  }

  public stepInto(nodeId: string): DebugEvent {
    if (this.context.graphState.has(nodeId)) {
      this.context.currentStep += 1;
      this.context.callStack.push({ functionName: `executeNode(${nodeId})`, depth: this.context.callStack.length + 1 });
      this.context.graphState.set(nodeId, { status: "IN_PROGRESS", enteredAt: Date.now() });
      const event = this.emitEvent("step_start", { nodeId, action: "step_into" });
      this.context.callStack.pop();
      return event;
    }
    throw new Error(`Node ${nodeId} not found in the dependency graph.`);
  }

  public stepOver(nodeId: string): DebugEvent {
    if (this.context.graphState.has(nodeId)) {
      this.context.currentStep += 1;
      this.context.graphState.set(nodeId, { status: "EXECUTING", lastResult: "Partial" });
      const event = this.emitEvent("step_end", { nodeId, action: "step_over", resultSnapshot: this.context.variableScope });
      this.context.graphState.set(nodeId, { status: "COMPLETED", lastResult: "Success" });
      return event;
    }
    throw new Error(`Node ${nodeId} not found in the dependency graph.`);
  }

  public continueExecution(nextNodeId: string): DebugEvent {
    if (this.context.graphState.has(nextNodeId)) {
      this.context.currentStep += 1;
      this.context.callStack.push({ functionName: "continue", depth: this.context.callStack.length + 1 });
      this.context.graphState.set(nextNodeId, { status: "RUNNING" });
      const event = this.emitEvent("continue_end", { nextNodeId, action: "continue" });
      this.context.callStack.pop();
      return event;
    }
    throw new Error(`Next node ${nextNodeId} not found in the dependency graph.`);
  }

  public getContextSnapshot(): DebuggerContext {
    return { ...this.context };
  }
}