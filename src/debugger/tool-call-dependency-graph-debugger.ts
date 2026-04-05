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

type GraphNode = {
  id: string;
  type: "user" | "assistant" | "tool";
  data: any;
};

type GraphEdge = {
  fromId: string;
  toId: string;
  type: "call" | "response" | "dependency";
  details: Record<string, any>;
};

export class DebuggerContext {
  private history: {
    step: {
      node: GraphNode;
      edge: GraphEdge;
      state: Record<string, any>;
      description: string;
    };
    index: number;
  }[];

  private currentNodeIndex: number;

  constructor(initialHistory: {
    step: {
      node: GraphNode;
      edge: GraphEdge;
      state: Record<string, any>;
      description: string;
    };
    index: number;
  } & { history: {
    step: {
      node: GraphNode;
      edge: GraphEdge;
      state: Record<string, any>;
      description: string;
    };
    index: number;
  } = {
    history: [],
    currentNodeIndex: -1,
  }
  : void {
    this.history = initialHistory.history;
    this.currentNodeIndex = initialHistory.index;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  public getCurrentStep(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    if (this.currentNodeIndex >= 0 && this.currentNodeIndex < this.history.length) {
      return this.history[this.currentNodeIndex].step;
    }
    return undefined;
  }

  public canStepForward(): boolean {
    return this.currentNodeIndex < this.history.length - 1;
  }

  public canStepBackward(): boolean {
    return this.currentNodeIndex > 0;
  }

  public step(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    if (!this.canStepForward()) {
      return undefined;
    }
    this.currentNodeIndex++;
    return this.getCurrentStep();
  }

  public goToPreviousStep(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    if (!this.canStepBackward()) {
      return undefined;
    }
    this.currentNodeIndex--;
    return this.getCurrentStep();
  }

  public inspectCurrentNode(): GraphNode | undefined {
    const step = this.getCurrentStep();
    return step ? step.node : undefined;
  }

  public inspectCurrentEdge(): GraphEdge | undefined {
    const step = this.getCurrentStep();
    return step ? step.edge : undefined;
  }

  public inspectCurrentState(): Record<string, any> | undefined {
    const step = this.getCurrentStep();
    return step ? step.state : undefined;
  }

  public resetToStart(): void {
    this.currentNodeIndex = 0;
  }
}

export class ToolCallDependencyGraphDebugger {
  private context: DebuggerContext;

  constructor(initialContext: {
    history: {
      step: {
        node: GraphNode;
        edge: GraphEdge;
        state: Record<string, any>;
        description: string;
      };
      index: number;
    };
  }) {
    this.context = new DebuggerContext(initialContext);
  }

  public getDebuggerContext(): DebuggerContext {
    return this.context;
  }

  public getCurrentStepDetails(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    return this.context.getCurrentStep();
  }

  public stepForward(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    return this.context.step();
  }

  public stepBackward(): {
    node: GraphNode;
    edge: GraphEdge;
    state: Record<string, any>;
    description: string;
  } | undefined {
    return this.context.goToPreviousStep();
  }

  public canStep(): boolean {
    return this.context.canStepForward();
  }

  public canGoBack(): boolean {
    return this.context.canStepBackward();
  }

  public reset(): void {
    this.context.resetToStart();
  }
}