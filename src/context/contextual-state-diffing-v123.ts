import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type CausalLink = {
  sourceStateId: string;
  targetStateId: string;
  cause: string;
};

export interface StateChangeNode {
  stateId: string;
  timestamp: number;
  description: string;
  changes: Record<string, any>;
}

export interface CausalDiffReport {
  nodes: StateChangeNode[];
  links: CausalLink[];
  temporalOrder: number[];
}

export class ContextualStateDiffer {
  private readonly stateHistory: Map<string, any[]>;

  constructor() {
    this.stateHistory = new Map();
  }

  private generateStateId(timestamp: number, state: any): string {
    return `${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private processState(state: any, timestamp: number): StateChangeNode {
    const stateId = this.generateStateId(timestamp, state);
    const description = `State snapshot at ${new Date(timestamp).toISOString()}`;
    return {
      stateId: stateId,
      timestamp: timestamp,
      description: description,
      changes: state,
    };
  }

  public recordState(state: any): string {
    const timestamp = Date.now();
    const node = this.processState(state, timestamp);
    
    if (!this.stateHistory.has("main_context")) {
      this.stateHistory.set("main_context", []);
    }
    this.stateHistory.get("main_context")!.push(node);
    return node.stateId;
  }

  public generateDiffReport(
    currentState: any,
    previousState: any
  ): CausalDiffReport {
    const nodes: StateChangeNode[] = [];
    const links: CausalLink[] = [];
    const temporalOrder: number[] = [];

    const previousNodes = this.stateHistory.get("main_context") || [];
    
    // Simplified logic: Assume the last recorded state is the effective previous state for diffing
    if (previousNodes.length > 0) {
        const lastNode = previousNodes[previousNodes.length - 1];
        nodes.push(lastNode);
        temporalOrder.push(lastNode.timestamp);
    }

    const currentNode = this.processState(currentState, Date.now());
    nodes.push(currentNode);
    temporalOrder.push(currentNode.timestamp);

    // Simulate causal link generation
    if (previousState && currentState) {
        const causalLink: CausalLink = {
            sourceStateId: previousNodes.length > 0 ? previousNodes[previousNodes.length - 1].stateId : "N/A",
            targetStateId: currentNode.stateId,
            cause: "State transition detected based on input context change.",
        };
        links.push(causalLink);
    }

    return {
      nodes: nodes,
      links: links,
      temporalOrder: temporalOrder,
    };
  }
}