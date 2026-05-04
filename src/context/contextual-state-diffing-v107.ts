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

interface CausalLink {
  sourceEventId: string;
  targetStateKey: string;
  causalStrength: number;
  linkType: "reinforcement" | "contradiction" | "causal_gap";
}

interface StateDiffReport {
  diff: Record<string, any>;
  causalAnalysis: {
    gaps: string[];
    reinforcements: string[];
    ambiguities: string[];
  };
}

export class ContextualStateDiffer {
  private readonly stateSchema: Record<string, any>;

  constructor(stateSchema: Record<string, any>) {
    this.stateSchema = stateSchema;
  }

  private calculateSimpleDiff(stateA: Record<string, any>, stateB: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    for (const key in stateB) {
      if (Object.prototype.hasOwnProperty.call(stateB, key)) {
        const valueB = stateB[key];
        const valueA = stateA[key];

        if (typeof valueA !== typeof valueB || JSON.stringify(valueA) !== JSON.stringify(valueB)) {
          diff[key] = {
            old: valueA,
            new: valueB,
          };
        }
      }
    }
    return diff;
  }

  private analyzeCausalLinks(
    stateA: Record<string, any>,
    stateB: Record<string, any>,
    links: CausalLink[]
  ): {
    gaps: string[];
    reinforcements: string[];
    ambiguities: string[];
  } {
    const gaps: string[] = [];
    const reinforcements: string[] = [];
    const ambiguities: string[] = [];

    for (const link of links) {
      if (link.linkType === "causal_gap") {
        gaps.push(`Missing context for ${link.targetStateKey} derived from ${link.sourceEventId}.`);
      } else if (link.linkType === "reinforcement") {
        reinforcements.push(`Reinforced state ${link.targetStateKey} by ${link.sourceEventId}.`);
      } else if (link.linkType === "contradiction") {
        ambiguities.push(`Contradiction detected for ${link.targetStateKey} between states.`);
      }
    }
    return { gaps, reinforcements, ambiguities };
  }

  public calculateCausalDiff(
    stateA: Record<string, any>,
    stateB: Record<string, any>,
    causalLinks: CausalLink[]
  ): StateDiffReport {
    const simpleDiff = this.calculateSimpleDiff(stateA, stateB);
    const causalAnalysis = this.analyzeCausalLinks(stateA, stateB, causalLinks);

    const finalDiff: Record<string, any> = {
      ...simpleDiff,
      causal_context_shift: {
        gaps: causalAnalysis.gaps,
        reinforcements: causalAnalysis.reinforcements,
        ambiguities: causalAnalysis.ambiguities,
      },
    };

    return {
      diff: finalDiff,
      causalAnalysis: causalAnalysis,
    };
  }
}