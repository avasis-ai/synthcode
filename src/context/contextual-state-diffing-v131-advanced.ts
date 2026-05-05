import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type CausalLink = {
  sourceStateId: string;
  targetStateId: string;
  causalReason: string;
};

export type TemporalConstraint = {
  startTime: number;
  endTime: number;
  dependency: string;
};

export interface StateDiffReport {
  currentStateId: string;
  previousStateId: string;
  diffs: Record<string, any>;
  causalLinks: CausalLink[];
  temporalConstraints: TemporalConstraint[];
  summary: string;
}

export class ContextualStateDiffer {
  private history: {
    stateId: string;
    state: any;
    timestamp: number;
  }[];

  constructor() {
    this.history = [];
  }

  private generateStateId(timestamp: number): string {
    return `state_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public recordState(state: any): string {
    const stateId = this.generateStateId(Date.now());
    this.history.push({
      stateId: stateId,
      state: state,
      timestamp: Date.now(),
    });
    return stateId;
  }

  public recordMessage(message: Message): string {
    const currentState = this.history.length > 0 ? this.history[this.history.length - 1].state : null;
    const newState = {
      messages: [...(currentState?.messages || []), message],
      lastMessage: message,
    };
    return this.recordState(newState);
  }

  public analyzeDiff(
    currentStateId: string,
    previousStateId: string
  ): StateDiffReport {
    const currentState = this.history.find((h) => h.stateId === currentStateId)?.state;
    const previousState = this.history.find((h) => h.stateId === previousStateId)?.state;

    if (!currentState || !previousState) {
      throw new Error("Invalid state IDs provided for diff analysis.");
    }

    const diffs: Record<string, any> = this.calculateStructuralDiff(
      previousState,
      currentState
    );

    const causalLinks: CausalLink[] = this.identifyCausalLinks(
      previousState,
      currentState
    );

    const temporalConstraints: TemporalConstraint[] = this.analyzeTemporalConstraints(
      previousState,
      currentState
    );

    const summary = this.generateSummary(
      diffs,
      causalLinks,
      temporalConstraints
    );

    return {
      currentStateId,
      previousStateId,
      diffs,
      causalLinks,
      temporalConstraints,
      summary,
    };
  }

  private calculateStructuralDiff(
    oldState: any,
    newState: any
  ): Record<string, any> {
    const diff: Record<string, any> = {};
    // Simplified deep diff for demonstration
    if (oldState.messages !== undefined && newState.messages !== undefined) {
      diff.messages = {
        added: this.getAddedMessages(oldState.messages, newState.messages),
        removed: this.getRemovedMessages(oldState.messages, newState.messages),
        changed: this.getChangedMessages(oldState.messages, newState.messages),
      };
    }
    return diff;
  }

  private getAddedMessages(oldMsgs: Message[], newMsgs: Message[]): Message[] {
    const oldMap = new Map(oldMsgs.map((m) => [JSON.stringify(m), true]));
    return newMsgs.filter((m) => !oldMap.has(JSON.stringify(m)));
  }

  private getRemovedMessages(oldMsgs: Message[], newMsgs: Message[]): Message[] {
    const newMap = new Map(newMsgs.map((m) => [JSON.stringify(m), true]));
    return oldMsgs.filter((m) => !newMap.has(JSON.stringify(m)));
  }

  private getChangedMessages(oldMsgs: Message[], newMsgs: Message[]): Message[] {
    const oldMap = new Map(oldMsgs.map((m) => JSON.stringify(m)));
    const newMap = new Map(newMsgs.map((m) => JSON.stringify(m)));
    const commonKeys = new Set([...oldMap.keys()].filter(key => newMap.has(key)));
    return Array.from(commonKeys).map(key => JSON.parse(key));
  }

  private identifyCausalLinks(
    oldState: any,
    newState: any
  ): CausalLink[] {
    const links: CausalLink[] = [];
    // Example: If the last message is a tool result, it causally follows the tool use in the previous state.
    if (newState.messages?.length > 0) {
      const lastMessage = newState.messages[newState.messages.length - 1];
      if (lastMessage.role === "tool" && oldState.messages?.length > 0) {
        const previousMessage = oldState.messages[oldState.messages.length - 1];
        if (previousMessage.role === "tool_use") {
          links.push({
            sourceStateId: this.history[this.history.length - 2]?.stateId || "unknown",
            targetStateId: this.history[this.history.length - 1]?.stateId || "unknown",
            causalReason: "Tool result directly follows tool use.",
          });
        }
      }
    }
    return links;
  }

  private analyzeTemporalConstraints(
    oldState: any,
    newState: any
  ): TemporalConstraint[] {
    const constraints: TemporalConstraint[] = [];
    const timeDiff = Date.now() - (this.history.length > 1 ? this.history[this.history.length - 2].timestamp : 0);

    if (timeDiff > 1000) {
      constraints.push({
        startTime: Date.now() - timeDiff,
        endTime: Date.now(),
        dependency: "Significant time gap detected, potential external interruption.",
      });
    }
    return constraints;
  }

  private generateSummary(
    diffs: Record<string, any>,
    links: CausalLink[],
    constraints: TemporalConstraint[]
  ): string {
    let summary = "State change analyzed. ";
    if (links.length > 0) {
      summary += `Causality established across ${links.length} link(s). `;
    }
    if (constraints.length > 0) {
      summary += `Temporal constraints noted (${constraints.length}). `;
    }
    if (diffs.messages?.added?.length > 0) {
      summary += `${diffs.messages.added.length} new messages added.`;
    } else {
      summary += "No significant structural changes detected.";
    }
    return summary;
  }
}