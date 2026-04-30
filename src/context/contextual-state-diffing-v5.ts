import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface DiffReport {
  dataDiff: Record<string, any>;
  structuralDrift: {
    added: string[];
    removed: string[];
    modified: { old: any; new: any };
  };
  decayImpact: number;
}

abstract class BaseStateDiffer {
  abstract diff(currentState: any, previousState: any): DiffReport;
}

export class ContextualStateDiffingV5 extends BaseStateDiffer {
  private readonly decayRate: number;

  constructor(decayRate: number = 0.1) {
    super();
    this.decayRate = decayRate;
  }

  private calculateDecayWeight(timestamp: number, currentTime: number): number {
    const timeDifference = currentTime - timestamp;
    if (timeDifference < 0) return 1.0;
    return Math.exp(-this.decayRate * timeDifference / 1000);
  }

  private calculateDataDiff(currentState: any, previousState: any): Record<string, any> {
    const dataDiff: Record<string, any> = {};
    const keys = new Set([...Object.keys(currentState), ...Object.keys(previousState)]);

    for (const key of keys) {
      const current = currentState[key];
      const previous = previousState[key];

      if (current === undefined && previous === undefined) continue;

      if (current === undefined) {
        dataDiff[key] = { status: "removed", value: previous };
      } else if (previous === undefined) {
        dataDiff[key] = { status: "added", value: current };
      } else if (typeof current !== typeof previous || JSON.stringify(current) !== JSON.stringify(previous)) {
        dataDiff[key] = { status: "modified", old: previous, new: current };
      }
    }
    return dataDiff;
  }

  private compareKnowledgeGraph(currentState: any, previousState: any): {
    added: string[];
    removed: string[];
    modified: { old: any; new: any }[];
  } {
    const currentGraph = currentState.knowledge_graph || {};
    const previousGraph = previousState.knowledge_graph || {};

    const added: string[] = [];
    const removed: string[] = [];
    const modified: { old: any; new: any }[] = [];

    const allKeys = new Set([...Object.keys(currentGraph), ...Object.keys(previousGraph)]);

    for (const key of allKeys) {
      const current = currentGraph[key];
      const previous = previousGraph[key];

      if (current === undefined && previous === undefined) continue;

      if (current === undefined) {
        removed.push(key);
      } else if (previous === undefined) {
        added.push(key);
      } else if (JSON.stringify(current) !== JSON.stringify(previous)) {
        modified.push({ old: previous, new: current });
      }
    }

    return { added, removed, modified };
  }

  diff(currentState: any, previousState: any): DiffReport {
    const currentTime = Date.now();
    const previousTimestamp = previousState.timestamp || currentTime;

    // 1. Data Diffing
    const dataDiff = this.calculateDataDiff(currentState, previousState);

    // 2. Structural Drift (Knowledge Graph)
    const structuralDrift = this.compareKnowledgeGraph(currentState, previousState);

    // 3. Temporal Decay Calculation (Simplified: based on time difference)
    const decayWeight = this.calculateDecayWeight(previousTimestamp, currentTime);

    return {
      dataDiff: dataDiff,
      structuralDrift: structuralDrift,
      decayImpact: decayWeight,
    };
  }
}