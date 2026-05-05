import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CausalLink {
  sourceId: string;
  targetId: string;
  dependencyType: "CAUSES" | "IS_CAUSED_BY";
}

export interface TemporalMetadata {
  timestamp: number;
  sequenceIndex: number;
}

export interface CausalStateDiff {
  diffedElements: Record<string, any>;
  causalLinks: CausalLink[];
  metadata: TemporalMetadata;
}

interface StateHistoryNode {
  id: string;
  state: Record<string, any>;
  timestamp: number;
  causalDependencies: string[];
}

export class ContextualStateDiffer {
  private history: StateHistoryNode[];

  constructor(history: StateHistoryNode[] = []) {
    this.history = history;
  }

  private calculateDiff(oldState: Record<string, any>, newState: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    for (const key in newState) {
      if (!(key in oldState) || oldState[key] !== newState[key]) {
        diff[key] = newState[key];
      }
    }
    return diff;
  }

  private analyzeCausality(
    currentState: StateHistoryNode,
    previousState: StateHistoryNode,
  ): {
    diff: Record<string, any>;
    links: CausalLink[];
  } {
    const stateDiff = this.calculateDiff(previousState.state, currentState.state);
    const links: CausalLink[] = [];

    for (const key in stateDiff) {
      if (previousState.causalDependencies.includes(key)) {
        links.push({
          sourceId: key,
          targetId: key,
          dependencyType: "IS_CAUSED_BY",
        });
      }
    }

    return { diff: stateDiff, links };
  }

  public diffState(
    oldState: Record<string, any>,
    newState: Record<string, any>,
    history: StateHistoryNode[] = this.history,
  ): CausalStateDiff {
    if (history.length < 2) {
      return {
        diffedElements: this.calculateDiff(oldState, newState),
        causalLinks: [],
        metadata: { timestamp: Date.now(), sequenceIndex: history.length },
      };
    }

    const lastNode = history[history.length - 1];
    const { diff: diffFromLast, links: linksFromLast } = this.analyzeCausality(
      { id: "current", state: newState, timestamp: Date.now(), causalDependencies: [] },
      lastNode,
    );

    const finalDiff: Record<string, any> = {
      ...diffFromLast,
      ...this.calculateDiff(lastNode.state, newState),
    };

    const finalLinks: CausalLink[] = [
      ...linksFromLast,
    ];

    return {
      diffedElements: finalDiff,
      causalLinks: finalLinks,
      metadata: {
        timestamp: Date.now(),
        sequenceIndex: history.length,
      },
    };
  }
}