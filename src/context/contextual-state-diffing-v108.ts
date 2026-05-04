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

interface Context {
  goal: string;
  active_context: Record<string, any>;
}

interface DiffReport {
  path: string;
  oldValue: any;
  newValue: any;
  type: "structural" | "temporal" | "contextual";
  relevanceScore: number;
}

export class ContextualStateDiffer {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  private calculateRelevanceScore(
    path: string,
    oldValue: any,
    newValue: any,
    diffType: DiffReport["type"]
  ): number {
    let score = 0;

    if (diffType === "contextual") {
      if (typeof newValue === "string" && newValue.toLowerCase().includes("error")) {
        score += 0.8;
      }
    }

    if (diffType === "structural") {
      if (path.includes("tool_use")) {
        score += 0.5;
      }
    }

    if (diffType === "temporal") {
      if (typeof newValue === "number" && Math.abs(newValue - oldValue) > 0.1) {
        score += 0.3;
      }
    }

    // Goal relevance boost
    if (typeof newValue === "string" && this.context.goal.toLowerCase().includes("summary") && newValue.length > 50) {
      score += 0.4;
    }

    return Math.min(1.0, score);
  }

  private deepDiff(
    oldState: any,
    newState: any,
    path: string = "",
  ): DiffReport[] {
    const diffs: DiffReport[] = [];

    if (typeof oldState !== typeof newState) {
      diffs.push({
        path,
        oldValue: oldState,
        newValue: newState,
        type: "structural",
        relevanceScore: 1.0,
      });
      return diffs;
    }

    if (typeof oldState === "object" && oldState !== null && typeof newState === "object" && newState !== null) {
      const keys: Array<keyof typeof oldState & keyof typeof newState> = [
        ...(Object.keys(oldState) as Array<keyof typeof oldState>).filter(key => key in newState),
      ] as Array<keyof typeof oldState & keyof typeof newState>;

      for (const key of keys) {
        const newPath = path ? `${path}.${key}` : String(key);
        const oldVal = oldState[key];
        const newVal = newState[key];

        if (typeof oldVal === "object" && oldVal !== null && typeof newVal === "object" && newVal !== null) {
          diffs.push(...this.deepDiff(oldVal, newVal, newPath));
        } else if (oldVal !== newVal) {
          const diffType: DiffReport["type"] = "structural";
          const score = this.calculateRelevanceScore(newPath, oldVal, newVal, diffType);
          diffs.push({
            path: newPath,
            oldValue: oldVal,
            newValue: newVal,
            type: diffType,
            relevanceScore: score,
          });
        }
      }
    } else if (oldState !== newState) {
      // Simple value difference (Temporal/Contextual fallback)
      const diffType: DiffReport["type"] = "temporal";
      const score = this.calculateRelevanceScore(path, oldState, newState, diffType);
      diffs.push({
        path,
        oldValue: oldState,
        newValue: newState,
        type: diffType,
        relevanceScore: score,
      });
    }
    return diffs;
  }

  public diffState(oldState: any, newState: any): DiffReport[] {
    let diffs = this.deepDiff(oldState, newState);

    // Post-processing to simulate contextual/temporal scoring on top of structural diffs
    const finalDiffs: DiffReport[] = [];
    for (const diff of diffs) {
      let finalScore = diff.relevanceScore;
      let finalType = diff.type;

      if (diff.type === "structural") {
        // Re-evaluate score with more context
        finalScore = this.calculateRelevanceScore(
          diff.path,
          diff.oldValue,
          diff.newValue,
          "contextual"
        );
        finalType = "contextual";
      } else if (diff.type === "temporal") {
        // Boost score if the change relates to the goal keywords
        if (typeof diff.newValue === "string" && this.context.goal.toLowerCase().includes("key metric")) {
          finalScore += 0.3;
        }
      }

      finalDiffs.push({
        ...diff,
        relevanceScore: finalScore,
        type: finalType,
      });
    }

    return finalDiffs;
  }

  public filterDiff(
    diffs: DiffReport[],
    threshold: number
  ): DiffReport[] {
    return diffs.filter((diff) => diff.relevanceScore >= threshold);
  }
}